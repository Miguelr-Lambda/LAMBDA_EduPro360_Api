const express = require('express');
const router = express.Router();
const {
  crearEntrega,
  obtenerEntregasTarea,
  obtenerMisEntregas,
  calificarEntrega
} = require('../controllers/submission.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

router.post('/', authorize('estudiante'), crearEntrega);
router.get('/mis-entregas', authorize('estudiante'), obtenerMisEntregas);
router.get('/tarea/:tareaId', authorize('profesor', 'administrador'), obtenerEntregasTarea);
router.put('/:id/calificar', authorize('profesor', 'administrador'), calificarEntrega);

module.exports = router;
