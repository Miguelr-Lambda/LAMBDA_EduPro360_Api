const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('tarea_nueva', 'tarea_vencida', 'calificacion_nueva', 'entrega_calificada', 'general'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  urgente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Referencia opcional al objeto relacionado
  referenciaTipo: {
    type: DataTypes.ENUM('tarea', 'calificacion', 'entrega', 'clase'),
    allowNull: true
  },
  referenciaId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['usuarioId', 'leida', 'fecha_creacion'],
      name: 'notifications_search_index'
    }
  ]
});

// Método de instancia para marcar como leída
Notification.prototype.marcarComoLeida = async function() {
  this.leida = true;
  return await this.save();
};

// Métodos estáticos
Notification.crearNotificacion = async function(datos) {
  return await this.create(datos);
};

Notification.obtenerNoLeidas = async function(usuarioId) {
  return await this.findAll({
    where: { usuarioId, leida: false },
    order: [['fecha_creacion', 'DESC']],
    limit: 50
  });
};

Notification.marcarTodasComoLeidas = async function(usuarioId) {
  return await this.update(
    { leida: true },
    { where: { usuarioId, leida: false } }
  );
};

module.exports = Notification;
