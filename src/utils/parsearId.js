import { ErrorValidacion } from "../domain/errores.js";

// Convierte un parámetro de ruta a id numérico válido; lanza ErrorValidacion (→ 400) si no lo es.
export function parsearId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorValidacion({ id: "Identificador no válido" });
  }
  return id;
}
