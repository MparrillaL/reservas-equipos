import { fechaHoy } from "../domain/reservas.js";

const TURNOS_VISTA = [
  { valor: "manana", etiqueta: "Mañana" }, // valor interno ≠ texto visible
  { valor: "tarde", etiqueta: "Tarde" },
];

// Construye TODO lo que necesita la vista reservas/nueva.ejs, en un único objeto.
// Centralizar aquí la transformación de datos evita lógica de presentación repartida
// entre el controlador y la plantilla EJS (que solo debería limitarse a pintar el HTML).
// equiposDisponibles = null → aún no se ha elegido fecha y turno (paso 1 del formulario)
export function crearModeloReserva({
  fecha = "",
  turno = "",
  equipoId = "",
  equiposDisponibles = null,
  errores = {},
  errorGeneral = null,
}) {
  return {
    titulo: "Nueva reserva",
    hoy: fechaHoy(), // para el atributo min del input date (no se puede elegir el pasado)
    fecha,
    turno,
    turnos: TURNOS_VISTA.map((t) => ({
      ...t,
      seleccionado: t.valor === turno,
    })),
    mostrarEquipos: equiposDisponibles !== null, // ¿pintamos el paso 2 (selector de equipo)?
    equipos: (equiposDisponibles ?? []).map((e) => ({
      id: e.id,
      texto: `${e.codigo} · ${e.nombre}`,
      seleccionado: String(e.id) === String(equipoId), // conserva la selección tras un error de validación
    })),
    errores,
    errorGeneral, // errores que no son de un campo concreto (p. ej. un 409 de conflicto)
  };
}
