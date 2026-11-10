import { reservasService } from '../services/reservasService.js';
import { validarReserva, fechaHoy } from '../domain/reservas.js';
import { crearModeloReserva } from '../viewmodels/formularioReserva.js';
import { ErrorValidacion, ErrorConflicto, ErrorNoEncontrado } from '../domain/errores.js';

// Calcula los equipos libres SOLO si fecha y turno son válidos (reutiliza validarReserva)
function calcularDisponibilidad(fecha, turno) {
    const { errores } = validarReserva({ fecha, turno });   // el error de equipoId se ignora: aún no se ha elegido
    const erroresFT = {};
    if (errores.fecha) erroresFT.fecha = errores.fecha;
    if (errores.turno) erroresFT.turno = errores.turno;
    const equipos = Object.keys(erroresFT).length === 0 ? reservasService.equiposDisponibles(fecha, turno) : null;
    return { equipos, errores: erroresFT };
}

// Vuelve a pintar el formulario conservando los datos (se usa en los errores del POST)
function renderFormulario(res, status, datos, errores = {}, errorGeneral = null) {
    const fecha = String(datos.fecha ?? '');
    const turno = String(datos.turno ?? '');
    const disp = calcularDisponibilidad(fecha, turno);
    res.status(status).render('reservas/nueva', crearModeloReserva({
        fecha, turno, equipoId: datos.equipoId,
        equiposDisponibles: disp.equipos,
        errores: { ...disp.errores, ...errores },
        errorGeneral,
    }));
}

export const reservasController = {
    // GET /reservas/nueva?fecha=2027-01-20&turno=tarde
    nueva(req, res) {
        const fecha = String(req.query.fecha ?? '');
        const turno = String(req.query.turno ?? '');
        let equiposDisponibles = null;
        let errores = {};
        if (fecha || turno) {                       // en la primera visita no mostramos errores
            const disp = calcularDisponibilidad(fecha, turno);
            equiposDisponibles = disp.equipos;
            errores = disp.errores;
        }
        const status = Object.keys(errores).length > 0 ? 400 : 200;
        res.status(status).render('reservas/nueva', crearModeloReserva({
            fecha, turno, equipoId: req.query.equipoId, equiposDisponibles, errores,
        }));
    },

    // POST /reservas
    crear(req, res) {
        // TODO 1: dentro de un try, llama a reservasService.crear(usuarioId, datos)
        //         ⚠️ El usuarioId sale de req.usuario.id (SESIÓN), NUNCA de req.body
        let reserva;
        try {
            reserva = reservasService.crear(req.usuario.id, req.body);
        }
    //
    // TODO 2: en el catch, según el tipo de error:
    //   ErrorValidacion   → return renderFormulario(res, 400, req.body, err.errores)
    //   ErrorConflicto    → return renderFormulario(res, 409, req.body, {}, err.message)
    //   ErrorNoEncontrado → return renderFormulario(res, 404, req.body, {}, err.message)
    //   cualquier otro    → throw err
    catch (err) {
            if (err instanceof ErrorValidacion) return renderFormulario(res, 400, req.body, err.errores);
            if (err instanceof ErrorConflicto) return renderFormulario(res, 409, req.body, {}, err.message);
            if (err instanceof ErrorNoEncontrado) return renderFormulario(res, 404, req.body, {}, err.message);
            throw err;
        }
        //
        // TODO 3: si todo va bien (después del try/catch):
        //   - guarda en req.session.mensaje un texto de confirmación
        //   - redirige con 303 a /mis-reservas
        req.session.mensaje = 'Reserva creada con éxito';
        res.redirect(303, '/mis-reservas');
    },

    // GET /mis-reservas
    misReservas(req, res) {
        const hoy = fechaHoy();
        const reservas = reservasService.deUsuario(req.usuario.id).map((r) => ({
            ...r,
            puedeCancelar: r.estado === 'activa' && r.fecha >= hoy,   // solo para mostrar u ocultar el botón
        }));
        res.render('reservas/mis-reservas', { titulo: 'Mis reservas', reservas });
    },

    // POST /reservas/:id/cancelar
    cancelar(req, res) {
        // TODO 4: convierte req.params.id a número. Si no es un entero > 0 → lanza ErrorValidacion({ id: 'Identificador no válido' })
        //         (mira cómo lo hice en equiposController.ficha)
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ErrorValidacion({ id: 'Identificador no válido' });
        }
        // TODO 5: llama a reservasService.cancelar(id, req.usuario)
        //         Si falla, NO hace falta catch: los errores 403/404/409 los traduce el gestor centralizado
        reservasService.cancelar(id, req.usuario);
        req.session.mensaje = 'Reserva cancelada con éxito';
        // TODO 6: mensaje flash + redirect 303 a /mis-reservas
        res.redirect(303, '/mis-reservas');
    },
};