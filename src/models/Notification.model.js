const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['tarea_nueva', 'tarea_vencida', 'calificacion_nueva', 'entrega_calificada', 'general'],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  urgente: {
    type: Boolean,
    default: false
  },
  // Referencia opcional al objeto relacionado
  referencia: {
    tipo: {
      type: String,
      enum: ['tarea', 'calificacion', 'entrega', 'clase', null]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice para búsquedas eficientes
notificationSchema.index({ usuario: 1, leida: 1, fecha_creacion: -1 });

// Método para marcar como leída
notificationSchema.methods.marcarComoLeida = async function() {
  this.leida = true;
  return await this.save();
};

// Método estático para crear notificación
notificationSchema.statics.crearNotificacion = async function(datos) {
  const notificacion = new this(datos);
  return await notificacion.save();
};

// Método estático para obtener notificaciones no leídas
notificationSchema.statics.obtenerNoLeidas = async function(usuarioId) {
  return await this.find({ usuario: usuarioId, leida: false })
    .sort({ fecha_creacion: -1 })
    .limit(50);
};

// Método estático para marcar todas como leídas
notificationSchema.statics.marcarTodasComoLeidas = async function(usuarioId) {
  return await this.updateMany(
    { usuario: usuarioId, leida: false },
    { $set: { leida: true } }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
