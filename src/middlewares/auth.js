// Middleware reutilizable: si no hay usuario autenticado → redirige a /login con 303
export function requiereAutenticacion(req, res, next) {
  if (!req.usuario) return res.redirect(303, '/login');
  next();
}