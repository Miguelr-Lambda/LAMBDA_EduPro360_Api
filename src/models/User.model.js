const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombreCompleto: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre completo es requerido'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Este correo electrónico ya está registrado'
    },
    validate: {
      isEmail: {
        msg: 'Por favor ingrese un correo válido'
      },
      notEmpty: {
        msg: 'El correo electrónico es requerido'
      }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Este nombre de usuario ya está en uso'
    },
    validate: {
      notEmpty: {
        msg: 'El usuario es requerido'
      },
      len: {
        args: [3, 50],
        msg: 'El usuario debe tener al menos 3 caracteres'
      }
    },
    set(value) {
      this.setDataValue('usuario', value.trim());
    }
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La contraseña es requerida'
      },
      len: {
        args: [6, 100],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },
  documentoIdentidad: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Este documento de identidad ya está registrado'
    },
    validate: {
      notEmpty: {
        msg: 'El documento de identidad es requerido'
      }
    }
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'profesor', 'estudiante'),
    allowNull: false,
    defaultValue: 'estudiante',
    validate: {
      isIn: {
        args: [['administrador', 'profesor', 'estudiante']],
        msg: 'El rol debe ser administrador, profesor o estudiante'
      }
    }
  },
  // Campos específicos para Estudiante
  grado: {
    type: DataTypes.ENUM('Primer Grado', 'Segundo Grado', 'Tercer Grado', 'Cuarto Grado', 'Quinto Grado', 'Sexto Grado'),
    allowNull: true,
    validate: {
      isGradoRequired() {
        if (this.rol === 'estudiante' && !this.grado) {
          throw new Error('El grado es requerido para estudiantes');
        }
      }
    }
  },
  contactoEmergencia: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observacionesMedicas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.contraseña) {
        const salt = await bcrypt.genSalt(10);
        user.contraseña = await bcrypt.hash(user.contraseña, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('contraseña')) {
        const salt = await bcrypt.genSalt(10);
        user.contraseña = await bcrypt.hash(user.contraseña, salt);
      }
    }
  }
});

// Método para comparar contraseñas
User.prototype.compararContraseña = async function(contraseñaIngresada) {
  return await bcrypt.compare(contraseñaIngresada, this.contraseña);
};

// Método para obtener datos públicos del usuario
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.contraseña;
  return values;
};

module.exports = User;
