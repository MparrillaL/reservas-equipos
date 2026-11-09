import { Router } from 'express';
import { equiposController } from '../controllers/equiposController.js';

const router = Router();

router.get('/equipos', equiposController.listar);
router.get('/equipos/:id', equiposController.ficha);
router.post('/preferencias', equiposController.guardarPreferencia);

export default router;