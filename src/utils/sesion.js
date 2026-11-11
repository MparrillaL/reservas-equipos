export const NOMBRE_COOKIE_SESION = "sid"; // nombre corto y genérico: no revela qué tecnología se usa por detrás

// express-session usa callbacks (estilo Node clásico); los envolvemos en Promise
// para poder usar "await" en los controladores y que el código se lea de forma secuencial.

// Genera un ID de sesión nuevo conservando los datos actuales: se usa justo tras el login
// para evitar la "fijación de sesión" (session fixation): si un atacante consiguiera que la
// víctima usara un ID de sesión conocido de antemano, podría iniciar sesión él mismo más tarde
// con ese mismo ID. Al regenerarlo tras autenticar, el ID anterior a el login deja de servir.
export function regenerarSesion(req) {
  return new Promise((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
}
// Fuerza a guardar la sesión en el almacén antes de continuar (p. ej. antes de un redirect),
// para asegurarnos de que los datos ya están persistidos cuando el navegador haga la siguiente petición.
export function guardarSesion(req) {
  return new Promise((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );
}
// Elimina la sesión del almacén del SERVIDOR (no solo la cookie del navegador): se usa en el logout
// para que, aunque alguien reutilizara la cookie antigua, el servidor ya no la reconozca como válida.
export function destruirSesion(req) {
  return new Promise((resolve, reject) =>
    req.session.destroy((err) => (err ? reject(err) : resolve())),
  );
}
