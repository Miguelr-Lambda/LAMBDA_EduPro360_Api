const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  claseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'La clase es requerida'
      }
    }
  },
  calificacion: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La calificación es requerida'
      },
      min: {
        args: [0],
        msg: 'La calificación mínima es 0'
      },
      max: {
        args: [100],
        msg: 'La calificación máxima es 100'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  periodo: {
    type: DataTypes.ENUM('Primer Periodo', 'Segundo Periodo', 'Tercer Periodo', 'Cuarto Periodo'),
    allowNull: false,
    defaultValue: 'Primer Periodo'
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
  }
}, {
  tableName: 'grades',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['estudianteId', 'claseId', 'periodo'],
      name: 'unique_grade_per_student_class_period'
    }
  ],
  hooks: {
    beforeSave: async (grade) => {
      // Validar que el estudiante tenga rol de estudiante
      if (grade.estudianteId) {
        const User = require('./User.model');
        const estudiante = await User.findByPk(grade.estudianteId);

        if (!estudiante || estudiante.rol !== 'estudiante') {
          throw new Error('El usuario debe tener rol de estudiante');
        }
      }
    }
  }
});

module.exports = Grade;
