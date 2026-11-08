export const TURNOS = ['manana', 'tarde'];

// Devuelve true si hay una reserva ACTIVA del equipo en esa fecha y turno
export function estaReservado(equipoId, fecha, turno, reservas) {
  // TODO (tú): usa some()
  // Ojo: una reserva CANCELADA no bloquea el equipo
  return reservas.some((r) => r.equipoId === equipoId && r.fecha === fecha && r.turno === turno && r.estado !== 'cancelada');
}

// Devuelve los equipos operativos que NO están reservados en esa fecha y turno
export function obtenerEquiposDisponibles(equipos, reservas, fecha, turno) {
  // TODO (tú): usa filter() y reutiliza estaReservado()
  return equipos.filter((e) => e.estado === 'activo' && !estaReservado(e.id, fecha, turno, reservas));
}
// Fecha de hoy en formato 'YYYY-MM-DD' según la hora LOCAL (no UTC)
export function fechaHoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');   // getMonth() empieza en 0
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Comprueba que el texto es una fecha REAL ('2027-02-30' no lo es)
function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;    // Formato YYYY-MM-DD
  const [a, m, d] = texto.split('-').map(Number);           // Conversión texto → número
  const fecha = new Date(a, m - 1, d);
  // Si JS "corrige" la fecha (30 feb → 2 mar), no coincidirá
  return fecha.getFullYear() === a && fecha.getMonth() === m - 1 && fecha.getDate() === d;
}

// Valida el FORMATO de los datos. No consulta repositorios: eso lo hará el servicio
// 'hoy' es un parámetro para poder fijar la fecha en los tests
export function validarReserva(datos, hoy = fechaHoy()) {
  const errores = {};
  const valores = {};   // Valores ya convertidos y limpios

  const equipoId = Number(datos.equipoId);
  if (!Number.isInteger(equipoId) || equipoId <= 0) {
    errores.equipoId = 'Selecciona un equipo válido';
  } else {
    valores.equipoId = equipoId;
  }

  const fecha = String(datos.fecha ?? '').trim();
  if (!esFechaValida(fecha)) {
    errores.fecha = 'Introduce una fecha válida';
  } else if (fecha < hoy) {   // Las cadenas YYYY-MM-DD se pueden comparar directamente
    errores.fecha = 'La fecha no puede ser anterior a hoy';
  } else {
    valores.fecha = fecha;
  }

  const turno = String(datos.turno ?? '');
  if (!TURNOS.includes(turno)) {
    errores.turno = 'El turno debe ser mañana o tarde';
  } else {
    valores.turno = turno;
  }

  return { valido: Object.keys(errores).length === 0, errores, valores };
}