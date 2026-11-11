import { reservasService } from "../services/reservasService.js";
import { validarReserva, fechaHoy } from "../domain/reservas.js";
import { crearModeloReserva } from "../viewmodels/formularioReserva.js";
import {
  ErrorValidacion,
  ErrorConflicto,
  ErrorNoEncontrado,
} from "../domain/errores.js";
import { parsearId } from "../utils/parsearId.js";

// Calcula los equipos libres SOLO si fecha y turno son válidos (reutiliza validarReserva de dominio,
// así la regla de qué es una fecha/turno válidos no se duplica entre el formulario y la creación real)
function calcularDisponibilidad(fecha, turno) {
  const { errores } = validarReserva({ fecha, turno }); // el error de equipoId se ignora: aún no se ha elegido
  const erroresFT = {};
  if (errores.fecha) erroresFT.fecha = errores.fecha;
  if (errores.turno) erroresFT.turno = errores.turno;
  const equipos =
    Object.keys(erroresFT).length === 0
      ? reservasService.equiposDisponibles(fecha, turno)
      : null;
  return { equipos, errores: erroresFT };
}

// Vuelve a pintar el formulario conservando los datos (se usa en los errores del POST)
function renderFormulario(
  res,
  status,
  datos,
  errores = {},
  errorGeneral = null,
) {
  const fecha = String(datos.fecha ?? "");
  const turno = String(datos.turno ?? "");
  const disp = calcularDisponibilidad(fecha, turno);
  res.status(status).render(
    "reservas/nueva",
    crearModeloReserva({
      fecha,
      turno,
      equipoId: datos.equipoId,
      equiposDisponibles: disp.equipos,
      errores: { ...disp.errores, ...errores },
      errorGeneral,
    }),
  );
}

export const reservasController = {
  // GET /reservas/nueva?fecha=2027-01-20&turno=tarde — Paso 1 del formulario (elegir fecha y turno)
  nueva(req, res) {
    const fecha = String(req.query.fecha ?? "");
    const turno = String(req.query.turno ?? "");
    let equiposDisponibles = null;
    let errores = {};
    if (fecha || turno) {
      // en la primera visita no mostramos errores
      const disp = calcularDisponibilidad(fecha, turno);
      equiposDisponibles = disp.equipos;
      errores = disp.errores;
    }
    const status = Object.keys(errores).length > 0 ? 400 : 200;
    res.status(status).render(
      "reservas/nueva",
      crearModeloReserva({
        fecha,
        turno,
        equipoId: req.query.equipoId,
        equiposDisponibles,
        errores,
      }),
    );
  },

  // POST /reservas
  crear(req, res) {
    // El usuarioId sale SIEMPRE de req.usuario.id (dato de la SESIÓN), nunca de req.body:
    // si se leyera del formulario, cualquiera podría crear una reserva "a nombre de otro".
    let reserva;
    try {
      reserva = reservasService.crear(req.usuario.id, req.body);
    } catch (err) {
      // Cada tipo de error de negocio se traduce a su código HTTP y se vuelve a pintar
      // el formulario con el error correspondiente (conservando fecha, turno y equipo elegidos).
      if (err instanceof ErrorValidacion)
        return renderFormulario(res, 400, req.body, err.errores);
      if (err instanceof ErrorConflicto)
        return renderFormulario(res, 409, req.body, {}, err.message);
      if (err instanceof ErrorNoEncontrado)
        return renderFormulario(res, 404, req.body, {}, err.message);
      throw err; // cualquier otro error (inesperado) lo recoge el gestor centralizado
    }
    // Si todo fue bien: mensaje flash de un solo uso y Post/Redirect/Get a /mis-reservas
    // (evita que recargar la página reenvíe el formulario y duplique la reserva).
    req.session.mensaje = "Reserva creada con éxito";
    res.redirect(303, "/mis-reservas");
  },

  // GET /mis-reservas
  misReservas(req, res) {
    const hoy = fechaHoy();
    const reservas = reservasService.deUsuario(req.usuario.id).map((r) => ({
      ...r,
      puedeCancelar: r.estado === "activa" && r.fecha >= hoy, // solo para mostrar u ocultar el botón; la regla REAL se repite en el servicio
    }));
    res.render("reservas/mis-reservas", { titulo: "Mis reservas", reservas });
  },

  // POST /reservas/:id/cancelar
  cancelar(req, res) {
    const id = parsearId(req.params.id);
    // No hace falta try/catch aquí: si reservasService.cancelar lanza ErrorProhibido (403),
    // ErrorNoEncontrado (404) o ErrorConflicto (409), el gestor centralizado de errores
    // (src/middlewares/errores.js) ya sabe traducirlos al código HTTP correcto.
    reservasService.cancelar(id, req.usuario);
    req.session.mensaje = "Reserva cancelada con éxito";
    res.redirect(303, "/mis-reservas");
  },
};
