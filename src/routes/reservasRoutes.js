import { Router } from "express";
import { requiereAutenticacion } from "../middlewares/auth.js";
import { reservasController } from "../controllers/reservasController.js";

// Rutas privadas de reservas: cada una exige sesión iniciada (requiereAutenticacion).
// Un usuario normal solo puede ver y cancelar SUS PROPIAS reservas (lo filtra el servicio).
const router = Router();

router.get("/reservas/nueva", requiereAutenticacion, reservasController.nueva);
router.post("/reservas", requiereAutenticacion, reservasController.crear);
router.get(
  "/mis-reservas",
  requiereAutenticacion,
  reservasController.misReservas,
);
router.post(
  "/reservas/:id/cancelar",
  requiereAutenticacion,
  reservasController.cancelar,
);

export default router;
