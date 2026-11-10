import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/config.js';
import { NOMBRE_COOKIE_SESION } from './utils/sesion.js';
import { cargarUsuario, mensajesFlash } from './middlewares/sesion.js';
import { rutaNoEncontrada, gestorErrores } from './middlewares/errores.js';
import { proteccionCsrf } from './middlewares/csrf.js';
import equiposRoutes from './routes/equiposRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reservasRoutes from './routes/reservasRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function crearApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  if (config.esProduccion) app.set('trust proxy', 1);   // necesario para cookies 'secure' detrás de un proxy HTTPS
  app.locals.esDesarrollo = config.nodeEnv === 'development';   // disponible en todas las vistas (p. ej. ayuda de login)

  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(session({
    name: NOMBRE_COOKIE_SESION,
    secret: config.sessionSecret,
    resave: false,                  // no reescribir la sesión si no ha cambiado
    saveUninitialized: false,       // no crear sesiones vacías (ni cookies) para visitantes
    cookie: {
      httpOnly: true,               // inaccesible desde JS del navegador → protege frente a robo por XSS
      secure: config.esProduccion,  // solo HTTPS en producción (en localhost usamos HTTP)
      sameSite: 'lax',              // no se envía en POST desde otros sitios → primera barrera frente a CSRF
      maxAge: 2 * 60 * 60 * 1000,   // 2 horas
    },
  }));

  app.use(cargarUsuario);   // DESPUÉS de session: necesita req.session
  app.use(mensajesFlash);
  app.use(proteccionCsrf);

  app.get('/', (req, res) => res.redirect('/equipos'));
  app.use(equiposRoutes);
  app.use(authRoutes);
  app.use(reservasRoutes);

  app.use(rutaNoEncontrada);
  app.use(gestorErrores);

  return app;
}