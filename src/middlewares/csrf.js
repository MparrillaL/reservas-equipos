import crypto from "node:crypto";
import { ErrorProhibido } from "../domain/errores.js";

const METODOS_SEGUROS = ["GET", "HEAD", "OPTIONS"]; // no modifican estado → no necesitan protección CSRF

// Compara dos tokens en TIEMPO CONSTANTE: con "a === b" normal, la comparación de cadenas
// termina en cuanto encuentra la primera diferencia, y ese tiempo se puede medir para ir
// adivinando el token carácter a carácter (timing attack). timingSafeEqual siempre tarda lo mismo.
function tokensIguales(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
    return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Protección CSRF (Cross-Site Request Forgery): sin esto, una página maliciosa en OTRO dominio
// podría incluir un <form> oculto que haga POST a esta aplicación; el navegador enviaría
// igualmente la cookie de sesión de la víctima (las cookies viajan automáticamente a su dominio),
// y la petición se ejecutaría como si la hubiera hecho el propio usuario (p. ej. cancelar una
// reserva o cambiar el estado de un equipo sin que él lo sepa). El token CSRF lo impide porque
// solo nuestras propias páginas lo conocen (viene en el HTML que generamos); la página atacante
// no puede leerlo por la política de mismo origen del navegador.
export function proteccionCsrf(req, res, next) {
  // 1. Un token aleatorio por sesión (se crea la primera vez que se visita la web)
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  // 2. Disponible en TODAS las vistas → los formularios ya usan locals.csrfToken en un <input type="hidden">
  res.locals.csrfToken = req.session.csrfToken;

  // 3. Las peticiones que solo leen (GET/HEAD/OPTIONS) no modifican nada: no hace falta comprobar el token
  if (METODOS_SEGUROS.includes(req.method)) return next();

  // 4. En cualquier POST (o PUT/DELETE si los hubiera): el token que llega en el formulario debe
  //    coincidir con el guardado en la sesión del servidor. Si no coincide (o falta), la petición
  //    no viene de un formulario legítimo de esta web → se rechaza con 403.
  if (!tokensIguales(req.body._csrf, req.session.csrfToken)) {
    throw new ErrorProhibido("Token CSRF inválido");
  }
  next();
}
