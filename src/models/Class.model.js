const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  nombreClase: {
    type: String,
    required: [true, 'El nombre de la clase es requerido'],
    trim: true
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El profesor es requerido']
  },
  descripcion: {
    type: String,
    trim: true
  },
  horario: {
    dia: {
      type: String,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    },
    hora: {
      type: String
    }
  },
  estudiantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validación para asegurar que el profesor tenga rol de profesor
classSchema.pre('save', async function(next) {
  if (this.isModified('profesor')) {
    const User = mongoose.model('User');
    const profesor = await User.findById(this.profesor);

    if (!profesor || profesor.rol !== 'profesor') {
      return next(new Error('El usuario asignado debe tener rol de profesor'));
    }
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);
