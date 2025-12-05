const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  asignatura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'La asignatura es requerida']
  },
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  fecha_publicacion: {
    type: Date,
    default: Date.now
  },
  fecha_vencimiento: {
    type: Date,
    required: [true, 'La fecha de vencimiento es requerida']
  },
  peso_porcentual: {
    type: Number,
    required: [true, 'El peso porcentual es requerido'],
    min: [0, 'El peso debe ser mayor a 0'],
    max: [100, 'El peso debe ser menor o igual a 100']
  },
  tipo_tarea: {
    type: String,
    enum: ['Tarea', 'Examen', 'Proyecto', 'Quiz', 'Participación'],
    default: 'Tarea'
  },
  estado: {
    type: String,
    enum: ['Activa', 'Inactiva', 'Finalizada'],
    default: 'Activa'
  },
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El docente es requerido']
  }
}, {
  timestamps: true
});

// Validación: fecha de vencimiento debe ser posterior a fecha de publicación
taskSchema.pre('save', function(next) {
  if (this.fecha_vencimiento <= this.fecha_publicacion) {
    return next(new Error('La fecha de vencimiento debe ser posterior a la fecha de publicación'));
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
