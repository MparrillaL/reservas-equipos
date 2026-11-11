import { Router } from "express";
import { equiposController } from "../controllers/equiposController.js";

// Rutas públicas de consulta del catálogo de equipos (no requieren sesión iniciada).
const router = Router();

router.get("/equipos", equiposController.listar);
router.get("/equipos/:id", equiposController.ficha);
router.post("/preferencias", equiposController.guardarPreferencia);

export default router;
