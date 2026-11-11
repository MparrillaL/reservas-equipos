import type {
  RepositorioReservas,
  Reserva,
  NuevaReserva,
  EstadoReserva,
} from "./tipos.js";

// "implements": el compilador OBLIGA a tener todos los métodos del contrato RepositorioReservas
// con sus tipos exactos; si falta uno o la firma no coincide, el código no compila.
export class RepositorioReservasMap implements RepositorioReservas {
  // Map en vez de array: map.get(id) accede DIRECTO a la reserva por su clave, mientras
  // que array.find() recorre elemento a elemento hasta encontrarla. Con miles de reservas
  // la diferencia de rendimiento es notable. "private readonly": nadie fuera de la clase
  // puede acceder ni reasignar este Map directamente.
  private readonly reservas = new Map<number, Reserva>(); // clave: id → valor: reserva
  private siguienteId = 1;

  // Permite "sembrar" el repositorio con datos iniciales (p. ej. en tests o en la demo).
  constructor(iniciales: Reserva[] = []) {
    for (const r of iniciales) {
      this.reservas.set(r.id, { ...r }); // copia defensiva: no se guarda la misma referencia que llega
      this.siguienteId = Math.max(this.siguienteId, r.id + 1);
    }
  }

  obtenerTodas(): Reserva[] {
    return [...this.reservas.values()].map((r) => ({ ...r })); // copias: nadie puede mutar el estado interno desde fuera
  }

  obtenerPorId(id: number): Reserva | null {
    const r = this.reservas.get(id); // Map.get: acceso directo por clave, sin recorrer
    return r ? { ...r } : null;
  }

  crear(datos: NuevaReserva): Reserva {
    const nueva: Reserva = { ...datos, id: this.siguienteId++ };
    this.reservas.set(nueva.id, nueva);
    return { ...nueva };
  }

  actualizarEstado(id: number, estado: EstadoReserva): Reserva | null {
    const r = this.reservas.get(id);
    if (!r) return null;
    r.estado = estado;
    return { ...r };
  }
}
