export type Rol = "usuario" | "admin";
export type Turno = "manana" | "tarde";
export type EstadoReserva = "activa" | "cancelada";
export type EstadoEquipo = "operativo" | "fuera_de_servicio";
export type TipoEquipo = "sobremesa" | "portatil";

export interface Equipo {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoEquipo;
  estado: EstadoEquipo;
}

export interface Reserva {
  id: number;
  equipoId: number;
  usuarioId: number;
  fecha: string;
  turno: Turno;
  estado: EstadoReserva;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

// Te lo doy: una reserva sin id (para crear)
export type NuevaReserva = Omit<Reserva, "id">;

// Te lo doy: el CONTRATO del repositorio
export interface RepositorioReservas {
  obtenerTodas(): Reserva[];
  obtenerPorId(id: number): Reserva | null;
  crear(datos: NuevaReserva): Reserva;
  actualizarEstado(id: number, estado: EstadoReserva): Reserva | null;
}
