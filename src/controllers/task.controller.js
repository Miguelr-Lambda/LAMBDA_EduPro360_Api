const Task = require('../models/Task.model');
const Class = require('../models/Class.model');
const User = require('../models/User.model');

// @desc    Crear tarea (Solo Profesor)
// @route   POST /api/tasks
// @access  Private/Profesor
exports.crearTarea = async (req, res) => {
  try {
    const { asignatura, titulo, descripcion, fecha_vencimiento, peso_porcentual, tipo_tarea } = req.body;

    // Validar campos requeridos
    if (!asignatura || !titulo || !fecha_vencimiento || !peso_porcentual) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos'
      });
    }

    // Verificar que la clase existe
    const clase = await Class.findById(asignatura);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Verificar que el profesor es el responsable de la clase
    if (req.user.rol === 'profesor' && clase.profesor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para crear tareas en esta clase'
      });
    }

    // Crear tarea
    const tarea = await Task.create({
      asignatura,
      titulo,
      descripcion,
      fecha_vencimiento,
      peso_porcentual,
      tipo_tarea: tipo_tarea || 'Tarea',
      docente: req.user._id
    });

    const tareaCreada = await Task.findById(tarea._id)
      .populate('asignatura', 'nombreClase')
      .populate('docente', 'nombreCompleto');

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      tarea: tareaCreada
    });

  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear tarea',
      error: error.message
    });
  }
};

// @desc    Obtener tareas de una clase
// @route   GET /api/tasks/clase/:claseId
// @access  Private
exports.obtenerTareasClase = async (req, res) => {
  try {
    const { claseId } = req.params;

    const tareas = await Task.find({ asignatura: claseId })
      .populate('docente', 'nombreCompleto')
      .sort('-fecha_publicacion');

    res.status(200).json({
      success: true,
      count: tareas.length,
      tareas
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas',
      error: error.message
    });
  }
};

// @desc    Obtener tareas del profesor
// @route   GET /api/tasks/mis-tareas
// @access  Private/Profesor
exports.obtenerMisTareas = async (req, res) => {
  try {
    const tareas = await Task.find({ docente: req.user._id })
      .populate('asignatura', 'nombreClase')
      .sort('-fecha_publicacion');

    res.status(200).json({
      success: true,
      count: tareas.length,
      tareas
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas',
      error: error.message
    });
  }
};

// @desc    Actualizar tarea
// @route   PUT /api/tasks/:id
// @access  Private/Profesor
exports.actualizarTarea = async (req, res) => {
  try {
    const tarea = await Task.findById(req.params.id);

    if (!tarea) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar que el profesor es el creador
    if (req.user.rol === 'profesor' && tarea.docente.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para actualizar esta tarea'
      });
    }

    const tareaActualizada = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('asignatura', 'nombreClase');

    res.status(200).json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      tarea: tareaActualizada
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tarea',
      error: error.message
    });
  }
};

// @desc    Eliminar tarea
// @route   DELETE /api/tasks/:id
// @access  Private/Profesor/Admin
exports.eliminarTarea = async (req, res) => {
  try {
    const tarea = await Task.findById(req.params.id);

    if (!tarea) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.rol === 'profesor' && tarea.docente.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para eliminar esta tarea'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tarea',
      error: error.message
    });
  }
};
