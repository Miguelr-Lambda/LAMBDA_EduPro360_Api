const Submission = require('../models/Submission.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

// @desc    Crear/Actualizar entrega (Solo Estudiante)
// @route   POST /api/submissions
// @access  Private/Estudiante
exports.crearEntrega = async (req, res) => {
  try {
    const { tarea, archivo_entrega, comentarios_estudiante } = req.body;

    // Validar campos requeridos
    if (!tarea) {
      return res.status(400).json({
        success: false,
        message: 'La tarea es requerida'
      });
    }

    // Verificar que la tarea existe
    const tareaDoc = await Task.findById(tarea);
    if (!tareaDoc) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar que la tarea está activa
    if (tareaDoc.estado !== 'Activa') {
      return res.status(400).json({
        success: false,
        message: 'La tarea no está activa'
      });
    }

    // Buscar si ya existe una entrega
    let entrega = await Submission.findOne({
      tarea,
      estudiante: req.user._id
    });

    if (entrega) {
      // Actualizar entrega existente
      entrega.archivo_entrega = archivo_entrega || entrega.archivo_entrega;
      entrega.comentarios_estudiante = comentarios_estudiante || entrega.comentarios_estudiante;
      entrega.fecha_entrega = Date.now();
      await entrega.save();

      const entregaActualizada = await Submission.findById(entrega._id)
        .populate('tarea', 'titulo tipo_tarea fecha_vencimiento')
        .populate('estudiante', 'nombreCompleto email');

      return res.status(200).json({
        success: true,
        message: 'Entrega actualizada exitosamente',
        entrega: entregaActualizada
      });
    }

    // Crear nueva entrega
    const nuevaEntrega = await Submission.create({
      tarea,
      estudiante: req.user._id,
      archivo_entrega,
      comentarios_estudiante
    });

    const entregaCreada = await Submission.findById(nuevaEntrega._id)
      .populate('tarea', 'titulo tipo_tarea fecha_vencimiento')
      .populate('estudiante', 'nombreCompleto email');

    res.status(201).json({
      success: true,
      message: 'Entrega creada exitosamente',
      entrega: entregaCreada
    });

  } catch (error) {
    console.error('Error al crear entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear entrega',
      error: error.message
    });
  }
};

// @desc    Obtener entregas de una tarea (Solo Profesor)
// @route   GET /api/submissions/tarea/:tareaId
// @access  Private/Profesor
exports.obtenerEntregasTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;

    // Verificar que la tarea existe y el profesor es el responsable
    const tarea = await Task.findById(tareaId);
    if (!tarea) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (req.user.rol === 'profesor' && tarea.docente.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para ver estas entregas'
      });
    }

    const entregas = await Submission.find({ tarea: tareaId })
      .populate('estudiante', 'nombreCompleto email grado')
      .populate('tarea', 'titulo tipo_tarea')
      .sort('fecha_entrega');

    res.status(200).json({
      success: true,
      count: entregas.length,
      entregas
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregas',
      error: error.message
    });
  }
};

// @desc    Obtener mis entregas (Estudiante)
// @route   GET /api/submissions/mis-entregas
// @access  Private/Estudiante
exports.obtenerMisEntregas = async (req, res) => {
  try {
    const entregas = await Submission.find({ estudiante: req.user._id })
      .populate('tarea', 'titulo tipo_tarea fecha_vencimiento peso_porcentual asignatura')
      .populate({
        path: 'tarea',
        populate: {
          path: 'asignatura',
          select: 'nombreClase'
        }
      })
      .sort('-fecha_entrega');

    res.status(200).json({
      success: true,
      count: entregas.length,
      entregas
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregas',
      error: error.message
    });
  }
};

// @desc    Calificar entrega (Solo Profesor)
// @route   PUT /api/submissions/:id/calificar
// @access  Private/Profesor
exports.calificarEntrega = async (req, res) => {
  try {
    const { nota, retroalimentacion_docente } = req.body;

    if (nota === undefined) {
      return res.status(400).json({
        success: false,
        message: 'La nota es requerida'
      });
    }

    const entrega = await Submission.findById(req.params.id).populate('tarea');

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    // Verificar que el profesor es el responsable
    const tarea = await Task.findById(entrega.tarea);
    if (req.user.rol === 'profesor' && tarea.docente.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para calificar esta entrega'
      });
    }

    entrega.nota = nota;
    entrega.retroalimentacion_docente = retroalimentacion_docente;
    entrega.fecha_calificacion = Date.now();
    entrega.estado_calificacion = 'Calificada';
    entrega.estado_entrega = 'Calificada';

    await entrega.save();

    const entregaCalificada = await Submission.findById(entrega._id)
      .populate('estudiante', 'nombreCompleto email')
      .populate('tarea', 'titulo tipo_tarea');

    res.status(200).json({
      success: true,
      message: 'Entrega calificada exitosamente',
      entrega: entregaCalificada
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al calificar entrega',
      error: error.message
    });
  }
};
