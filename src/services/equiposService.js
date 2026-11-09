import { equiposRepository } from '../repositories/equiposRepository.js';
import { TIPOS_EQUIPO } from '../domain/equipos.js';
import { ErrorValidacion, ErrorNoEncontrado } from '../domain/errores.js';

export const equiposService = {
  // tipo: '' = todos | soloOperativos: boolean
  listar({ tipo = '', soloOperativos = false }) {
    if (tipo && !TIPOS_EQUIPO.includes(tipo)) {
      throw new ErrorValidacion({ tipo: 'Tipo de equipo no válido' });   // → 400
    }
    return equiposRepository.obtenerTodos()
      .filter((e) => !tipo || e.tipo === tipo)                          // sin tipo → no filtra
      .filter((e) => !soloOperativos || e.estado === 'operativo');
  },

  obtener(id) {
    const equipo = equiposRepository.obtenerPorId(id);
    if (!equipo) throw new ErrorNoEncontrado('El equipo no existe');     // → 404
    return equipo;
  },
};