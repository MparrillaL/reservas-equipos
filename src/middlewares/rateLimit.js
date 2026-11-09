import rateLimit from 'express-rate-limit';

export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,        // ventana de 15 minutos
  limit: 5,                        // 5 intentos por IP
  skipSuccessfulRequests: true,    // solo cuentan los intentos fallidos (status >= 400)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/login', {
      titulo: 'Iniciar sesión',
      error: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
      valores: {},
    });
  },
});