import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// En ESM no existe __dirname: lo calculamos a partir de la URL del propio archivo
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function crearApp() {
  const app = express();

  app.set('view engine', 'ejs');                         // Motor de plantillas
  app.set('views', path.join(__dirname, 'views'));       // Carpeta de vistas

  app.use(express.urlencoded({ extended: false }));      // Lee los formularios HTML (req.body)
  app.use(express.static(path.join(__dirname, '..', 'public'))); // CSS e imágenes

  app.get('/', (req, res) => res.send('Funciona'));      // Ruta temporal de prueba

  return app;                                            // NO llamamos a listen aquí
}