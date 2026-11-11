export const TURNOS = ["manana", "tarde"]; // lista blanca de turnos válidos

// Devuelve true si hay una reserva ACTIVA del equipo en esa fecha y turno.
// Es la regla central para evitar que dos personas reserven el mismo equipo al mismo tiempo.
export function estaReservado(equipoId, fecha, turno, reservas) {
  // some() termina al encontrar una coincidencia; las canceladas NO ocupan el equipo,
  // por eso se excluyen explícitamente con "r.estado !== 'cancelada'".
  return reservas.some(
    (r) =>
      r.equipoId === equipoId &&
      r.fecha === fecha &&
      r.turno === turno &&
      r.estado !== "cancelada",
  );
}

// Devuelve los equipos operativos que no tienen una reserva activa para esa fecha y turno.
// (Un equipo fuera de servicio nunca aparece como disponible, aunque nadie lo haya reservado.)
export function obtenerEquiposDisponibles(equipos, reservas, fecha, turno) {
  return equipos.filter(
    (e) =>
      e.estado === "operativo" && !estaReservado(e.id, fecha, turno, reservas),
  );
}

// Fecha de hoy en formato 'YYYY-MM-DD' según la hora LOCAL (no UTC, que podría dar el día
// siguiente o anterior según la zona horaria del servidor).
export function fechaHoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0"); // getMonth() empieza en 0 (enero = 0)
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Comprueba que el texto es una fecha REAL ('2027-02-30' no lo es, aunque el formato sea correcto)
function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false; // Formato YYYY-MM-DD
  const [a, m, d] = texto.split("-").map(Number); // Conversión texto → número
  const fecha = new Date(a, m - 1, d);
  // Si JS "corrige" la fecha (30 feb → 2 mar), los campos ya no coincidirán con los originales
  return (
    fecha.getFullYear() === a &&
    fecha.getMonth() === m - 1 &&
    fecha.getDate() === d
  );
}

// Valida el FORMATO de los datos de una reserva. No consulta repositorios (eso lo hace el
// servicio, que es quien sabe si el equipo existe o si ya está reservado): esta función de
// dominio es pura y se puede probar sin montar la aplicación entera.
// 'hoy' es un parámetro (en vez de llamar a fechaHoy() dentro) para poder fijar la fecha en los tests.
export function validarReserva(datos, hoy = fechaHoy()) {
  const errores = {};
  const valores = {}; // Valores ya convertidos y limpios, listos para guardar

  // Convierte el identificador del equipo a número y exige que sea positivo.
  const equipoId = Number(datos.equipoId);
  if (!Number.isInteger(equipoId) || equipoId <= 0) {
    errores.equipoId = "Selecciona un equipo válido";
  } else {
    valores.equipoId = equipoId;
  }

  // La fecha debe existir y no puede ser anterior a la fecha actual.
  const fecha = String(datos.fecha ?? "").trim();
  if (!esFechaValida(fecha)) {
    errores.fecha = "Introduce una fecha válida";
  } else if (fecha < hoy) {
    // Las cadenas YYYY-MM-DD se pueden comparar directamente como texto
    errores.fecha = "La fecha no puede ser anterior a hoy";
  } else {
    valores.fecha = fecha;
  }

  // Solo se aceptan los turnos definidos al inicio del módulo (lista blanca).
  const turno = String(datos.turno ?? "");
  if (!TURNOS.includes(turno)) {
    errores.turno = "El turno debe ser mañana o tarde";
  } else {
    valores.turno = turno;
  }

  // Devuelve los errores y los campos limpios para que el servicio decida qué hacer con ellos.
  return { valido: Object.keys(errores).length === 0, errores, valores };
}
