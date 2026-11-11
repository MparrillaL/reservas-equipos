import { equiposRepository } from "../repositories/equiposRepository.js";
import { reservasRepository } from "../repositories/reservasRepository.js";
import { usuariosRepository } from "../repositories/usuariosRepository.js";
import {
  estaReservado,
  obtenerEquiposDisponibles,
  validarReserva,
  fechaHoy,
} from "../domain/reservas.js";
import {
  ErrorValidacion,
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorProhibido,
} from "../domain/errores.js";

// Contiene TODA la lógica de negocio de las reservas. No conoce Express (sin req/res), así
// que se puede reutilizar desde cualquier controlador y probar sin levantar un servidor HTTP.
export const reservasService = {
  // Devuelve los equipos libres para una fecha y un turno concretos.
  equiposDisponibles(fecha, turno) {
    // Se consultan los datos actuales y la función de dominio calcula cuáles están disponibles.
    // El servicio aporta los DATOS (repositorios); el dominio aporta la REGLA (función pura).
    return obtenerEquiposDisponibles(
      equiposRepository.obtenerTodos(),
      reservasRepository.obtenerTodas(),
      fecha,
      turno,
    );
  },

  // Crea una reserva. usuarioId viene de la sesión, nunca del formulario (evita que alguien
  // reserve "en nombre de otro" manipulando el campo usuarioId de un formulario).
  crear(usuarioId, datos) {
    // Comprueba los datos recibidos y obtiene sus valores ya preparados.
    const { valido, errores, valores } = validarReserva(datos);
    if (!valido) throw new ErrorValidacion(errores); // 400

    // Busca el equipo solicitado para confirmar que existe y puede reservarse.
    const equipo = equiposRepository.obtenerPorId(valores.equipoId);
    if (!equipo) throw new ErrorNoEncontrado("El equipo no existe"); // 404
    if (equipo.estado !== "operativo") {
      throw new ErrorConflicto("El equipo está fuera de servicio"); // 409
    }
    // Se vuelve a comprobar aquí (en el servidor) aunque el formulario ya mostrara equipos
    // libres: entre que el usuario abrió el formulario y envió el POST, otra persona pudo
    // reservar ese mismo hueco. Confiar solo en lo que muestra el HTML sería inseguro.
    if (
      estaReservado(
        equipo.id,
        valores.fecha,
        valores.turno,
        reservasRepository.obtenerTodas(),
      )
    ) {
      throw new ErrorConflicto(
        "El equipo ya está reservado para esa fecha y turno",
      ); // 409
    }

    // Guarda los datos validados junto al usuario y deja la reserva activa.
    return reservasRepository.crear({
      ...valores,
      usuarioId,
      estado: "activa",
    });
  },

  // Añade a cada reserva la información de su equipo para que la vista pueda mostrarla
  // (p. ej. el código y nombre del equipo, no solo su id numérico).
  conEquipo(reservas) {
    // map crea una nueva lista; el spread conserva los datos originales de cada reserva.
    return reservas.map((r) => ({
      ...r,
      // Se busca el equipo relacionado usando el identificador guardado en la reserva.
      equipo: equiposRepository.obtenerPorId(r.equipoId),
    }));
  },

  // Obtiene las reservas de un usuario y añade la información de cada equipo. La usa
  // reservasController.misReservas: cada usuario solo ve LAS SUYAS (filtradas por usuarioId).
  deUsuario(usuarioId) {
    return this.conEquipo(reservasRepository.obtenerPorUsuario(usuarioId));
  },

  // Obtiene TODAS las reservas (de cualquier usuario) y añade el equipo y el nombre de quien
  // reservó. Solo la usa adminController.reservas, protegido por requiereRol('admin').
  todas() {
    return this.conEquipo(reservasRepository.obtenerTodas()).map((r) => ({
      ...r,
      // Solo el nombre: NUNCA pasar el objeto usuario completo (llevaría el passwordHash,
      // que no debe llegar ni a la vista ni, por tanto, al HTML final).
      usuarioNombre:
        usuariosRepository.obtenerPorId(r.usuarioId)?.nombre ?? "Desconocido",
    }));
  },

  // Cancela una reserva; "usuario" contiene el id y el rol de quien inició sesión (req.usuario).
  // Esta es la ÚNICA función que decide quién puede cancelar qué: tanto reservasController
  // (usuario normal) como adminController (administrador) la llaman igual, sin repetir reglas.
  cancelar(reservaId, usuario) {
    // Un administrador puede cancelar reservas de cualquier usuario: esta bandera se usa
    // más abajo para "desactivar" las comprobaciones de propiedad y de fecha pasada.
    const esAdmin = usuario.rol === "admin";
    // Primero se busca la reserva para verificar que existe y revisar sus datos.
    const reserva = reservasRepository.obtenerPorId(reservaId);

    if (!reserva) throw new ErrorNoEncontrado("La reserva no existe"); // 404
    // Si no es administrador, solo puede cancelar sus propias reservas. Esta comprobación
    // usa el id de la reserva guardado en el SERVIDOR (reserva.usuarioId), nunca el id que
    // pudiera venir en la petición: así no sirve de nada manipular la URL con otro id de reserva.
    if (!esAdmin && reserva.usuarioId !== usuario.id) {
      throw new ErrorProhibido(
        "No puedes cancelar una reserva de otro usuario",
      ); // 403
    }
    // Solo se permite cambiar reservas que todavía están activas (lista blanca de un solo
    // valor): no tiene sentido "cancelar" una reserva que ya estaba cancelada.
    if (reserva.estado !== "activa") {
      throw new ErrorConflicto("Solo se pueden cancelar reservas activas"); // 409
    }
    // Un usuario normal no puede cancelar una reserva cuya fecha ya pasó (evita manipular el
    // histórico); un administrador sí puede, para poder corregir datos a posteriori.
    if (!esAdmin && reserva.fecha < fechaHoy()) {
      throw new ErrorConflicto(
        "No se puede cancelar una reserva de una fecha pasada",
      ); // 409
    }

    // Se actualiza el estado para conservar el registro histórico de la reserva (no se borra).
    return reservasRepository.actualizarEstado(reservaId, "cancelada");
  },
};
