import { equiposRepository } from "../repositories/equiposRepository.js";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO } from "../domain/equipos.js";
import {
  ErrorValidacion,
  ErrorNoEncontrado,
  ErrorConflicto, // no se usa todavía en este servicio; se deja importado por si se necesita en el futuro
} from "../domain/errores.js";

export const equiposService = {
  // tipo: '' = todos | soloOperativos: boolean
  listar({ tipo = "", soloOperativos = false }) {
    // Se valida el filtro "tipo" contra la lista blanca ANTES de usarlo: si alguien manipula
    // la URL (?tipo=cualquier-cosa), se rechaza con 400 en vez de devolver una lista vacía silenciosamente.
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

  // Crea un equipo nuevo (solo lo usa el administrador, ver adminController.crearEquipo).
  crear(datos) {
    const errores = {};
    const valores = {};

    // El código se normaliza a MAYÚSCULAS antes de validar el formato y la unicidad,
    // así "pc-003" y "PC-003" se tratan como el mismo código.
    const codigo = String(datos.codigo ?? "")
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2,5}-\d{3}$/.test(codigo))
      errores.codigo = "El código debe tener el formato PC-001";
    else if (equiposRepository.obtenerPorCodigo(codigo))
      errores.codigo = "Ya existe un equipo con ese código"; // evita códigos duplicados
    else valores.codigo = codigo;

    const nombre = String(datos.nombre ?? "").trim();
    if (nombre.length < 2 || nombre.length > 80)
      errores.nombre = "El nombre debe tener entre 2 y 80 caracteres";
    else valores.nombre = nombre;

    // El tipo se valida contra la lista blanca (TIPOS_EQUIPO), igual que en listar():
    // así nunca se puede crear un equipo con un tipo inventado por el cliente.
    const tipo = String(datos.tipo ?? "");
    if (!TIPOS_EQUIPO.includes(tipo)) errores.tipo = "Tipo de equipo no válido";
    else valores.tipo = tipo;

    // Se acumulan TODOS los errores de los tres campos y se lanzan juntos, para que el
    // formulario pueda mostrarlos todos a la vez en vez de obligar a corregir uno por uno.
    if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);
    return equiposRepository.crear({ ...valores, estado: "operativo" }); // los equipos nuevos nacen operativos
  },

  // Cambia el estado de un equipo entre 'operativo' y 'fuera_de_servicio' (solo lo usa el administrador).
  cambiarEstado(id, estado) {
    // Lista blanca: solo se aceptan los valores definidos en ESTADOS_EQUIPO.
    if (!ESTADOS_EQUIPO.includes(estado)) {
      throw new ErrorValidacion({ estado: "Estado no válido" }); // → 400
    }
    const equipo = equiposRepository.actualizarEstado(id, estado);
    if (!equipo) throw new ErrorNoEncontrado("El equipo no existe"); // → 404: el repositorio devuelve null si el id no existe
    return equipo;
  },
};
