// Lista blanca de roles válidos (se usa, por ejemplo, para validar el tipo Rol en TypeScript
// y como referencia de qué valores puede tener el campo "rol" de un usuario).
export const ROLES = ["usuario", "admin"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // algo@algo.algo, sin espacios (validación básica de formato)

// Valida y normaliza los datos del formulario de registro.
// Solo valida la FORMA de los datos (longitudes, formato de correo...); no comprueba si el
// correo ya existe, porque eso requiere consultar el repositorio y esta función de dominio
// no depende de ningún repositorio (así se puede probar sin montar toda la aplicación).
export function validarRegistro(datos) {
  const errores = {};
  const valores = {}; // valores ya limpios y listos para guardar

  const nombre = String(datos.nombre ?? "").trim();
  if (nombre.length < 2 || nombre.length > 60)
    errores.nombre = "El nombre debe tener entre 2 y 60 caracteres";
  else valores.nombre = nombre;

  // Se normaliza a minúsculas para que "Ana@Mail.com" y "ana@mail.com" se traten como el mismo correo
  const email = String(datos.email ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_REGEX.test(email) || email.length > 100)
    errores.email = "Introduce un correo válido";
  else valores.email = email;

  const password = String(datos.password ?? "");
  // bcrypt solo usa los primeros 72 bytes: por encima de eso el resto se ignoraría silenciosamente
  // (dos contraseñas distintas que compartan esos 72 bytes se considerarían la misma contraseña)
  if (password.length < 8 || password.length > 72)
    errores.password = "La contraseña debe tener entre 8 y 72 caracteres";
  else valores.password = password;

  return { valido: Object.keys(errores).length === 0, errores, valores };
}
