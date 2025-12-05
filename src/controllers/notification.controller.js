const Notification = require('../models/Notification.model');

// Obtener todas las notificaciones del usuario
const obtenerMisNotificaciones = async (req, res) => {
  try {
    const { leidas } = req.query;
    const userId = req.user._id;

    let query = { usuario: userId };

    // Filtrar por leídas si se especifica
    if (leidas !== undefined) {
      query.leida = leidas === 'true';
    }

    const notificaciones = await Notification.find(query)
      .sort({ fecha_creacion: -1 })
      .limit(100);

    res.json({
      success: true,
      notificaciones,
      total: notificaciones.length,
      noLeidas: await Notification.countDocuments({ usuario: userId, leida: false })
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
    const userId = req.user._id;

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
    const userId = req.user._id;

    const notificacion = await Notification.findOne({ _id: id, usuario: userId });

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
    const userId = req.user._id;

    const result = await Notification.marcarTodasComoLeidas(userId);

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
      actualizadas: result.modifiedCount
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
    const { usuario, tipo, titulo, mensaje, urgente, referencia } = req.body;

    if (!usuario || !tipo || !titulo || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const notificacion = await Notification.crearNotificacion({
      usuario,
      tipo,
      titulo,
      mensaje,
      urgente: urgente || false,
      referencia
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
    const userId = req.user._id;

    const notificacion = await Notification.findOneAndDelete({ _id: id, usuario: userId });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

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
    const userId = req.user._id;
    const count = await Notification.countDocuments({ usuario: userId, leida: false });

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
