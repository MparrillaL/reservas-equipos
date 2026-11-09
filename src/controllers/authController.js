import { authService } from '../services/authService.js';
import { ErrorValidacion, ErrorCredenciales } from '../domain/errores.js';
import { regenerarSesion, guardarSesion, destruirSesion, NOMBRE_COOKIE_SESION } from '../utils/sesion.js';

export const authController = {
  formularioRegistro(req, res) {
    res.render('auth/registro', { titulo: 'Registro', errores: {}, valores: {} });
  },

  async registrar(req, res) {
    try {
      await authService.registrar(req.body);
    } catch (err) {
      if (err instanceof ErrorValidacion) {
        // Volvemos a pintar el formulario con los errores y los datos escritos (NUNCA la contraseña)
        return res.status(400).render('auth/registro', {
          titulo: 'Registro',
          errores: err.errores,
          valores: { nombre: req.body.nombre, email: req.body.email },
        });
      }
      throw err;   // cualquier otro error → gestor centralizado
    }
    req.session.mensaje = 'Registro completado. Ya puedes iniciar sesión.';
    res.redirect(303, '/login');   // PRG
  },

  formularioLogin(req, res) {
    res.render('auth/login', { titulo: 'Iniciar sesión', error: null, valores: {} });
  },

  async login(req, res) {
    let usuario;
    try {
      usuario = await authService.autenticar(req.body.email, req.body.password);
    } catch (err) {
      if (err instanceof ErrorCredenciales) {
        return res.status(401).render('auth/login', {
          titulo: 'Iniciar sesión',
          error: err.message,
          valores: { email: req.body.email },
        });
      }
      throw err;
    }
    await regenerarSesion(req);           // ID de sesión nuevo → evita la fijación de sesión
    req.session.usuarioId = usuario.id;   // SOLO el id como dato de identidad
    req.session.mensaje = `Hola, ${usuario.nombre}. Has iniciado sesión.`;
    await guardarSesion(req);             // nos aseguramos de que se guarda antes de redirigir
    res.redirect(303, '/perfil');
  },

  async logout(req, res) {
    await destruirSesion(req);                 // borra la sesión en el SERVIDOR
    res.clearCookie(NOMBRE_COOKIE_SESION);     // y retira la cookie del navegador
    res.redirect(303, '/login');
  },

  perfil(req, res) {
    res.render('auth/perfil', { titulo: 'Mi perfil', usuario: req.usuario });
  },
};