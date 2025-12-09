const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  asignaturaId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'La asignatura es requerida'
      }
    }
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título es requerido'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_publicacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_vencimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La fecha de vencimiento es requerida'
      }
    }
  },
  peso_porcentual: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El peso porcentual es requerido'
      },
      min: {
        args: [0],
        msg: 'El peso debe ser mayor a 0'
      },
      max: {
        args: [100],
        msg: 'El peso debe ser menor o igual a 100'
      }
    }
  },
  tipo_tarea: {
    type: DataTypes.ENUM('Tarea', 'Examen', 'Proyecto', 'Quiz', 'Participación'),
    defaultValue: 'Tarea'
  },
  estado: {
    type: DataTypes.ENUM('Activa', 'Inactiva', 'Finalizada'),
    defaultValue: 'Activa'
  },
  docenteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'El docente es requerido'
      }
    }
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  hooks: {
    beforeSave: async (task) => {
      // Validación: fecha de vencimiento debe ser posterior a fecha de publicación
      if (task.fecha_vencimiento <= task.fecha_publicacion) {
        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de publicación');
      }
    }
  }
});

module.exports = Task;
