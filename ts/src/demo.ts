import { RepositorioReservasMap } from "./repositorioReservasMap.js";
import { ServicioReservas, ErrorConflicto } from "./servicioReservas.js";
import type { Equipo } from "./tipos.js";

const repo = new RepositorioReservasMap();
const servicio = new ServicioReservas(repo); // ← aquí se INYECTA el repositorio

const pc: Equipo = {
  id: 1,
  codigo: "PC-001",
  nombre: "Ordenador aula 1",
  tipo: "sobremesa",
  estado: "operativo",
};

const r = servicio.crear(2, pc, "2027-01-20", "manana");
console.log("Creada:", r);

try {
  servicio.crear(3, pc, "2027-01-20", "manana");
} catch (e) {
  if (e instanceof ErrorConflicto)
    console.log("Conflicto detectado:", e.message);
}

console.log(
  "Cancelada:",
  servicio.cancelar(r.id, { id: 2, rol: "usuario" }, "2026-11-11"),
);
