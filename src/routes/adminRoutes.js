import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { requiereRol } from "../middlewares/auth.js";

const router = Router();

router.use(requiereRol("admin"));

router.get("/equipos", adminController.equipos);
router.post("/equipos", adminController.crearEquipo);
router.post("/equipos/:id/estado", adminController.cambiarEstado);
router.get("/reservas", adminController.reservas);
router.post("/reservas/:id/cancelar", adminController.cancelarReserva);

export default router;
