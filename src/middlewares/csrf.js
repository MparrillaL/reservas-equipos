import crypto from 'node:crypto';
import { ErrorProhibido } from '../domain/errores.js';

const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS'];   // no modifican estado → no se comprueban

// Compara dos tokens en tiempo constante (mismo motivo que HASH_FICTICIO: no filtrar info por el tiempo)
function tokensIguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function proteccionCsrf(req, res, next) {
  // 1. Un token aleatorio por sesión (se crea la primera vez)
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  // 2. Disponible en TODAS las vistas → los formularios ya usan locals.csrfToken
  res.locals.csrfToken = req.session.csrfToken;

  // 3. Las peticiones que solo leen no necesitan comprobación
  if (METODOS_SEGUROS.includes(req.method)) return next();

  // TODO 4: compara req.body._csrf con req.session.csrfToken usando tokensIguales()
  //         Si NO son iguales → lanza ErrorProhibido('Token CSRF inválido')
  //         Si son iguales → next()
  if (!tokensIguales(req.body._csrf, req.session.csrfToken)) {
    throw new ErrorProhibido('Token CSRF inválido');
  }
  next();
}