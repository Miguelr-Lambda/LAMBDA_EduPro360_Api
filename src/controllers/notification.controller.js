const Notification = require('../models/Notification.model');

// Obtener todas las notificaciones del usuario
const obtenerMisNotificaciones = async (req, res) => {
  try {
    const { leidas } = req.query;
    const userId = req.user.id;

    let where = { usuarioId: userId };

    // Filtrar por leídas si se especifica
    if (leidas !== undefined) {
      where.leida = leidas === 'true';
    }

    const notificaciones = await Notification.findAll({
      where,
      order: [['fecha_creacion', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      notificaciones,
      total: notificaciones.length,
      noLeidas: await Notification.count({ where: { usuarioId: userId, leida: false } })
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones'
    });
  }
};

// Obtener notificaciones no leídas
const obtenerNoLeidas = async (req, res) => {
  try {
    const userId = req.user.id;

    const notificaciones = await Notification.obtenerNoLeidas(userId);
    const count = notificaciones.length;

    res.json({
      success: true,
      notificaciones,
      count
    });
  } catch (error) {
    console.error('Error al obtener notificaciones no leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones no leídas'
    });
  }
};

// Marcar notificación como leída
const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notificacion = await Notification.findOne({
      where: { id, usuarioId: userId }
    });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await notificacion.marcarComoLeida();

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      notificacion
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída'
    });
  }
};

// Marcar todas las notificaciones como leídas
const marcarTodasComoLeidas = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.marcarTodasComoLeidas(userId);

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
      actualizadas: result[0]
    });
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas como leídas'
    });
  }
};

// Crear notificación (admin/sistema)
const crearNotificacion = async (req, res) => {
  try {
    const { usuarioId, tipo, titulo, mensaje, urgente, referenciaTipo, referenciaId } = req.body;

    if (!usuarioId || !tipo || !titulo || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const notificacion = await Notification.crearNotificacion({
      usuarioId,
      tipo,
      titulo,
      mensaje,
      urgente: urgente || false,
      referenciaTipo,
      referenciaId
    });

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      notificacion
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear notificación'
    });
  }
};

// Eliminar notificación
const eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notificacion = await Notification.findOne({
      where: { id, usuarioId: userId }
    });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await notificacion.destroy();

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación'
    });
  }
};

// Obtener conteo de no leídas
const obtenerConteoNoLeidas = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.count({
      where: { usuarioId: userId, leida: false }
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error al obtener conteo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conteo'
    });
  }
};

module.exports = {
  obtenerMisNotificaciones,
  obtenerNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  crearNotificacion,
  eliminarNotificacion,
  obtenerConteoNoLeidas
};
