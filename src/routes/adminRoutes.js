import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { requiereRol } from "../middlewares/auth.js";

// Este router se monta en app.js con app.use('/admin', adminRoutes), así que las rutas
// de aquí abajo se escriben SIN el prefijo '/admin' (Express ya se lo antepone solo).
const router = Router();

// Una única línea protege TODO el router: cualquier petición a /admin/* exige rol 'admin'.
// Como el router solo recibe URLs que empiezan por /admin, esto no afecta a las rutas públicas.
router.use(requiereRol("admin"));

router.get("/equipos", adminController.equipos);
router.post("/equipos", adminController.crearEquipo);
router.post("/equipos/:id/estado", adminController.cambiarEstado);
router.get("/reservas", adminController.reservas);
router.post("/reservas/:id/cancelar", adminController.cancelarReserva);

export default router;
