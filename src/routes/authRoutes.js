import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { requiereAutenticacion } from "../middlewares/auth.js";
import { limitadorLogin } from "../middlewares/rateLimit.js";

// Rutas públicas y de sesión: registro, login/logout y perfil del usuario autenticado.
const router = Router();

router.get("/registro", authController.formularioRegistro);
router.post("/registro", authController.registrar);
router.get("/login", authController.formularioLogin);
router.post("/login", limitadorLogin, authController.login); // el limitador va ANTES del controlador: cuenta el intento aunque falle
router.post("/logout", authController.logout);
router.get("/perfil", requiereAutenticacion, authController.perfil); // ruta privada: exige sesión iniciada

export default router;
