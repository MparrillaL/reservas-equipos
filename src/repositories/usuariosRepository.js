import { usuariosIniciales } from './datosIniciales.js';

let usuarios = [];
let siguienteId = 1;    // Simula el AUTO_INCREMENT de una BD

export const usuariosRepository = {
  obtenerTodos() {
    return usuarios.map((u) => ({ ...u }));
  },

  obtenerPorId(id) {
    const usuario = usuarios.find((u) => u.id === id);
    return usuario ? { ...usuario } : null;
  },

  obtenerPorEmail(email) {
  const buscado = String(email).trim().toLowerCase();   // String(): por si llega algo que no es texto
                                                         // trim(): quita espacios al principio y al final
  const usuario = usuarios.find((u) => u.email.toLowerCase() === buscado);
  return usuario ? { ...usuario } : null;
},

  crear(datos) {
    const nuevo = { ...datos, id: siguienteId++ };
    usuarios.push(nuevo);
    return { ...nuevo };
  },

  reiniciar() {
    usuarios = usuariosIniciales();
    siguienteId = Math.max(0, ...usuarios.map((u) => u.id)) + 1;
  },
};

usuariosRepository.reiniciar();