import { equiposRepository } from '../repositories/equiposRepository.js';
import { reservasRepository } from '../repositories/reservasRepository.js';
import { estaReservado, obtenerEquiposDisponibles, validarReserva, fechaHoy } from '../domain/reservas.js';
import { ErrorValidacion, ErrorNoEncontrado, ErrorConflicto, ErrorProhibido } from '../domain/errores.js';

export const reservasService = {
  equiposDisponibles(fecha, turno) {
    return obtenerEquiposDisponibles(
      equiposRepository.obtenerTodos(), reservasRepository.obtenerTodas(), fecha, turno
    );
  },

  // usuarioId viene de la SESIÓN (lo pasará el controlador), nunca del formulario
  crear(usuarioId, datos) {
    const { valido, errores, valores } = validarReserva(datos);
    if (!valido) throw new ErrorValidacion(errores);                       // 400

    const equipo = equiposRepository.obtenerPorId(valores.equipoId);
    if (!equipo) throw new ErrorNoEncontrado('El equipo no existe');       // 404
    if (equipo.estado !== 'operativo') {
      throw new ErrorConflicto('El equipo está fuera de servicio');        // 409
    }
    // Se repite la comprobación aunque el formulario solo ofrezca equipos libres
    if (estaReservado(equipo.id, valores.fecha, valores.turno, reservasRepository.obtenerTodas())) {
      throw new ErrorConflicto('El equipo ya está reservado para esa fecha y turno');  // 409
    }

    return reservasRepository.crear({ ...valores, usuarioId, estado: 'activa' });
  },

  // Añade el nombre del equipo a cada reserva (map) para mostrarlo en la vista
  conEquipo(reservas) {
    return reservas.map((r) => ({
      ...r,
      equipo: equiposRepository.obtenerPorId(r.equipoId),
    }));
  },

  deUsuario(usuarioId) {
    return this.conEquipo(reservasRepository.obtenerPorUsuario(usuarioId));
  },

  todas() {
    return this.conEquipo(reservasRepository.obtenerTodas());
  },

  // usuario = { id, rol }, el usuario autenticado
    cancelar(reservaId, usuario) {
    const esAdmin = usuario.rol === 'admin';
    const reserva = reservasRepository.obtenerPorId(reservaId);

    if (!reserva) throw new ErrorNoEncontrado('La reserva no existe');                // 404
    if (!esAdmin && reserva.usuarioId !== usuario.id) {
      throw new ErrorProhibido('No puedes cancelar una reserva de otro usuario');     // 403
    }
    if (reserva.estado !== 'activa') {                                                // lista blanca
      throw new ErrorConflicto('Solo se pueden cancelar reservas activas');           // 409
    }
    if (!esAdmin && reserva.fecha < fechaHoy()) {
      throw new ErrorConflicto('No se puede cancelar una reserva de una fecha pasada'); // 409
    }

    return reservasRepository.actualizarEstado(reservaId, 'cancelada');   // cambia el estado, no borra
  },
};