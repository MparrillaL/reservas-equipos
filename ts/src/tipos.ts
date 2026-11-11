// Tipos unión: el compilador solo admite estos valores exactos. Es la versión "con
// compilador" de las listas blancas en JavaScript (p. ej. TIPOS_EQUIPO.includes()):
// aquí el error se detecta ANTES de ejecutar, al compilar.
export type Rol = "usuario" | "admin";
export type Turno = "manana" | "tarde";
export type EstadoReserva = "activa" | "cancelada";
export type EstadoEquipo = "operativo" | "fuera_de_servicio";
export type TipoEquipo = "sobremesa" | "portatil";

// Interfaces: describen la FORMA que debe tener cada objeto (qué campos tiene y de qué tipo).
// Se corresponden con los objetos reales de src/repositories/datosIniciales.js.
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

// Te lo doy: una reserva sin id (para crear). Omit<Reserva, 'id'> genera un tipo idéntico
// a Reserva pero sin el campo 'id' (tiene sentido: el id lo asigna el repositorio al crear).
export type NuevaReserva = Omit<Reserva, "id">;

// Te lo doy: el CONTRATO del repositorio. Cualquier clase que lo implemente (como
// RepositorioReservasMap) queda OBLIGADA por el compilador a tener estos 4 métodos
// con estas firmas exactas. Esto es lo que permite la inyección de dependencias:
// ServicioReservas solo conoce esta interfaz, nunca una implementación concreta.
export interface RepositorioReservas {
  obtenerTodas(): Reserva[];
  obtenerPorId(id: number): Reserva | null;
  crear(datos: NuevaReserva): Reserva;
  actualizarEstado(id: number, estado: EstadoReserva): Reserva | null;
}
