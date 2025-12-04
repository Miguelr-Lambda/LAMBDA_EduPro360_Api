const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El estudiante es requerido']
  },
  clase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'La clase es requerida']
  },
  calificacion: {
    type: Number,
    required: [true, 'La calificación es requerida'],
    min: [0, 'La calificación mínima es 0'],
    max: [100, 'La calificación máxima es 100']
  },
  descripcion: {
    type: String,
    trim: true
  },
  periodo: {
    type: String,
    enum: ['Primer Periodo', 'Segundo Periodo', 'Tercer Periodo', 'Cuarto Periodo'],
    default: 'Primer Periodo'
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El profesor es requerido']
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar duplicados de calificación por estudiante, clase y periodo
gradeSchema.index({ estudiante: 1, clase: 1, periodo: 1 }, { unique: true });

// Validación para asegurar que el estudiante tenga rol de estudiante
gradeSchema.pre('save', async function(next) {
  if (this.isModified('estudiante')) {
    const User = mongoose.model('User');
    const estudiante = await User.findById(this.estudiante);

    if (!estudiante || estudiante.rol !== 'estudiante') {
      return next(new Error('El usuario debe tener rol de estudiante'));
    }
  }
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);
