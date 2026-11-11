import { ErrorProhibido } from "../domain/errores.js";

// Middleware reutilizable: si no hay usuario autenticado → redirige a /login con 303.
// req.usuario lo rellena cargarUsuario (src/middlewares/sesion.js) en cada petición,
// a partir del id guardado en la sesión (NUNCA se confia en datos que vengan del cliente).
export function requiereAutenticacion(req, res, next) {
  if (!req.usuario) return res.redirect(303, "/login");
  next();
}

// Fábrica de middleware: requiereRol('admin') devuelve una función middleware configurada
// para exigir ese rol en concreto. Así se reutiliza la misma lógica con distintos roles
// sin duplicar código (p. ej. requiereRol('admin', 'moderador') si hubiera más roles).
export function requiereRol(...roles) {
  // ...roles → array con todos los argumentos (rest parameter)
  return (req, res, next) => {
    // Si no hay sesión, se trata igual que requiereAutenticacion: redirige a /login.
    if (!req.usuario) return res.redirect(303, "/login");

    // Si el rol del usuario autenticado no está en la lista permitida → 403 (prohibido).
    // Se usa 403 y no 404: el usuario existe y está autenticado, simplemente no tiene permiso.
    if (!roles.includes(req.usuario.rol))
      throw new ErrorProhibido("Rol no autorizado");

    // Si todo está bien → deja pasar a la siguiente función (controlador u otro middleware).
    next();
  };
}
