import bcrypt from "bcrypt";
import { usuariosRepository } from "../repositories/usuariosRepository.js";
import { validarRegistro } from "../domain/usuarios.js";
import { ErrorValidacion, ErrorCredenciales } from "../domain/errores.js";

const COSTE = 10; // factor de coste de bcrypt: cuánto trabajo cuesta calcular el hash (más alto = más lento y más seguro)
// Hash "de relleno": si el correo no existe, comparamos igualmente para tardar lo mismo.
// Si no hiciéramos esto, un atacante podría medir el tiempo de respuesta del login: sería
// más rápido cuando el correo no existe (porque no se llegaría a comparar ningún hash),
// y esa diferencia de tiempo revelaría qué correos están registrados (timing attack).
const HASH_FICTICIO = bcrypt.hashSync("contraseña-de-relleno", COSTE);

// Quita el hash antes de que el usuario "salga" del servicio: el hash NUNCA debe llegar
// a un controlador, a una vista ni guardarse en la sesión. Si se filtrara (por un log, un
// error mal gestionado...), un atacante podría intentar romperlo (crackearlo) sin conexión.
function sinHash(usuario) {
  const { passwordHash, ...publico } = usuario; // desestructuración: separa passwordHash del resto
  return publico;
}

export const authService = {
  async registrar(datos) {
    const { valido, errores, valores } = validarRegistro(datos);
    if (!valido) throw new ErrorValidacion(errores); // 400

    if (usuariosRepository.obtenerPorEmail(valores.email)) {
      throw new ErrorValidacion({ email: "Ese correo ya está registrado" }); // 400: correo duplicado
    }

    const passwordHash = await bcrypt.hash(valores.password, COSTE); // operación asíncrona (lenta a propósito)
    const usuario = usuariosRepository.crear({
      nombre: valores.nombre,
      email: valores.email,
      passwordHash,
      rol: "usuario", // SIEMPRE 'usuario': se ignora cualquier 'rol' que envíe el cliente en el formulario
    }); // (si no se forzara aquí, cualquiera podría autoasignarse el rol admin)
    return sinHash(usuario);
  },

  async autenticar(email, password) {
    const usuario = usuariosRepository.obtenerPorEmail(String(email ?? ""));
    // Se compara SIEMPRE, exista o no el usuario, usando el hash ficticio si no existe:
    // así el tiempo de respuesta es el mismo en ambos casos (ver HASH_FICTICIO más arriba).
    const correcta = await bcrypt.compare(
      String(password ?? ""),
      usuario?.passwordHash ?? HASH_FICTICIO,
    );
    if (!usuario || !correcta) {
      throw new ErrorCredenciales("Correo o contraseña incorrectos"); // mismo mensaje en ambos casos: 401
    }
    return sinHash(usuario);
  },

  // Se usa en cada petición (cargarUsuario) para "rehidratar" req.usuario a partir
  // del id guardado en la sesión. Solo se guarda el id en la cookie, nunca los datos completos.
  obtenerUsuarioPublico(id) {
    const usuario = usuariosRepository.obtenerPorId(id);
    return usuario ? sinHash(usuario) : null;
  },
};
