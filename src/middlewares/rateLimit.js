import rateLimit from "express-rate-limit";

// Limita los intentos de login por IP para dificultar ataques de fuerza bruta
// (probar contraseñas una tras otra hasta acertar, de forma automatizada).
export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  limit: 5, // máximo 5 intentos por IP dentro de esa ventana
  skipSuccessfulRequests: true, // solo cuentan los intentos FALLIDOS (status >= 400); un login correcto no gasta cupo
  standardHeaders: "draft-7", // informa del límite restante en cabeceras estándar (RateLimit-*)
  legacyHeaders: false, // no añade las cabeceras antiguas X-RateLimit-*
  // Al superar el límite respondemos con la MISMA vista que un error normal de login,
  // para no dar pistas distintas (p. ej. un mensaje distinto) a quien esté automatizando intentos.
  handler: (req, res) => {
    res.status(429).render("auth/login", {
      titulo: "Iniciar sesión",
      error:
        "Demasiados intentos. Espera unos minutos antes de volver a probar.",
      valores: {},
    });
  },
});
