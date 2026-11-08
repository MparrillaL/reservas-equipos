import bcrypt from 'bcrypt';

const COSTE = 10;   // 2^10 rondas: suficiente seguridad sin hacer lentos los tests

// Los hashes se calculan UNA vez al cargar el módulo (hashSync solo para la carga inicial)
const HASH_ADMIN = bcrypt.hashSync('Admin1234', COSTE);
const HASH_ANA = bcrypt.hashSync('Ana12345', COSTE);
const HASH_LUIS = bcrypt.hashSync('Luis12345', COSTE);

// Funciones que devuelven arrays NUEVOS cada vez (para poder reiniciar)
export function equiposIniciales() {
  return [
    { id: 1, codigo: 'PC-001', nombre: 'Ordenador aula 1', tipo: 'sobremesa', estado: 'operativo' },
    { id: 2, codigo: 'PORT-001', nombre: 'Portátil Lenovo', tipo: 'portatil', estado: 'operativo' },
    { id: 3, codigo: 'PC-002', nombre: 'Ordenador aula 2', tipo: 'sobremesa', estado: 'fuera_de_servicio' },
  ];
}

export function usuariosIniciales() {
  return [
    { id: 1, nombre: 'Administrador', email: 'admin@example.com', passwordHash: HASH_ADMIN, rol: 'admin' },
    { id: 2, nombre: 'Ana García', email: 'ana@example.com', passwordHash: HASH_ANA, rol: 'usuario' },
    { id: 3, nombre: 'Luis Pérez', email: 'luis@example.com', passwordHash: HASH_LUIS, rol: 'usuario' },
  ];
}

export function reservasIniciales() {
  return [
    { id: 1, equipoId: 1, usuarioId: 2, fecha: '2027-01-15', turno: 'manana', estado: 'activa' },
    { id: 2, equipoId: 2, usuarioId: 3, fecha: '2027-01-15', turno: 'tarde', estado: 'activa' },
    { id: 3, equipoId: 1, usuarioId: 3, fecha: '2027-01-16', turno: 'manana', estado: 'cancelada' },
  ];
}