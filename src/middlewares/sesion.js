import { authService } from '../services/authService.js';

// En cada petición: si hay usuarioId en la sesión, cargamos el usuario REAL del repositorio
export function cargarUsuario(req, res, next) {
  const id = req.session.usuarioId;
  if (id) {
    const usuario = authService.obtenerUsuarioPublico(id);
    if (usuario) {
      req.usuario = usuario;               // para controladores y middlewares
      res.locals.usuarioActual = usuario;  // para las vistas (cabecera)
    }
  }
  next();
}

// Mensajes de un solo uso: se leen y se borran en la misma petición
export function mensajesFlash(req, res, next) {
  if (req.session.mensaje) {
    res.locals.mensaje = req.session.mensaje;
    delete req.session.mensaje;
  }
  next();
}