import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { crearApp } from "../src/app.js";
import { equiposRepository } from "../src/repositories/equiposRepository.js";
import { reservasRepository } from "../src/repositories/reservasRepository.js";
import { usuariosRepository } from "../src/repositories/usuariosRepository.js";

let app;

// Antes de CADA test: datos iniciales limpios y app nueva. Esto garantiza que un test
// no deje datos "contaminados" que afecten al resultado del siguiente (aislamiento de tests).
beforeEach(() => {
  equiposRepository.reiniciar();
  reservasRepository.reiniciar();
  usuariosRepository.reiniciar();
  app = crearApp();
});

// ---------- Helpers ----------

// Hace GET a una página y saca el token CSRF del HTML con una expresión regular.
// Imita lo que haría un navegador real: leer el <input type="hidden" name="_csrf"> del formulario.
async function obtenerCsrf(agente, url = "/login") {
  const res = await agente.get(url);
  const coincidencia = res.text.match(/name="_csrf" value="([^"]+)"/);
  return coincidencia[1];
}

// Inicia sesión con un agente (que guardará la cookie automáticamente entre peticiones)
// y devuelve la respuesta completa, por si el test necesita inspeccionar sus cabeceras.
async function iniciarSesion(agente, email, password) {
  const _csrf = await obtenerCsrf(agente);
  return agente.post("/login").type("form").send({ email, password, _csrf });
}

// Una fecha siempre futura (dentro de un año), para que el test no caduque con el
// tiempo: validarReserva() rechaza fechas anteriores a hoy, así que no se puede usar una fija.
function fechaFutura() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ---------- Pruebas ----------

describe("Autenticación", () => {
  it("1. registra un usuario válido", async () => {
    const agente = request.agent(app);
    const _csrf = await obtenerCsrf(agente, "/registro");
    const res = await agente.post("/registro").type("form").send({
      nombre: "Marta",
      email: "marta@example.com",
      password: "Marta1234",
      _csrf,
    });

    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/login");
    // Comprueba que el rol se fuerza a 'usuario' en el servidor, aunque el formulario
    // no tenga ningún campo "rol" que se pudiera manipular.
    expect(usuariosRepository.obtenerPorEmail("marta@example.com").rol).toBe(
      "usuario",
    );
  });

  it("2. rechaza credenciales incorrectas", async () => {
    // Comprueba que una contraseña errónea da 401, sin revelar si el fallo fue
    // el correo o la contraseña (mismo mensaje y código en ambos casos, ver authService).
    const res = await iniciarSesion(
      request.agent(app),
      "ana@example.com",
      "malamala",
    );
    expect(res.status).toBe(401);
  });

  it("3. redirige al login si se accede a una ruta privada sin sesión", async () => {
    // request(app) SIN agente: cada petición es independiente, no guarda cookies,
    // así que esta petición llega sin ninguna sesión iniciada.
    const res = await request(app).get("/perfil");
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/login");
  });

  it("4. permite el acceso a una ruta privada con sesión", async () => {
    const agente = request.agent(app); // este SÍ guarda la cookie de sesión entre peticiones
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const res = await agente.get("/perfil");

    expect(res.status).toBe(200);
    expect(res.text).toContain("ana@example.com");
  });

  it("10. invalida la sesión tras el logout", async () => {
    const agente = request.agent(app);
    const login = await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const cookieAntigua = login.headers["set-cookie"]; // guardamos la cookie de sesión de ANTES del logout

    const _csrf = await obtenerCsrf(agente, "/perfil");
    await agente.post("/logout").type("form").send({ _csrf });

    // Reutilizamos la cookie ANTIGUA a mano (en vez de dejar que el agente use la nueva):
    // si la sesión se destruyó de verdad en el SERVIDOR (destruirSesion/req.session.destroy),
    // esa cookie antigua ya no sirve, aunque el navegador la siga enviando.
    const res = await request(app).get("/perfil").set("Cookie", cookieAntigua);
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/login");
  });
});

describe("Autorización y seguridad", () => {
  it("5. impide a un usuario ordinario una operación de admin", async () => {
    // Ana tiene rol 'usuario'; requiereRol('admin') debe cortarle el paso con 403
    // ANTES de que el controlador llegue a tocar el equipo.
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const _csrf = await obtenerCsrf(agente, "/perfil");
    const res = await agente
      .post("/admin/equipos/1/estado")
      .type("form")
      .send({ estado: "fuera_de_servicio", _csrf });

    expect(res.status).toBe(403);
    expect(equiposRepository.obtenerPorId(1).estado).toBe("operativo"); // no ha cambiado: la petición nunca llegó al servicio
  });

  it("8. impide cancelar una reserva ajena", async () => {
    // La reserva 2 es de Luis (datos iniciales); Ana intenta cancelarla manipulando
    // directamente la URL. reservasService.cancelar debe rechazarlo con 403.
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const _csrf = await obtenerCsrf(agente, "/perfil");
    const res = await agente
      .post("/reservas/2/cancelar")
      .type("form")
      .send({ _csrf });

    expect(res.status).toBe(403);
    expect(reservasRepository.obtenerPorId(2).estado).toBe("activa"); // sigue activa: no se llegó a cancelar
  });

  it("9. rechaza un cambio de estado sin token CSRF válido", async () => {
    // Se envía un token inventado en vez del que corresponde a la sesión: proteccionCsrf
    // debe rechazarlo con 403 antes de que la reserva llegue a cancelarse.
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const res = await agente
      .post("/reservas/1/cancelar")
      .type("form")
      .send({ _csrf: "token-falso" });

    expect(res.status).toBe(403);
    expect(reservasRepository.obtenerPorId(1).estado).toBe("activa");
  });
});

describe("Reservas", () => {
  it("6. crea una reserva válida de un equipo disponible", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const _csrf = await obtenerCsrf(agente, "/reservas/nueva");
    const res = await agente
      .post("/reservas")
      .type("form")
      .send({ equipoId: "2", fecha: fechaFutura(), turno: "manana", _csrf });

    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/mis-reservas");
    expect(reservasRepository.obtenerPorUsuario(2)).toHaveLength(2); // tenía 1 (dato inicial), ahora 2
  });

  it("7. rechaza una reserva duplicada para el mismo equipo, fecha y turno", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "luis@example.com", "Luis12345");
    const _csrf = await obtenerCsrf(agente, "/reservas/nueva");
    // El equipo 1 ya está reservado por Ana el 2027-01-15 por la mañana (datos iniciales):
    // estaReservado() debe detectarlo y el servicio debe lanzar ErrorConflicto → 409.
    const res = await agente
      .post("/reservas")
      .type("form")
      .send({ equipoId: "1", fecha: "2027-01-15", turno: "manana", _csrf });

    expect(res.status).toBe(409);
  });
});
