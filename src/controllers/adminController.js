import { equiposService } from "../services/equiposService.js";
import { reservasService } from "../services/reservasService.js";
import { TIPOS_EQUIPO } from "../domain/equipos.js";
import { ErrorValidacion } from "../domain/errores.js";
import { parsearId } from "../utils/parsearId.js";

function renderEquipos(res, status = 200, errores = {}, valores = {}) {
  res.status(status).render("admin/equipos", {
    titulo: "Administrar equipos",
    equipos: equiposService.listar({}),
    tipos: TIPOS_EQUIPO,
    errores,
    valores,
  });
}

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
    const id = parsearId(req.params.id);
    const equipo = equiposService.cambiarEstado(id, req.body.estado);
    req.session.mensaje = `${equipo.codigo} ahora está ${equipo.estado}`;
    res.redirect(303, "/admin/equipos");
  },

  // GET /admin/reservas
  reservas(req, res) {
    const reservas = reservasService
      .todas()
      .map((r) => ({ ...r, puedeCancelar: r.estado === "activa" }));
    res.render("admin/reservas", { titulo: "Administrar reservas", reservas });
  },

  // POST /admin/reservas/:id/cancelar
  cancelarReserva(req, res) {
    const id = parsearId(req.params.id);
    reservasService.cancelar(id, req.usuario);
    req.session.mensaje = "Reserva cancelada con éxito";
    res.redirect(303, "/admin/reservas");
  },
};
