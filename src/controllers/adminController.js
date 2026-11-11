import { equiposService } from "../services/equiposService.js";
import { reservasService } from "../services/reservasService.js";
import { TIPOS_EQUIPO } from "../domain/equipos.js";
import { ErrorValidacion } from "../domain/errores.js";
import { parsearId } from "../utils/parsearId.js";

// Vuelve a pintar el formulario de equipos (lista + alta) conservando errores y valores.
// Se extrae a una función aparte porque dos acciones distintas (ver la página y fallar
// al crear un equipo) necesitan renderizar exactamente la misma vista con los mismos datos.
function renderEquipos(res, status = 200, errores = {}, valores = {}) {
  res.status(status).render("admin/equipos", {
    titulo: "Administrar equipos",
    equipos: equiposService.listar({}),
    tipos: TIPOS_EQUIPO,
    errores,
    valores,
  });
}

// Todas las rutas de este controlador están protegidas por requiereRol('admin')
// en src/routes/adminRoutes.js (router.use), así que aquí ya se da por hecho que
// req.usuario existe y tiene rol 'admin'; no hace falta comprobarlo de nuevo.
export const adminController = {
  // GET /admin/equipos
  equipos(req, res) {
    renderEquipos(res);
  },

  // POST /admin/equipos
  crearEquipo(req, res) {
    let equipo;
    try {
      equipo = equiposService.crear(req.body);
    } catch (err) {
      if (err instanceof ErrorValidacion) {
        // Se vuelve a mostrar el formulario con los errores y lo que el admin ya había escrito
        return renderEquipos(res, 400, err.errores, {
          codigo: req.body.codigo,
          nombre: req.body.nombre,
          tipo: req.body.tipo,
        });
      }
      throw err;
    }
    req.session.mensaje = `Equipo ${equipo.codigo} creado correctamente`;
    res.redirect(303, "/admin/equipos");
  },

  // POST /admin/equipos/:id/estado
  cambiarEstado(req, res) {
    const id = parsearId(req.params.id); // /admin/equipos/abc/estado → 400
    const equipo = equiposService.cambiarEstado(id, req.body.estado); // estado inválido → 400; id inexistente → 404
    req.session.mensaje = `${equipo.codigo} ahora está ${equipo.estado}`;
    res.redirect(303, "/admin/equipos");
  },

  // GET /admin/reservas
  reservas(req, res) {
    const reservas = reservasService
      .todas() // TODAS las reservas, de cualquier usuario (solo accesible para el admin)
      .map((r) => ({ ...r, puedeCancelar: r.estado === "activa" }));
    res.render("admin/reservas", { titulo: "Administrar reservas", reservas });
  },

  // POST /admin/reservas/:id/cancelar
  // Reutiliza EXACTAMENTE el mismo reservasService.cancelar() que usa el usuario normal
  // (ver reservasController.cancelar). No hace falta ningún código especial aquí para que
  // el admin pueda cancelar reservas ajenas: reservasService.cancelar ya recibe req.usuario
  // completo (con su rol) y es ÉL quien decide, con "esAdmin = usuario.rol === 'admin'",
  // saltarse las comprobaciones de propiedad y de fecha pasada. Una sola función, una sola regla.
  cancelarReserva(req, res) {
    const id = parsearId(req.params.id);
    reservasService.cancelar(id, req.usuario);
    req.session.mensaje = "Reserva cancelada con éxito";
    res.redirect(303, "/admin/reservas");
  },
};
