import {
  ErrorValidacion, ErrorCredenciales, ErrorProhibido, ErrorNoEncontrado, ErrorConflicto,
} from '../domain/errores.js';

// Traducción error de dominio → código HTTP (el servicio no sabe nada de HTTP)
function codigoHttp(err) {
  if (err instanceof ErrorValidacion) return 400;
  if (err instanceof ErrorCredenciales) return 401;
  if (err instanceof ErrorProhibido) return 403;
  if (err instanceof ErrorNoEncontrado) return 404;
  if (err instanceof ErrorConflicto) return 409;
  return 500;                                         // cualquier otro error es "inesperado"
}

// Para URLs que no coinciden con ninguna ruta
export function rutaNoEncontrada(req, res) {
  res.status(404).render('error', { titulo: 'Error 404', mensaje: 'La página no existe', errores: {} });
}

// Express lo reconoce como gestor de errores porque tiene 4 parámetros
export function gestorErrores(err, req, res, next) {
  if (res.headersSent) return next(err);              // si ya se empezó a responder, delega en Express

  const status = codigoHttp(err);
  if (status === 500) console.error(err);             // la traza SOLO va a la consola del servidor

  res.status(status).render('error', {
    titulo: `Error ${status}`,
    mensaje: status === 500 ? 'Error interno del servidor' : err.message,   // nunca detalles internos
    errores: err.errores ?? {},
  });
}