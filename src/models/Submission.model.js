const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tareaId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'La tarea es requerida'
      }
    }
  },
  estudianteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'El estudiante es requerido'
      }
    }
  },
  archivo_entrega: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comentarios_estudiante: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_entrega: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado_entrega: {
    type: DataTypes.ENUM('Pendiente', 'Entregada', 'Tarde', 'Calificada'),
    defaultValue: 'Pendiente'
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'La nota mínima es 0'
      },
      max: {
        args: [100],
        msg: 'La nota máxima es 100'
      }
    }
  },
  retroalimentacion_docente: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_calificacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estado_calificacion: {
    type: DataTypes.ENUM('Sin Calificar', 'Calificada', 'Revisión'),
    defaultValue: 'Sin Calificar'
  }
}, {
  tableName: 'submissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tareaId', 'estudianteId'],
      name: 'unique_submission_per_task_student'
    }
  ],
  hooks: {
    beforeSave: async (submission) => {
      // Actualizar estado según fecha de entrega
      if (submission.changed('fecha_entrega') || submission.isNewRecord) {
        const Task = require('./Task.model');
        const tarea = await Task.findByPk(submission.tareaId);

        if (tarea && submission.fecha_entrega > tarea.fecha_vencimiento) {
          submission.estado_entrega = 'Tarde';
        } else if (submission.estado_entrega === 'Pendiente') {
          submission.estado_entrega = 'Entregada';
        }
      }
    }
  }
});

module.exports = Submission;
