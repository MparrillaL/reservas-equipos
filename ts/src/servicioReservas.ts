import type {
  RepositorioReservas,
  Reserva,
  Equipo,
  Usuario,
  Turno,
} from "./tipos.js";

export class ErrorConflicto extends Error {}
export class ErrorNoEncontrado extends Error {}
export class ErrorProhibido extends Error {}

export class ServicioReservas {
  // INYECCIÓN DE DEPENDENCIAS: recibe "algo que cumpla RepositorioReservas", no sabe cuál
  // "private readonly" en el parámetro crea y asigna la propiedad automáticamente
  constructor(private readonly repositorio: RepositorioReservas) {}

  estaReservado(equipoId: number, fecha: string, turno: Turno): boolean {
    return this.repositorio
      .obtenerTodas()
      .some(
        (r) =>
          r.equipoId === equipoId &&
          r.fecha === fecha &&
          r.turno === turno &&
          r.estado === "activa",
      );
  }

  crear(
    usuarioId: number,
    equipo: Equipo,
    fecha: string,
    turno: Turno,
  ): Reserva {
    if (equipo.estado !== "operativo")
      throw new ErrorConflicto("Equipo fuera de servicio");
    if (this.estaReservado(equipo.id, fecha, turno))
      throw new ErrorConflicto("Ya reservado");
    return this.repositorio.crear({
      equipoId: equipo.id,
      usuarioId,
      fecha,
      turno,
      estado: "activa",
    });
  }

  // Pick<Usuario, 'id' | 'rol'>: solo necesitamos esos dos campos del usuario
  cancelar(
    reservaId: number,
    usuario: Pick<Usuario, "id" | "rol">,
    hoy: string,
  ): Reserva {
    const esAdmin = usuario.rol === "admin";
    const reserva = this.repositorio.obtenerPorId(reservaId);
    if (!reserva) throw new ErrorNoEncontrado("La reserva no existe");
    if (!esAdmin && reserva.usuarioId !== usuario.id)
      throw new ErrorProhibido("No es tu reserva");
    if (reserva.estado !== "activa") throw new ErrorConflicto("No está activa");
    if (!esAdmin && reserva.fecha < hoy)
      throw new ErrorConflicto("Fecha pasada");

    const actualizada = this.repositorio.actualizarEstado(
      reservaId,
      "cancelada",
    );
    if (!actualizada) throw new ErrorNoEncontrado("La reserva no existe"); // TS obliga a tratar el null
    return actualizada;
  }
}
