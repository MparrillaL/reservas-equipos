import { reservasIniciales } from "./datosIniciales.js";

// "Tabla" privada en memoria: solo este módulo puede tocar estas variables directamente.
// El resto de la aplicación solo accede a ellas a través de las funciones exportadas de abajo,
// igual que no se accede directamente a las tablas de una base de datos desde cualquier sitio.
let reservas = [];
let siguienteId = 1; // Simula el AUTO_INCREMENT de una base de datos

export const reservasRepository = {
  // Devuelve copias para proteger la lista guardada dentro de este módulo:
  // si alguien modificase el objeto devuelto, no afectaría a los datos reales.
  obtenerTodas() {
    return reservas.map((r) => ({ ...r }));
  },

  // Busca una reserva por id; null indica que no se encontró (en vez de "undefined"),
  // así el resto del código solo tiene que comprobar "if (!reserva)" en un único sitio.
  obtenerPorId(id) {
    const reserva = reservas.find((r) => r.id === id);
    return reserva ? { ...reserva } : null;
  },

  // Filtra las reservas del usuario y devuelve copias de esos registros.
  obtenerPorUsuario(usuarioId) {
    return reservas
      .filter((r) => r.usuarioId === usuarioId) // filter → todas las que cumplen
      .map((r) => ({ ...r }));
  },

  // Añade una reserva con un identificador consecutivo.
  crear(datos) {
    const nueva = { ...datos, id: siguienteId++ };
    reservas.push(nueva);
    return { ...nueva };
  },

  // Cancelar = cambiar estado, NUNCA borrar: se conserva el histórico de reservas
  // (útil, por ejemplo, para poder mostrar "reservas canceladas" en vez de que desaparezcan).
  actualizarEstado(id, estado) {
    const reserva = reservas.find((r) => r.id === id); // aquí SÍ se usa el original, para poder modificarlo
    if (!reserva) return null;
    reserva.estado = estado;
    return { ...reserva };
  },

  // Restaura los datos de ejemplo y deja el siguiente id listo para nuevas reservas.
  // Se llama en cada test (beforeEach) para que todas las pruebas partan de los mismos datos,
  // sin que lo que haga un test afecte a los demás.
  reiniciar() {
    reservas = reservasIniciales();
    siguienteId = Math.max(0, ...reservas.map((r) => r.id)) + 1;
  },
};

reservasRepository.reiniciar(); // Inicializa las reservas al importar el módulo.
