import { equiposRepository } from '../repositories/equiposRepository.js';
import { reservasRepository } from '../repositories/reservasRepository.js';
import { estaReservado, obtenerEquiposDisponibles, validarReserva, fechaHoy } from '../domain/reservas.js';
import { ErrorValidacion, ErrorNoEncontrado, ErrorConflicto, ErrorProhibido } from '../domain/errores.js';

export const reservasService = {
  // Devuelve los equipos libres para una fecha y un turno concretos.
  equiposDisponibles(fecha, turno) {
    // Se consultan los datos actuales y la función de dominio calcula cuáles están disponibles.
    return obtenerEquiposDisponibles(
      equiposRepository.obtenerTodos(), reservasRepository.obtenerTodas(), fecha, turno
    );
  },

  // Crea una reserva. usuarioId viene de la sesión, nunca del formulario.
  crear(usuarioId, datos) {
    // Comprueba los datos recibidos y obtiene sus valores ya preparados.
    const { valido, errores, valores } = validarReserva(datos);
    if (!valido) throw new ErrorValidacion(errores);                       // 400

    // Busca el equipo solicitado para confirmar que existe y puede reservarse.
    const equipo = equiposRepository.obtenerPorId(valores.equipoId);
    if (!equipo) throw new ErrorNoEncontrado('El equipo no existe');       // 404
    if (equipo.estado !== 'operativo') {
      throw new ErrorConflicto('El equipo está fuera de servicio');        // 409
    }
    // Se vuelve a comprobar para evitar reservas duplicadas aunque el formulario muestre equipos libres.
    if (estaReservado(equipo.id, valores.fecha, valores.turno, reservasRepository.obtenerTodas())) {
      throw new ErrorConflicto('El equipo ya está reservado para esa fecha y turno');  // 409
    }

    // Guarda los datos validados junto al usuario y deja la reserva activa.
    return reservasRepository.crear({ ...valores, usuarioId, estado: 'activa' });
  },

  // Añade a cada reserva la información de su equipo para que la vista pueda mostrarla.
  conEquipo(reservas) {
    // map crea una nueva lista; el spread conserva los datos originales de cada reserva.
    return reservas.map((r) => ({
      ...r,
      // Se busca el equipo relacionado usando el identificador guardado en la reserva.
      equipo: equiposRepository.obtenerPorId(r.equipoId),
    }));
  },

  // Obtiene las reservas de un usuario y añade la información de cada equipo.
  deUsuario(usuarioId) {
    return this.conEquipo(reservasRepository.obtenerPorUsuario(usuarioId));
  },

  // Obtiene todas las reservas y añade la información de cada equipo.
  todas() {
    return this.conEquipo(reservasRepository.obtenerTodas());
  },

  // Cancela una reserva; usuario contiene el id y el rol de quien inició sesión.
  cancelar(reservaId, usuario) {
    // Un administrador puede cancelar reservas de cualquier usuario.
    const esAdmin = usuario.rol === 'admin';
    // Primero se busca la reserva para verificar que existe y revisar sus datos.
    const reserva = reservasRepository.obtenerPorId(reservaId);

    if (!reserva) throw new ErrorNoEncontrado('La reserva no existe');                // 404
    // Si no es administrador, solo puede cancelar sus propias reservas.
    if (!esAdmin && reserva.usuarioId !== usuario.id) {
      throw new ErrorProhibido('No puedes cancelar una reserva de otro usuario');     // 403
    }
    // Solo se permite cambiar reservas que todavía están activas.
    if (reserva.estado !== 'activa') {                                                // lista blanca
      throw new ErrorConflicto('Solo se pueden cancelar reservas activas');           // 409
    }
    // Un usuario normal no puede cancelar una reserva cuya fecha ya pasó.
    if (!esAdmin && reserva.fecha < fechaHoy()) {
      throw new ErrorConflicto('No se puede cancelar una reserva de una fecha pasada'); // 409
    }

    // Se actualiza el estado para conservar el registro histórico de la reserva.
    return reservasRepository.actualizarEstado(reservaId, 'cancelada');   // cambia el estado, no borra
  },
};