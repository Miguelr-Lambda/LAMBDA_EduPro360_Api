const express = require('express');
const router = express.Router();
const {
  crearTarea,
  obtenerTareasClase,
  obtenerMisTareas,
  actualizarTarea,
  eliminarTarea
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

router.post('/', authorize('profesor', 'administrador'), crearTarea);
router.get('/mis-tareas', authorize('profesor'), obtenerMisTareas);
router.get('/clase/:claseId', obtenerTareasClase);
router.put('/:id', authorize('profesor', 'administrador'), actualizarTarea);
router.delete('/:id', authorize('profesor', 'administrador'), eliminarTarea);

module.exports = router;
