import type {
  RepositorioReservas,
  Reserva,
  NuevaReserva,
  EstadoReserva,
} from "./tipos.js";

// "implements": el compilador OBLIGA a tener todos los métodos del contrato con sus tipos
export class RepositorioReservasMap implements RepositorioReservas {
  private readonly reservas = new Map<number, Reserva>(); // clave: id → valor: reserva
  private siguienteId = 1;

  constructor(iniciales: Reserva[] = []) {
    for (const r of iniciales) {
      this.reservas.set(r.id, { ...r });
      this.siguienteId = Math.max(this.siguienteId, r.id + 1);
    }
  }

  obtenerTodas(): Reserva[] {
    return [...this.reservas.values()].map((r) => ({ ...r }));
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
