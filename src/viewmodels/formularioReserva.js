import { fechaHoy } from '../domain/reservas.js';

const TURNOS_VISTA = [
  { valor: 'manana', etiqueta: 'Mañana' },   // valor interno ≠ texto visible
  { valor: 'tarde', etiqueta: 'Tarde' },
];

// Construye TODO lo que necesita la vista. La v
// equiposDisponibles = null → aún no se ha elegido fecha y turno (paso 1)
export function crearModeloReserva({
  fecha = '', turno = '', equipoId = '', equiposDisponibles = null, errores = {}, errorGeneral = null,
}) {
  return {
    titulo: 'Nueva reserva',
    hoy: fechaHoy(),                                   // para el atributo min del input date
    fecha,
    turno,
    turnos: TURNOS_VISTA.map((t) => ({ ...t, seleccionado: t.valor === turno })),
    mostrarEquipos: equiposDisponibles !== null,       // ¿pintamos el paso 2?
    equipos: (equiposDisponibles ?? []).map((e) => ({
      id: e.id,
      texto: `${e.codigo} · ${e.nombre}`,
      seleccionado: String(e.id) === String(equipoId), // conserva la selección tras un error
    })),
    errores,
    errorGeneral,                                      // errores que no son de un campo (p. ej. 409)
  };
}