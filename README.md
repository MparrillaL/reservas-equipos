# Sistema de reserva de equipos informáticos

Práctica de las unidades didácticas 2 y 3 de **Desarrollo Web en Entorno Servidor (DWES)**.

Aplicación web para gestionar la reserva de equipos informáticos de un centro educativo. Los usuarios consultan los equipos, los reservan para una fecha y turno, consultan sus reservas y las cancelan. Los administradores gestionan los equipos y todas las reservas.

**Tecnologías:** Node.js, Express 5, EJS, express-session, bcrypt, express-rate-limit, TypeScript, Vitest y Supertest.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación y configuración](#2-instalación-y-configuración)
3. [Ejecución](#3-ejecución)
4. [Usuarios de prueba](#4-usuarios-de-prueba)
5. [Arquitectura](#5-arquitectura)
6. [Implementación de cada funcionalidad](#6-implementación-de-cada-funcionalidad)
7. [Ejemplos con curl](#7-ejemplos-con-curl)
8. [TypeScript](#8-typescript)
9. [Pruebas automatizadas](#9-pruebas-automatizadas)
10. [Limitaciones conocidas](#10-limitaciones-conocidas)
11. [Uso de inteligencia artificial](#11-uso-de-inteligencia-artificial)

---

## 1. Requisitos

- Node.js 20 o superior (desarrollado con Node.js 24).
- npm.
- Git Bash, Linux o macOS para ejecutar los ejemplos de curl tal cual (usan `grep` y `sed`).

## 2. Instalación y configuración

```bash
git clone https://github.com/MparrillaL/reservas-equipos.git
cd reservas-equipos
npm install
```

Crea el archivo `.env` a partir de la plantilla:

```bash
cp .env.example .env
```

Genera un secreto aleatorio y pégalo como valor de `SESSION_SECRET` en `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variable         | Valores admitidos                   | Descripción                             |
| ---------------- | ----------------------------------- | --------------------------------------- |
| `PORT`           | Entero entre 1 y 65535              | Puerto del servidor (por defecto 3000)  |
| `NODE_ENV`       | `development`, `production`, `test` | Entorno de ejecución                    |
| `SESSION_SECRET` | Cadena de al menos 32 caracteres    | Secreto para firmar la cookie de sesión |

La configuración se valida al arrancar (`src/config/config.js`). Si algún valor es incorrecto, el servidor **no arranca** y muestra todos los errores. El archivo `.env` está excluido del repositorio mediante `.gitignore`.

## 3. Ejecución

```bash
npm run dev     # desarrollo (se reinicia al cambiar archivos de src/)
npm start       # ejecución normal
```

Abre `http://localhost:3000`.

> En `NODE_ENV=production` la cookie de sesión es `secure` y solo viaja por HTTPS, por lo que en `http://localhost` no se puede iniciar sesión. Para probar en local usa `development`.

## 4. Usuarios de prueba

Se cargan en memoria al arrancar (`src/repositories/datosIniciales.js`). Las contraseñas se guardan como hash de bcrypt.

| Nombre        | Correo              | Contraseña  | Rol     |
| ------------- | ------------------- | ----------- | ------- |
| Administrador | `admin@example.com` | `Admin1234` | admin   |
| Ana García    | `ana@example.com`   | `Ana12345`  | usuario |
| Luis Pérez    | `luis@example.com`  | `Luis12345` | usuario |

Datos iniciales: 3 equipos (`PC-001`, `PORT-001` y `PC-002`, este último fuera de servicio) y 3 reservas (dos activas y una cancelada).

## 5. Arquitectura

El proyecto está organizado por capas. Cada capa solo se comunica con la siguiente:

```
Petición → routes → middlewares → controllers → services → repositories → datos en memoria
                                       ↓            ↓
                                     views        domain
```

```
src/
├── server.js          Arranque: crea la app y la pone a escuchar en el puerto
├── app.js             Montaje: middleware y rutas en orden (no llama a listen)
├── config/            Lectura y validación de las variables de entorno
├── routes/            URL, método HTTP y middleware de cada ruta
├── middlewares/       Sesión, autenticación, roles, CSRF, rate limit y errores
├── controllers/       Leen y convierten los datos de la petición y deciden la respuesta HTTP
├── viewmodels/        Modelo de vista del formulario de reservas
├── services/          Reglas de negocio (sin req, res ni EJS)
├── domain/            Funciones puras, constantes y errores de dominio
├── repositories/      Acceso a las colecciones en memoria
├── utils/             Promesas sobre los métodos de express-session
└── views/             Plantillas EJS y parciales
ts/                    Núcleo de reservas tipado en TypeScript
tests/                 Pruebas con Vitest y Supertest
```

**Decisiones principales**

- **`app.js` separado de `server.js`:** Supertest prueba la aplicación sin abrir un puerto.
- **Servicios sin `req` ni `res`:** las reglas de disponibilidad, conflictos y cancelación están en `src/services` y `src/domain`, se pueden reutilizar y se pueden probar sin HTTP.
- **Errores de dominio** (`src/domain/errores.js`): los servicios lanzan `ErrorValidacion`, `ErrorCredenciales`, `ErrorProhibido`, `ErrorNoEncontrado` y `ErrorConflicto`, y el gestor centralizado (`src/middlewares/errores.js`) los traduce a 400, 401, 403, 404 y 409.
- **Repositorios que devuelven copias:** nadie puede modificar los datos internos sin pasar por el repositorio. Cambiar a una base de datos solo afectaría a esta capa.

## 6. Implementación de cada funcionalidad

### 6.1. Consulta de equipos

- `GET /equipos` con los filtros `tipo` (`portatil` o `sobremesa`) y `operativos=true`. Los filtros se validan contra una lista blanca: un tipo desconocido devuelve 400.
- `GET /equipos/:id` muestra la ficha del equipo. Un id no numérico devuelve 400 y un id inexistente, 404.
- La disponibilidad depende de la fecha y el turno: `estaReservado()` y `obtenerEquiposDisponibles()` (`src/domain/reservas.js`) solo tienen en cuenta las reservas **activas**.

### 6.2. Registro y autenticación

- **Registro:** se validan el nombre, el correo y la contraseña (8-72 caracteres, el límite de bcrypt), y el correo no puede estar duplicado (se compara en minúsculas). La contraseña se guarda con `bcrypt.hash` y el rol es siempre `usuario`, aunque el cliente envíe otro.
- **Login:** se compara con `bcrypt.compare`. Si el correo no existe se compara igualmente con un hash ficticio, para que el tiempo de respuesta no revele qué correos están registrados. El mensaje de error es siempre el mismo ("Correo o contraseña incorrectos", 401).
- Al iniciar sesión se **regenera el identificador de sesión** (`req.session.regenerate`), lo que evita la fijación de sesión, y solo se guarda `usuarioId`. El usuario se vuelve a leer del repositorio en cada petición (`src/middlewares/sesion.js`).
- **Logout:** destruye la sesión en el servidor (`req.session.destroy`) y retira la cookie (`res.clearCookie`).
- **Rate limit:** máximo 5 intentos fallidos de login por IP cada 15 minutos (`express-rate-limit`), con respuesta 429.

### 6.3. Creación de reservas

- Formulario en dos pasos sin JavaScript en el navegador: `GET /reservas/nueva?fecha=…&turno=…` calcula los equipos disponibles y `POST /reservas` crea la reserva.
- El formulario se construye con un **modelo de vista** (`src/viewmodels/formularioReserva.js`).
- El usuario se obtiene de la sesión (`req.usuario.id`), nunca del formulario.
- El servicio repite **todas** las comprobaciones en el POST: datos válidos (`validarReserva`), equipo existente, equipo operativo, fecha no anterior a hoy, turno válido y que no haya otra reserva activa con el mismo equipo, fecha y turno (409).
- Si todo es correcto se aplica **Post/Redirect/Get** (303 a `/mis-reservas`) con un mensaje de confirmación de un solo uso. Si hay errores, se vuelve a mostrar el formulario con los errores y los valores enviados.

### 6.4. Consulta y cancelación de reservas

- `GET /mis-reservas` muestra las reservas activas y canceladas del usuario.
- `POST /reservas/:id/cancelar`: el servicio comprueba que la reserva existe (404), que **pertenece al usuario** (403, aunque se manipule el id de la URL), que está activa (409) y que su fecha no ha pasado (409).
- Cancelar cambia el estado a `cancelada`, sin borrar el registro. Una reserva cancelada no bloquea el equipo.

### 6.5. Administración

- Las rutas `/admin/*` se montan con `app.use('/admin', adminRoutes)` y se protegen con `router.use(requiereRol('admin'))`. Un usuario ordinario recibe 403, incluso si envía la petición directamente.
- El administrador puede añadir equipos (con código único y formato `PC-001`), cambiar su estado entre `operativo` y `fuera_de_servicio`, consultar todas las reservas y cancelar cualquier reserva activa. Para cancelar se reutiliza el mismo `reservasService.cancelar()`, que no aplica las comprobaciones de propiedad y de fecha cuando el usuario es administrador.

### 6.6. Cookies y sesiones

- **Cookie de preferencias** `tipoPreferido` (`POST /preferencias`): recuerda el tipo de equipo preferido y establece el filtro inicial del catálogo. Su valor se valida con una lista blanca y **nunca** se usa para decidir permisos.
- **Sesión del servidor** (`express-session`): guarda la identidad (`usuarioId`), los mensajes de confirmación de un solo uso y el token CSRF. La cookie de sesión se configura con `httpOnly`, `secure` (en producción), `sameSite: 'lax'` y `maxAge` de 2 horas.

### 6.7. Seguridad

| Requisito                   | Implementación                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Middleware de autenticación | `requiereAutenticacion` (`src/middlewares/auth.js`) → 303 a `/login`                                                           |
| Autorización por roles      | `requiereRol(...roles)` → 403                                                                                                  |
| Propiedad de las reservas   | `reservasService.cancelar()`                                                                                                   |
| CSRF                        | `src/middlewares/csrf.js`: un token aleatorio por sesión, comprobado en todos los POST con una comparación en tiempo constante |
| Limitación de intentos      | `src/middlewares/rateLimit.js`                                                                                                 |
| Validación                  | En el servidor: `validarReserva`, `validarRegistro` y las validaciones de los servicios y controladores                        |
| Errores centralizados       | `src/middlewares/errores.js`: sin trazas ni datos internos en la respuesta                                                     |
| XSS                         | Toda la salida de datos en EJS usa `<%= %>`, que escapa el HTML                                                                |

## 7. Ejemplos con curl

Los ejemplos usan **Git Bash, Linux o macOS**. Para mantener la sesión, todas las peticiones usan un archivo de cookies:

- `-c cookies.txt` guarda las cookies que envía el servidor.
- `-b cookies.txt` envía las cookies guardadas.

Los formularios que modifican datos exigen un **token CSRF**. Este se obtiene del HTML de cualquier página con la función:

```bash
csrf() {
  curl -s -c cookies.txt -b cookies.txt "http://localhost:3000$1" \
    | grep -o 'name="_csrf" value="[^"]*"' | head -1 | sed 's/.*value="//;s/"$//'
}
```

> **Importante:** al iniciar sesión se regenera la sesión y, con ella, el token CSRF. Después del login hay que **volver a obtener el token**.

Antes de empezar, borra las cookies anteriores:

```bash
rm -f cookies.txt
```

### Consulta de equipos (pública)

```bash
curl -i http://localhost:3000/equipos
curl -i "http://localhost:3000/equipos?tipo=portatil"
curl -i "http://localhost:3000/equipos?tipo=sobremesa"
curl -i "http://localhost:3000/equipos?operativos=true"
curl -i "http://localhost:3000/equipos?tipo=portatil&operativos=true"
curl -i http://localhost:3000/equipos/1
curl -i http://localhost:3000/equipos/99      # 404
curl -i http://localhost:3000/equipos/abc     # 400
```

### Cookie de preferencias

```bash
TOKEN=$(csrf /equipos)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/preferencias \
  -d "tipo=portatil&_csrf=$TOKEN"                                # 303 a /equipos
curl -s -b cookies.txt http://localhost:3000/equipos | grep -c "PORT-"   # filtrado por portátil
```

### Registro

```bash
TOKEN=$(csrf /registro)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/registro \
  -d "nombre=Marta&email=marta@example.com&password=Marta1234&_csrf=$TOKEN"   # 303 a /login

TOKEN=$(csrf /registro)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/registro \
  -d "nombre=Otra&email=ana@example.com&password=Otra12345&_csrf=$TOKEN"      # 400: correo duplicado
```

### Login, perfil y logout

```bash
rm -f cookies.txt
TOKEN=$(csrf /login)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/login \
  -d "email=ana@example.com&password=mala&_csrf=$TOKEN"          # 401

TOKEN=$(csrf /login)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/login \
  -d "email=ana@example.com&password=Ana12345&_csrf=$TOKEN"      # 303 a /perfil

curl -i -b cookies.txt http://localhost:3000/perfil              # 200

TOKEN=$(csrf /perfil)                                            # token NUEVO tras el login
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/logout \
  -d "_csrf=$TOKEN"                                              # 303 a /login

curl -i -b cookies.txt http://localhost:3000/perfil              # 303 a /login
```

### Reservas (como Ana)

Sustituye `2027-03-01` por cualquier fecha futura.

```bash
rm -f cookies.txt
TOKEN=$(csrf /login)
curl -s -c cookies.txt -b cookies.txt -X POST http://localhost:3000/login \
  -d "email=ana@example.com&password=Ana12345&_csrf=$TOKEN" -o /dev/null

# Equipos disponibles para una fecha y turno
curl -i -b cookies.txt "http://localhost:3000/reservas/nueva?fecha=2027-03-01&turno=manana"

# Crear una reserva
TOKEN=$(csrf /reservas/nueva)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/reservas \
  -d "equipoId=2&fecha=2027-03-01&turno=manana&_csrf=$TOKEN"     # 303 a /mis-reservas

# La misma reserva otra vez → conflicto
TOKEN=$(csrf /reservas/nueva)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/reservas \
  -d "equipoId=2&fecha=2027-03-01&turno=manana&_csrf=$TOKEN"     # 409

# Equipo fuera de servicio
TOKEN=$(csrf /reservas/nueva)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/reservas \
  -d "equipoId=3&fecha=2027-03-01&turno=tarde&_csrf=$TOKEN"      # 409

# Mis reservas
curl -i -b cookies.txt http://localhost:3000/mis-reservas

# Cancelar una reserva propia (la 1 es de Ana)
TOKEN=$(csrf /mis-reservas)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/reservas/1/cancelar \
  -d "_csrf=$TOKEN"                                              # 303 a /mis-reservas

# Cancelar una reserva AJENA (la 2 es de Luis)
TOKEN=$(csrf /mis-reservas)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/reservas/2/cancelar \
  -d "_csrf=$TOKEN"                                              # 403

# Sin token CSRF
curl -i -b cookies.txt -X POST http://localhost:3000/reservas/1/cancelar   # 403

# Ruta de administración con un usuario ordinario
TOKEN=$(csrf /mis-reservas)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/admin/equipos/1/estado \
  -d "estado=fuera_de_servicio&_csrf=$TOKEN"                     # 403
```

### Administración (como admin)

```bash
rm -f cookies.txt
TOKEN=$(csrf /login)
curl -s -c cookies.txt -b cookies.txt -X POST http://localhost:3000/login \
  -d "email=admin@example.com&password=Admin1234&_csrf=$TOKEN" -o /dev/null

curl -i -b cookies.txt http://localhost:3000/admin/equipos

# Añadir un equipo
TOKEN=$(csrf /admin/equipos)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/admin/equipos \
  -d "codigo=PC-003&nombre=Ordenador aula 3&tipo=sobremesa&_csrf=$TOKEN"   # 303

# Cambiar el estado de un equipo
TOKEN=$(csrf /admin/equipos)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/admin/equipos/1/estado \
  -d "estado=fuera_de_servicio&_csrf=$TOKEN"                     # 303

# Todas las reservas
curl -i -b cookies.txt http://localhost:3000/admin/reservas

# Cancelar cualquier reserva activa
TOKEN=$(csrf /admin/reservas)
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3000/admin/reservas/2/cancelar \
  -d "_csrf=$TOKEN"                                              # 303
```

Todas estas operaciones también se pueden realizar desde la interfaz HTML.

## 8. TypeScript

La carpeta `ts/` contiene una versión tipada del núcleo de gestión de reservas:

- `tipos.ts`: tipos unión (`Rol`, `Turno`, `EstadoReserva`, `EstadoEquipo`, `TipoEquipo`), las interfaces `Equipo`, `Reserva` y `Usuario`, y la interfaz `RepositorioReservas`.
- `repositorioReservasMap.ts`: clase `RepositorioReservasMap` que implementa `RepositorioReservas` con un `Map<number, Reserva>`.
- `servicioReservas.ts`: clase `ServicioReservas` que recibe el repositorio por **inyección de dependencias** en el constructor.
- `demo.ts`: ejemplo de uso.

Se compila con `strict: true`, sin usar `any`:

```bash
npm run build:ts          # compila ts/src → ts/dist
node ts/dist/demo.js      # ejecuta la demostración
```

## 9. Pruebas automatizadas

```bash
npm test
```

Se usan **Vitest** y **Supertest**. Las pruebas no necesitan un servidor arrancado: importan `crearApp()` y reinician los repositorios antes de cada prueba, así que usan siempre los mismos datos de partida.

| #   | Comportamiento comprobado                                                       |
| --- | ------------------------------------------------------------------------------- |
| 1   | Registro de un usuario válido                                                   |
| 2   | Rechazo de credenciales incorrectas (401)                                       |
| 3   | Acceso a una ruta privada sin autenticación (303 a `/login`)                    |
| 4   | Acceso correcto a una ruta privada con sesión (200)                             |
| 5   | Rechazo de una operación de administrador hecha por un usuario ordinario (403)  |
| 6   | Reserva válida de un equipo disponible (303)                                    |
| 7   | Rechazo de una reserva duplicada para el mismo equipo, fecha y turno (409)      |
| 8   | Rechazo de la cancelación de una reserva ajena (403)                            |
| 9   | Rechazo de un cambio de estado sin token CSRF válido (403)                      |
| 10  | Invalidación de la sesión después del logout (la cookie antigua deja de servir) |

## 10. Limitaciones conocidas

- **Datos en memoria:** al reiniciar el servidor se pierden los cambios. El enunciado no exige base de datos, y gracias a los repositorios cambiar a una solo afectaría a esa capa.
- **Almacén de sesiones en memoria** (el `MemoryStore` por defecto de express-session): sirve para desarrollo, pero en producción habría que usar un almacén persistente (por ejemplo, Redis).
- **Rate limit en memoria:** los contadores se reinician al reiniciar el servidor y no se comparten entre varias instancias.
- **El registro indica si un correo ya existe:** es necesario para cumplir el requisito de no duplicar correos. El login, en cambio, no permite distinguirlo.
- **Validación del id repetida** en varios controladores: se podría extraer a una función común.

## 11. Uso de inteligencia artificial

Historial de la conversación: **(https://claude.ai/share/501e2411-4746-4bf0-8a58-586706cc50ab)**

He usado Claude como tutor durante el desarrollo. En las primeras fases (configuración, repositorios y lógica de dominio) escribí yo el código y la IA lo revisó y me explicó los errores: comparaciones con mayúsculas y minúsculas, listas negras frente a listas blancas, referencias frente a copias o métodos inexistentes. Por falta de tiempo, en algunas fases posteriores la IA me proporcionó código comentado que revisé, probé e integré. Las piezas clave de seguridad y de negocio (comprobación de propiedad, middleware de roles, verificación del token CSRF, controladores de reservas y administración, y los tipos de TypeScript) las escribí yo con su orientación. También la usé para aprender a leer y depurar errores (orden de los middleware, módulos no encontrados) y para preparar la defensa.
