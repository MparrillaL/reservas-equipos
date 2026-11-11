import { RepositorioReservasMap } from "./repositorioReservasMap.js";
import { ServicioReservas, ErrorConflicto } from "./servicioReservas.js";
import type { Equipo } from "./tipos.js";

// Demostración rápida del núcleo tipado: crear, detectar conflicto y cancelar una reserva.
const repo = new RepositorioReservasMap();
const servicio = new ServicioReservas(repo); // ← aquí se INYECTA el repositorio concreto (Map)

const pc: Equipo = {
  id: 1,
  codigo: "PC-001",
  nombre: "Ordenador aula 1",
  tipo: "sobremesa",
  estado: "operativo",
};

const r = servicio.crear(2, pc, "2027-01-20", "manana");
console.log("Creada:", r);

// Intentar reservar el MISMO equipo, fecha y turno debe lanzar ErrorConflicto
try {
  servicio.crear(3, pc, "2027-01-20", "manana");
} catch (e) {
  if (e instanceof ErrorConflicto)
    console.log("Conflicto detectado:", e.message);
}

// El usuario 2 cancela su propia reserva (misma regla de negocio que en la versión JavaScript)
console.log(
  "Cancelada:",
  servicio.cancelar(r.id, { id: 2, rol: "usuario" }, "2026-11-11"),
);
