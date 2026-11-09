import bcrypt from 'bcrypt';
import { usuariosRepository } from '../repositories/usuariosRepository.js';
import { validarRegistro } from '../domain/usuarios.js';
import { ErrorValidacion, ErrorCredenciales } from '../domain/errores.js';

const COSTE = 10;
// Hash "de relleno": si el correo no existe, comparamos igualmente para tardar lo mismo.
// Si no, un atacante podría deducir qué correos existen midiendo el tiempo de respuesta.
const HASH_FICTICIO = bcrypt.hashSync('contraseña-de-relleno', COSTE);

// Quita el hash antes de que el usuario salga del servicio
function sinHash(usuario) {
  const { passwordHash, ...publico } = usuario;   // desestructuración: separa passwordHash del resto
  return publico;
}

export const authService = {
  async registrar(datos) {
    const { valido, errores, valores } = validarRegistro(datos);
    if (!valido) throw new ErrorValidacion(errores);

    if (usuariosRepository.obtenerPorEmail(valores.email)) {
      throw new ErrorValidacion({ email: 'Ese correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(valores.password, COSTE);   // operación asíncrona
    const usuario = usuariosRepository.crear({
      nombre: valores.nombre,
      email: valores.email,
      passwordHash,
      rol: 'usuario',            // SIEMPRE 'usuario': se ignora cualquier 'rol' que envíe el cliente
    });
    return sinHash(usuario);
  },

  async autenticar(email, password) {
    const usuario = usuariosRepository.obtenerPorEmail(String(email ?? ''));
    const correcta = await bcrypt.compare(String(password ?? ''), usuario?.passwordHash ?? HASH_FICTICIO);
    if (!usuario || !correcta) {
      throw new ErrorCredenciales('Correo o contraseña incorrectos');   // mismo mensaje en ambos casos
    }
    return sinHash(usuario);
  },

  obtenerUsuarioPublico(id) {
    const usuario = usuariosRepository.obtenerPorId(id);
    return usuario ? sinHash(usuario) : null;
  },
};