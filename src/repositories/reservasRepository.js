import { reservasIniciales } from './datosIniciales.js';

let reservas = [];
let siguienteId = 1;

export const reservasRepository = {
  // Devuelve copias para proteger la lista guardada dentro de este módulo.
  obtenerTodas() {
    return reservas.map((r) => ({ ...r }));
  },

  // Busca una reserva por id; null indica que no se encontró.
  obtenerPorId(id) {
    const reserva = reservas.find((r) => r.id === id);
    return reserva ? { ...reserva } : null;
  },

  // Filtra las reservas del usuario y devuelve copias de esos registros.
  obtenerPorUsuario(usuarioId) {
    return reservas.filter((r) => r.usuarioId === usuarioId)   // filter → todas las que cumplen
                   .map((r) => ({ ...r }));
  },

  // Añade una reserva con un identificador consecutivo.
  crear(datos) {
    const nueva = { ...datos, id: siguienteId++ };
    reservas.push(nueva);
    return { ...nueva };
  },

  actualizarEstado(id, estado) {      // Cancelar = cambiar estado, NUNCA borrar
    const reserva = reservas.find((r) => r.id === id);
    if (!reserva) return null;
    reserva.estado = estado;
    return { ...reserva };
  },

  // Restaura los datos de ejemplo y deja el siguiente id listo para nuevas reservas.
  reiniciar() {
    reservas = reservasIniciales();
    siguienteId = Math.max(0, ...reservas.map((r) => r.id)) + 1;
  },
};

reservasRepository.reiniciar(); // Inicializa las reservas al importar el módulo.