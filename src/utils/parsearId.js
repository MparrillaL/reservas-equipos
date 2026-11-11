import { ErrorValidacion } from "../domain/errores.js";

// Convierte un parámetro de ruta (siempre llega como texto, p. ej. ":id" en la URL) a un
// id numérico válido; lanza ErrorValidacion (→ 400) si no lo es (p. ej. /equipos/abc).
// Se extrajo aquí porque la misma comprobación se repetía en varios controladores
// (equiposController.ficha, reservasController.cancelar, adminController.cambiarEstado
// y adminController.cancelarReserva): un solo sitio que mantener si la regla cambia.
export function parsearId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion({ id: "Identificador no válido" });
  }
  return id;
}
