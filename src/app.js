import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config/config.js";
import { NOMBRE_COOKIE_SESION } from "./utils/sesion.js";
import { cargarUsuario, mensajesFlash } from "./middlewares/sesion.js";
import { rutaNoEncontrada, gestorErrores } from "./middlewares/errores.js";
import { proteccionCsrf } from "./middlewares/csrf.js";
import equiposRoutes from "./routes/equiposRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reservasRoutes from "./routes/reservasRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construye y configura la aplicación Express SIN ponerla a escuchar en un puerto.
// Esta separación respecto a server.js es lo que permite a Supertest (tests/app.test.js)
// hacer peticiones a la app directamente en memoria, sin abrir un puerto real.
export function crearApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  if (config.esProduccion) app.set("trust proxy", 1); // necesario para cookies 'secure' detrás de un proxy HTTPS (p. ej. Heroku, Nginx)
  app.locals.esDesarrollo = config.nodeEnv === "development"; // disponible en todas las vistas (p. ej. ayuda de login)

  app.use(express.urlencoded({ extended: false })); // parsea los formularios HTML (application/x-www-form-urlencoded) a req.body
  app.use(cookieParser()); // permite leer cookies no firmadas (p. ej. la de preferencia de tipo de equipo) en req.cookies
  app.use(express.static(path.join(__dirname, "..", "public"))); // sirve CSS/imágenes directamente, sin pasar por rutas ni autenticación

  // La sesión debe montarse ANTES que cualquier middleware que use req.session (cargarUsuario,
  // mensajesFlash, proteccionCsrf) o que las rutas que lean req.usuario.
  app.use(
    session({
      name: NOMBRE_COOKIE_SESION,
      secret: config.sessionSecret, // firma la cookie: sin conocer este secreto no se puede falsificar una sesión válida
      resave: false, // no reescribir la sesión si no ha cambiado
      saveUninitialized: false, // no crear sesiones vacías (ni cookies) para visitantes que no han hecho login
      cookie: {
        httpOnly: true, // inaccesible desde JS del navegador → protege frente a robo por XSS
        secure: config.esProduccion, // solo HTTPS en producción (en localhost usamos HTTP)
        sameSite: "lax", // no se envía en peticiones cross-site iniciadas por otros sitios → primera barrera frente a CSRF
        maxAge: 2 * 60 * 60 * 1000, // 2 horas: la sesión caduca sola aunque no se cierre explícitamente
      },
    }),
  );

  // Orden importante: cargarUsuario necesita req.session (rellena req.usuario a partir del
  // id guardado); mensajesFlash lee/borra el mensaje de la sesión; proteccionCsrf genera el
  // token y, en los POST, lo valida. Todos ellos corren ANTES de llegar a cualquier ruta.
  app.use(cargarUsuario); // DESPUÉS de session: necesita req.session
  app.use(mensajesFlash);
  app.use(proteccionCsrf);

  app.get("/", (req, res) => res.redirect("/equipos")); // la portada no existe como tal: redirige al catálogo público
  app.use(equiposRoutes); // rutas públicas de consulta de equipos
  app.use(authRoutes); // registro, login, logout, perfil
  app.use(reservasRoutes); // rutas privadas de reservas (requieren sesión)
  app.use("/admin", adminRoutes); // ← solo recibe URLs que empiezan por /admin; protegido con requiereRol('admin') dentro del propio router

  // Deben ir AL FINAL: solo se alcanzan si ninguna ruta anterior respondió.
  app.use(rutaNoEncontrada); // cualquier URL que no exista → 404
  app.use(gestorErrores); // cualquier error lanzado en cualquier ruta o middleware anterior → aquí se traduce a su código HTTP

  return app;
}
