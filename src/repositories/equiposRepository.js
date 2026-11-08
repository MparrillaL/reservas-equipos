import { equiposIniciales } from './datosIniciales.js';

let equipos = [];       // "Tabla" privada: solo este módulo la ve
let siguienteId = 1;    // Simula el AUTO_INCREMENT de una BD

export const equiposRepository = {
  // Devuelve una copia de la lista para evitar que otros módulos cambien los datos internos.
  obtenerTodos() {
    return equipos.map((e) => ({ ...e }));             // map → array de copias
  },

  // Busca un equipo por su identificador; devuelve null cuando no existe.
  obtenerPorId(id) {
    const equipo = equipos.find((e) => e.id === id);   // find → primer elemento o undefined
    return equipo ? { ...equipo } : null;              // null = "no existe"
  },

  // Busca un equipo por su código único.
  obtenerPorCodigo(codigo) {
    const equipo = equipos.find((e) => e.codigo === codigo);
    return equipo ? { ...equipo } : null;
  },

  // Crea el equipo con un id consecutivo y devuelve una copia del registro.
  crear(datos) {
    const nuevo = { ...datos, id: siguienteId++ };
    equipos.push(nuevo);
    return { ...nuevo };
  },

  // Cambia el estado del equipo; devuelve null si el id no corresponde a ninguno.
  actualizarEstado(id, estado) {
    const equipo = equipos.find((e) => e.id === id);   // Aquí SÍ queremos el original para modificarlo
    if (!equipo) return null;
    equipo.estado = estado;
    return { ...equipo };
  },

  // Vuelve a cargar los datos de ejemplo y calcula el siguiente id disponible.
  reiniciar() {
    equipos = equiposIniciales();
    siguienteId = Math.max(0, ...equipos.map((e) => e.id)) + 1;
  },
};

equiposRepository.reiniciar();   // Inicializa los equipos al importar el módulo