import { ErrorProhibido } from '../domain/errores.js';

// Middleware reutilizable: si no hay usuario autenticado → redirige a /login con 303
export function requiereAutenticacion(req, res, next) {
  if (!req.usuario) return res.redirect(303, '/login');
  next();
}

export function requiereRol(...roles) {        // ...roles → array con todos los argumentos
  return (req, res, next) => {
    // TODO 1: si no hay req.usuario → redirige a /login con 303 (igual que requiereAutenticacion)
    if (!req.usuario) return res.redirect(303, '/login');

    // TODO 2: si el rol de req.usuario NO está en roles → lanza un ErrorProhibido (→ 403)
    if (!roles.includes(req.usuario.rol)) throw new ErrorProhibido('Rol no autorizado');

    // TODO 3: si todo está bien → deja pasar
    next();
  };
}