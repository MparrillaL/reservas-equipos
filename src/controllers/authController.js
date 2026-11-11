import { authService } from "../services/authService.js";
import { ErrorValidacion, ErrorCredenciales } from "../domain/errores.js";
import {
  regenerarSesion,
  guardarSesion,
  destruirSesion,
  NOMBRE_COOKIE_SESION,
} from "../utils/sesion.js";

export const authController = {
  // GET /registro
  formularioRegistro(req, res) {
    res.render("auth/registro", {
      titulo: "Registro",
      errores: {},
      valores: {},
    });
  },

  // POST /registro
  async registrar(req, res) {
    try {
      await authService.registrar(req.body);
    } catch (err) {
      if (err instanceof ErrorValidacion) {
        // Volvemos a pintar el formulario con los errores y los datos escritos (NUNCA la contraseña:
        // no se devuelve al HTML para no dejarla en el historial del navegador ni en logs del servidor)
        return res.status(400).render("auth/registro", {
          titulo: "Registro",
          errores: err.errores,
          valores: { nombre: req.body.nombre, email: req.body.email },
        });
      }
      throw err; // cualquier otro error → lo recoge el gestor centralizado de errores (src/middlewares/errores.js)
    }
    req.session.mensaje = "Registro completado. Ya puedes iniciar sesión.";
    res.redirect(303, "/login"); // Post/Redirect/Get: evita reenvíos del formulario si se recarga la página
  },

  // GET /login
  formularioLogin(req, res) {
    res.render("auth/login", {
      titulo: "Iniciar sesión",
      error: null,
      valores: {},
    });
  },

  // POST /login (pasa antes por limitadorLogin, ver routes/authRoutes.js)
  async login(req, res) {
    let usuario;
    try {
      usuario = await authService.autenticar(req.body.email, req.body.password);
    } catch (err) {
      if (err instanceof ErrorCredenciales) {
        return res.status(401).render("auth/login", {
          titulo: "Iniciar sesión",
          error: err.message,
          valores: { email: req.body.email }, // se conserva el correo escrito, NUNCA la contraseña
        });
      }
      throw err;
    }
    await regenerarSesion(req); // ID de sesión nuevo → evita la fijación de sesión (session fixation)
    req.session.usuarioId = usuario.id; // SOLO el id como dato de identidad: el resto se vuelve a leer del repositorio en cada petición
    req.session.mensaje = `Hola, ${usuario.nombre}. Has iniciado sesión.`;
    await guardarSesion(req); // nos aseguramos de que la sesión queda guardada antes de redirigir
    res.redirect(303, "/perfil");
  },

  // POST /logout
  async logout(req, res) {
    await destruirSesion(req); // borra la sesión en el SERVIDOR (no basta con quitar la cookie del navegador)
    res.clearCookie(NOMBRE_COOKIE_SESION); // y retira la cookie del navegador
    res.redirect(303, "/login");
  },

  // GET /perfil (ruta privada, protegida con requiereAutenticacion)
  perfil(req, res) {
    res.render("auth/perfil", { titulo: "Mi perfil", usuario: req.usuario });
  },
};
