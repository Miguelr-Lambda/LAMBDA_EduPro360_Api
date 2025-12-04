const express = require('express');
const router = express.Router();
const {
  registrarProfesor,
  registrarEstudiante,
  obtenerProfesores,
  obtenerEstudiantes,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Rutas protegidas - Solo Administrador
router.use(protect); // Todas las rutas requieren autenticación

router.post('/profesor', authorize('administrador'), registrarProfesor);
router.post('/estudiante', authorize('administrador'), registrarEstudiante);
router.get('/profesores', authorize('administrador'), obtenerProfesores);
router.get('/estudiantes', authorize('administrador', 'profesor'), obtenerEstudiantes);
router.get('/:id', authorize('administrador'), obtenerUsuario);
router.put('/:id', authorize('administrador'), actualizarUsuario);
router.delete('/:id', authorize('administrador'), eliminarUsuario);

module.exports = router;
