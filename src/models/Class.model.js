const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombreClase: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre de la clase es requerido'
      }
    }
  },
  profesorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'El profesor es requerido'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  horarioDia: {
    type: DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
    allowNull: true
  },
  horarioHora: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'classes',
  timestamps: true,
  hooks: {
    beforeSave: async (classInstance) => {
      // Validar que el profesor tenga rol de profesor
      if (classInstance.profesorId) {
        const User = require('./User.model');
        const profesor = await User.findByPk(classInstance.profesorId);

        if (!profesor || profesor.rol !== 'profesor') {
          throw new Error('El usuario asignado debe tener rol de profesor');
        }
      }
    }
  }
});

module.exports = Class;
