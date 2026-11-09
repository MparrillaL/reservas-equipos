import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import equiposRoutes from './routes/equiposRoutes.js';
import { rutaNoEncontrada, gestorErrores } from './middlewares/errores.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function crearApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());                                         // rellena req.cookies
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/', (req, res) => res.redirect('/equipos'));
  app.use(equiposRoutes);

  // SIEMPRE al final y en este orden: primero el 404 y después el gestor de errores
  app.use(rutaNoEncontrada);
  app.use(gestorErrores);

  return app;
}