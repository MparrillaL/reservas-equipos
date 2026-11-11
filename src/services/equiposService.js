import { equiposRepository } from "../repositories/equiposRepository.js";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO } from "../domain/equipos.js";
import {
  ErrorValidacion,
  ErrorNoEncontrado,
  ErrorConflicto,
} from "../domain/errores.js";

export const equiposService = {
  // tipo: '' = todos | soloOperativos: boolean
  listar({ tipo = "", soloOperativos = false }) {
    if (tipo && !TIPOS_EQUIPO.includes(tipo)) {
      throw new ErrorValidacion({ tipo: "Tipo de equipo no válido" }); // → 400
    }
    return equiposRepository
      .obtenerTodos()
      .filter((e) => !tipo || e.tipo === tipo) // sin tipo → no filtra
      .filter((e) => !soloOperativos || e.estado === "operativo");
  },

  obtener(id) {
    const equipo = equiposRepository.obtenerPorId(id);
    if (!equipo) throw new ErrorNoEncontrado("El equipo no existe"); // → 404
    return equipo;
  },

  crear(datos) {
    const errores = {};
    const valores = {};

    const codigo = String(datos.codigo ?? "")
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2,5}-\d{3}$/.test(codigo))
      errores.codigo = "El código debe tener el formato PC-001";
    else if (equiposRepository.obtenerPorCodigo(codigo))
      errores.codigo = "Ya existe un equipo con ese código";
    else valores.codigo = codigo;

    const nombre = String(datos.nombre ?? "").trim();
    if (nombre.length < 2 || nombre.length > 80)
      errores.nombre = "El nombre debe tener entre 2 y 80 caracteres";
    else valores.nombre = nombre;

    const tipo = String(datos.tipo ?? "");
    if (!TIPOS_EQUIPO.includes(tipo)) errores.tipo = "Tipo de equipo no válido";
    else valores.tipo = tipo;

    if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);
    return equiposRepository.crear({ ...valores, estado: "operativo" }); // los equipos nuevos nacen operativos
  },

  cambiarEstado(id, estado) {
    if (!ESTADOS_EQUIPO.includes(estado)) {
      throw new ErrorValidacion({ estado: "Estado no válido" }); // → 400
    }
    const equipo = equiposRepository.actualizarEstado(id, estado);
    if (!equipo) throw new ErrorNoEncontrado("El equipo no existe"); // → 404
    return equipo;
  },
};
