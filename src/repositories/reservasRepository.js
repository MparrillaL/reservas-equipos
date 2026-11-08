import { reservasIniciales } from './datosIniciales.js';

let reservas = [];
let siguienteId = 1;

export const reservasRepository = {
  obtenerTodas() {
    return reservas.map((r) => ({ ...r }));
  },

  obtenerPorId(id) {
    const reserva = reservas.find((r) => r.id === id);
    return reserva ? { ...reserva } : null;
  },

  obtenerPorUsuario(usuarioId) {
    return reservas.filter((r) => r.usuarioId === usuarioId)   // filter → todas las que cumplen
                   .map((r) => ({ ...r }));
  },

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

  reiniciar() {
    reservas = reservasIniciales();
    siguienteId = Math.max(0, ...reservas.map((r) => r.id)) + 1;
  },
};

reservasRepository.reiniciar();