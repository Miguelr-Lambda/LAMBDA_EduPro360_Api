const express = require('express');
const router = express.Router();
const {
  obtenerMisNotificaciones,
  obtenerNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  crearNotificacion,
  eliminarNotificacion,
  obtenerConteoNoLeidas
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener mis notificaciones (con filtro opcional)
router.get('/', obtenerMisNotificaciones);

// Obtener solo las no leídas
router.get('/no-leidas', obtenerNoLeidas);

// Obtener conteo de no leídas
router.get('/conteo', obtenerConteoNoLeidas);

// Crear notificación (puede ser restringido a admin)
router.post('/', crearNotificacion);

// Marcar una notificación como leída
router.put('/:id/leer', marcarComoLeida);

// Marcar todas como leídas
router.put('/leer-todas', marcarTodasComoLeidas);

// Eliminar una notificación
router.delete('/:id', eliminarNotificacion);

module.exports = router;
