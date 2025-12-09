const express = require('express');
const router = express.Router();
const {
  crearClase,
  obtenerClases,
  obtenerClasesProfesor,
  obtenerClase,
  actualizarClase,
  desactivarClase,
  agregarEstudiante,
  removerEstudiante
} = require('../controllers/class.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

router.post('/', authorize('administrador'), crearClase);
router.get('/', authorize('administrador'), obtenerClases);
router.get('/profesor/:profesorId', authorize('administrador', 'profesor'), obtenerClasesProfesor);
router.get('/:id', obtenerClase);
router.put('/:id', authorize('administrador'), actualizarClase);
router.delete('/:id', authorize('administrador'), desactivarClase);
router.post('/:id/estudiantes', authorize('administrador'), agregarEstudiante);
router.delete('/:id/estudiantes/:estudianteId', authorize('administrador'), removerEstudiante);

module.exports = router;
