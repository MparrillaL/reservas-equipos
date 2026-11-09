export const NOMBRE_COOKIE_SESION = 'sid';

// express-session usa callbacks; los envolvemos en Promise para poder usar await
export function regenerarSesion(req) {
  return new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
}
export function guardarSesion(req) {
  return new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
}
export function destruirSesion(req) {
  return new Promise((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())));
}