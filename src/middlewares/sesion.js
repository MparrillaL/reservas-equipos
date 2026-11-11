import { authService } from "../services/authService.js";

// En cada petición: si hay usuarioId en la sesión, cargamos el usuario REAL del repositorio.
// No se guarda el objeto usuario completo en la sesión a propósito: así, si sus datos cambian
// (p. ej. un admin le quita privilegios), se reflejan en la siguiente petición sin tener que
// volver a iniciar sesión.
export function cargarUsuario(req, res, next) {
  const id = req.session.usuarioId;
  if (id) {
    const usuario = authService.obtenerUsuarioPublico(id); // ya viene sin passwordHash
    if (usuario) {
      req.usuario = usuario; // para controladores y middlewares (requiereAutenticacion, requiereRol...)
      res.locals.usuarioActual = usuario; // para las vistas (p. ej. mostrar el nombre en la cabecera)
    }
    // Si el id de sesión no corresponde a ningún usuario (p. ej. fue eliminado), req.usuario
    // se queda sin definir y las rutas privadas lo tratarán como "no autenticado".
  }
  next();
}

// Mensajes de un solo uso ("flash messages"): se leen y se borran en la misma petición,
// así solo se muestran una vez (p. ej. "Reserva creada con éxito" tras un redirect) y no
// reaparecen si el usuario recarga la página después.
export function mensajesFlash(req, res, next) {
  if (req.session.mensaje) {
    res.locals.mensaje = req.session.mensaje;
    delete req.session.mensaje;
  }
  next();
}
