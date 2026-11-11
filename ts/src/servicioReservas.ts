import type {
  RepositorioReservas,
  Reserva,
  Equipo,
  Usuario,
  Turno,
} from "./tipos.js";

// Mismos errores de dominio que en la versión JavaScript (src/domain/errores.js), pero
// aquí son clases TypeScript normales: este núcleo no depende de Express ni de HTTP.
export class ErrorConflicto extends Error {}
export class ErrorNoEncontrado extends Error {}
export class ErrorProhibido extends Error {}

export class ServicioReservas {
  // INYECCIÓN DE DEPENDENCIAS: el servicio recibe "algo que cumpla RepositorioReservas"
  // (la interfaz), no sabe ni le importa si por detrás hay un Map, una tabla MySQL o un
  // doble falso de pruebas. Así se puede cambiar de almacenamiento sin tocar esta clase.
  // "private readonly" en el parámetro del constructor es azúcar sintáctico de TypeScript:
  // crea automáticamente la propiedad this.repositorio y la asigna, sin escribir el cuerpo.
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

  // Pick<Usuario, 'id' | 'rol'>: solo necesitamos esos dos campos del usuario (no hace
  // falta pasar el Usuario completo, con su email y su passwordHash, para cancelar una reserva).
  cancelar(
    reservaId: number,
    usuario: Pick<Usuario, "id" | "rol">,
    hoy: string,
  ): Reserva {
    const esAdmin = usuario.rol === "admin";
    const reserva = this.repositorio.obtenerPorId(reservaId);
    if (!reserva) throw new ErrorNoEncontrado("La reserva no existe");
    // Si no es admin, solo puede cancelar SU PROPIA reserva (misma regla que en reservasService.js)
    if (!esAdmin && reserva.usuarioId !== usuario.id)
      throw new ErrorProhibido("No es tu reserva");
    if (reserva.estado !== "activa") throw new ErrorConflicto("No está activa");
    // Un usuario normal no puede tocar el histórico; un admin sí.
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
