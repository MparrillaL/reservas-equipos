import { usuariosIniciales } from "./datosIniciales.js";

let usuarios = [];
let siguienteId = 1; // Simula el AUTO_INCREMENT de una BD

export const usuariosRepository = {
  // Devuelve copias de todos los usuarios para proteger los datos internos.
  // OJO: esto incluye el passwordHash; es responsabilidad de la capa de servicio (authService.sinHash)
  // quitarlo antes de que los datos lleguen a un controlador o a una vista.
  obtenerTodos() {
    return usuarios.map((u) => ({ ...u }));
  },

  // Busca un usuario por id; null indica que no existe.
  obtenerPorId(id) {
    const usuario = usuarios.find((u) => u.id === id);
    return usuario ? { ...usuario } : null;
  },

  // Busca por email sin distinguir mayúsculas y quitando espacios de los extremos.
  obtenerPorEmail(email) {
    const buscado = String(email).trim().toLowerCase(); // String(): por si llega algo que no es texto
    // trim(): quita espacios al principio y al final
    const usuario = usuarios.find((u) => u.email.toLowerCase() === buscado);
    return usuario ? { ...usuario } : null;
  },

  // Crea un usuario con un id consecutivo y devuelve una copia.
  crear(datos) {
    const nuevo = { ...datos, id: siguienteId++ };
    usuarios.push(nuevo);
    return { ...nuevo };
  },

  // Restaura los usuarios de ejemplo y prepara el siguiente identificador.
  // Se usa en los tests (beforeEach) para que cada prueba parta de los mismos datos.
  reiniciar() {
    usuarios = usuariosIniciales();
    siguienteId = Math.max(0, ...usuarios.map((u) => u.id)) + 1;
  },
};

usuariosRepository.reiniciar(); // Inicializa los usuarios al importar el módulo.
