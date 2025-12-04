const express = require('express');
const router = express.Router();
const {
  crearCalificacion,
  obtenerCalificacionesClase,
  obtenerCalificacionesEstudiante,
  obtenerMisCalificaciones,
  actualizarCalificacion,
  eliminarCalificacion,
  generarReporte
} = require('../controllers/grade.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

router.post('/', authorize('profesor', 'administrador'), crearCalificacion);
router.get('/mis-calificaciones', authorize('estudiante'), obtenerMisCalificaciones);
router.get('/clase/:claseId', authorize('profesor', 'administrador'), obtenerCalificacionesClase);
router.get('/estudiante/:estudianteId', authorize('estudiante', 'profesor', 'administrador'), obtenerCalificacionesEstudiante);
router.get('/reporte/:estudianteId', authorize('estudiante', 'profesor', 'administrador'), generarReporte);
router.put('/:id', authorize('profesor', 'administrador'), actualizarCalificacion);
router.delete('/:id', authorize('profesor', 'administrador'), eliminarCalificacion);

module.exports = router;
