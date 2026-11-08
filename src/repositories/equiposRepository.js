import { equiposIniciales } from './datosIniciales.js';

let equipos = [];       // "Tabla" privada: solo este módulo la ve
let siguienteId = 1;    // Simula el AUTO_INCREMENT de una BD

export const equiposRepository = {
  obtenerTodos() {
    return equipos.map((e) => ({ ...e }));             // map → array de copias
  },

  obtenerPorId(id) {
    const equipo = equipos.find((e) => e.id === id);   // find → primer elemento o undefined
    return equipo ? { ...equipo } : null;              // null = "no existe"
  },

  obtenerPorCodigo(codigo) {
    const equipo = equipos.find((e) => e.codigo === codigo);
    return equipo ? { ...equipo } : null;
  },

  crear(datos) {
    const nuevo = { ...datos, id: siguienteId++ };
    equipos.push(nuevo);
    return { ...nuevo };
  },

  actualizarEstado(id, estado) {
    const equipo = equipos.find((e) => e.id === id);   // Aquí SÍ queremos el original para modificarlo
    if (!equipo) return null;
    equipo.estado = estado;
    return { ...equipo };
  },

  reiniciar() {
    equipos = equiposIniciales();
    siguienteId = Math.max(0, ...equipos.map((e) => e.id)) + 1;
  },
};

equiposRepository.reiniciar();   // Carga los datos iniciales al importar el módulo