import { equiposService } from "../services/equiposService.js";
import { TIPOS_EQUIPO } from "../domain/equipos.js";
import { ErrorValidacion } from "../domain/errores.js";
import { config } from "../config/config.js";
import { parsearId } from "../utils/parsearId.js";

const COOKIE_PREFERENCIA = "tipoPreferido";
const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

export const equiposController = {
  // GET /equipos?tipo=portatil&operativos=true
  listar(req, res) {
    let tipo = req.query.tipo;
    // Prioridad: 1) filtro de la URL  2) cookie de preferencia  3) sin filtro
    if (tipo === undefined) {
      const preferido = req.cookies[COOKIE_PREFERENCIA];
      tipo = TIPOS_EQUIPO.includes(preferido) ? preferido : ""; // la cookie se VALIDA: el cliente puede manipularla
    }
    if (tipo === "todos") tipo = "";

    const soloOperativos = req.query.operativos === "true"; // conversión texto → boolean
    const equipos = equiposService.listar({
      tipo: String(tipo),
      soloOperativos,
    });

    res.render("equipos/lista", {
      titulo: "Equipos",
      equipos,
      tipos: TIPOS_EQUIPO,
      filtros: { tipo, soloOperativos },
    });
  },

  // GET /equipos/:id
  ficha(req, res) {
    const id = parsearId(req.params.id); // /equipos/abc → 400
    const equipo = equiposService.obtener(id); // si no existe → 404
    res.render("equipos/ficha", { titulo: equipo.nombre, equipo });
  },

  // POST /preferencias
  guardarPreferencia(req, res) {
    const tipo = req.body.tipo;
    if (!TIPOS_EQUIPO.includes(tipo)) {
      throw new ErrorValidacion({ tipo: "Tipo de equipo no válido" });
    }
    res.cookie(COOKIE_PREFERENCIA, tipo, {
      maxAge: TREINTA_DIAS, // dura 30 días aunque cierres el navegador
      httpOnly: true, // JS del navegador no puede leerla
      sameSite: "lax",
      secure: config.esProduccion, // en producción, solo por HTTPS
    });
    res.redirect(303, "/equipos"); // 303: después de un POST, ve con GET a esta URL
  },
};
