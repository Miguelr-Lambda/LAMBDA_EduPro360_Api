const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: [true, 'El nombre completo es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un correo válido']
  },
  usuario: {
    type: String,
    required: [true, 'El usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El usuario debe tener al menos 3 caracteres']
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  documentoIdentidad: {
    type: String,
    required: [true, 'El documento de identidad es requerido'],
    unique: true
  },
  rol: {
    type: String,
    enum: ['administrador', 'profesor', 'estudiante'],
    default: 'estudiante',
    required: true
  },
  // Campos específicos para Profesor
  clasesAsignadas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  // Campos específicos para Estudiante
  grado: {
    type: String,
    enum: ['Primer Grado', 'Segundo Grado', 'Tercer Grado', 'Cuarto Grado', 'Quinto Grado', 'Sexto Grado'],
    required: function() {
      return this.rol === 'estudiante';
    }
  },
  contactoEmergencia: {
    type: String
  },
  observacionesMedicas: {
    type: String
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('contraseña')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.compararContraseña = async function(contraseñaIngresada) {
  return await bcrypt.compare(contraseñaIngresada, this.contraseña);
};

// Método para obtener datos públicos del usuario
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.contraseña;
  return user;
};

module.exports = mongoose.model('User', userSchema);
