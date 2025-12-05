const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'La tarea es requerida']
  },
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El estudiante es requerido']
  },
  archivo_entrega: {
    type: String, // URL o nombre del archivo
    trim: true
  },
  comentarios_estudiante: {
    type: String,
    trim: true
  },
  fecha_entrega: {
    type: Date,
    default: Date.now
  },
  estado_entrega: {
    type: String,
    enum: ['Pendiente', 'Entregada', 'Tarde', 'Calificada'],
    default: 'Pendiente'
  },
  nota: {
    type: Number,
    min: 0,
    max: 100
  },
  retroalimentacion_docente: {
    type: String,
    trim: true
  },
  fecha_calificacion: {
    type: Date
  },
  estado_calificacion: {
    type: String,
    enum: ['Sin Calificar', 'Calificada', 'Revisión'],
    default: 'Sin Calificar'
  }
}, {
  timestamps: true
});

// Índice para evitar duplicados
submissionSchema.index({ tarea: 1, estudiante: 1 }, { unique: true });

// Actualizar estado según fecha de entrega
submissionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('fecha_entrega')) {
    const Task = mongoose.model('Task');
    const tarea = await Task.findById(this.tarea);

    if (tarea && this.fecha_entrega > tarea.fecha_vencimiento) {
      this.estado_entrega = 'Tarde';
    } else if (this.estado_entrega === 'Pendiente') {
      this.estado_entrega = 'Entregada';
    }
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);
