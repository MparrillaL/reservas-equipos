import {
  ErrorValidacion,
  ErrorCredenciales,
  ErrorProhibido,
  ErrorNoEncontrado,
  ErrorConflicto,
} from "../domain/errores.js";

// Traducción error de dominio → código HTTP (el servicio no sabe nada de HTTP, solo de negocio).
// Esto mantiene la capa de servicios independiente de la web: el mismo servicio se podría
// reutilizar desde una API JSON o una CLI sin tener que cambiar nada en él.
function codigoHttp(err) {
  if (err instanceof ErrorValidacion) return 400; // datos de entrada incorrectos
  if (err instanceof ErrorCredenciales) return 401; // no autenticado / credenciales incorrectas
  if (err instanceof ErrorProhibido) return 403; // autenticado, pero sin permiso
  if (err instanceof ErrorNoEncontrado) return 404; // el recurso no existe
  if (err instanceof ErrorConflicto) return 409; // la petición es válida, pero choca con el estado actual
  return 500; // cualquier otro error es "inesperado" (bug, fallo interno...)
}

// Para URLs que no coinciden con ninguna ruta definida.
export function rutaNoEncontrada(req, res) {
  res
    .status(404)
    .render("error", {
      titulo: "Error 404",
      mensaje: "La página no existe",
      errores: {},
    });
}

// Express lo reconoce como gestor de errores PORQUE tiene 4 parámetros (err, req, res, next).
// Cualquier "throw" síncrono dentro de una ruta o middleware, o un "next(err)" explícito, acaba aquí.
// Al centralizar la traducción de errores en un único sitio, ningún controlador necesita
// repetir bloques try/catch para los errores de negocio: basta con "throw" en el servicio.
export function gestorErrores(err, req, res, next) {
  if (res.headersSent) return next(err); // si ya se empezó a responder, delega en Express (no se puede volver a responder)

  const status = codigoHttp(err);
  if (status === 500) console.error(err); // la traza SOLO va a la consola del servidor, nunca al cliente

  res.status(status).render("error", {
    titulo: `Error ${status}`,
    // Para un 500 se muestra un mensaje genérico: el mensaje real (err.message) podría contener
    // detalles internos (rutas de archivo, nombres de variables, consultas...) útiles para un atacante.
    mensaje: status === 500 ? "Error interno del servidor" : err.message,
    errores: err.errores ?? {},
  });
}
