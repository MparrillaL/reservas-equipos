import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requiereAutenticacion } from '../middlewares/auth.js';
import { limitadorLogin } from '../middlewares/rateLimit.js';

const router = Router();

router.get('/registro', authController.formularioRegistro);
router.post('/registro', authController.registrar);
router.get('/login', authController.formularioLogin);
router.post('/login', limitadorLogin, authController.login);    // el limitador va ANTES del controlador
router.post('/logout', authController.logout);
router.get('/perfil', requiereAutenticacion, authController.perfil);

export default router;