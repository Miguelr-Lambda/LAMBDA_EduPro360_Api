const Grade = require('../models/Grade.model');
const Class = require('../models/Class.model');
const User = require('../models/User.model');

// @desc    Crear/Actualizar calificación (Solo Profesor de la clase)
// @route   POST /api/grades
// @access  Private/Profesor
exports.crearCalificacion = async (req, res) => {
  try {
    const { estudiante, clase, calificacion, descripcion, periodo } = req.body;

    // Validar campos requeridos
    if (!estudiante || !clase || calificacion === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione estudiante, clase y calificación'
      });
    }

    // Verificar que la clase existe
    const claseDoc = await Class.findById(clase);
    if (!claseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la clase
    if (req.user.rol === 'profesor' && claseDoc.profesor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para calificar en esta clase'
      });
    }

    // Verificar que el estudiante existe y tiene rol de estudiante
    const estudianteDoc = await User.findById(estudiante);
    if (!estudianteDoc || estudianteDoc.rol !== 'estudiante') {
      return res.status(400).json({
        success: false,
        message: 'El estudiante especificado no es válido'
      });
    }

    // Verificar que el estudiante está inscrito en la clase
    if (!claseDoc.estudiantes.includes(estudiante)) {
      return res.status(400).json({
        success: false,
        message: 'El estudiante no está inscrito en esta clase'
      });
    }

    // Buscar si ya existe una calificación para este estudiante, clase y periodo
    let grade = await Grade.findOne({
      estudiante,
      clase,
      periodo: periodo || 'Primer Periodo'
    });

    if (grade) {
      // Actualizar calificación existente
      grade.calificacion = calificacion;
      grade.descripcion = descripcion;
      await grade.save();

      const gradeActualizada = await Grade.findById(grade._id)
        .populate('estudiante', 'nombreCompleto email grado')
        .populate('clase', 'nombreClase')
        .populate('profesor', 'nombreCompleto');

      return res.status(200).json({
        success: true,
        message: 'Calificación actualizada exitosamente',
        grade: gradeActualizada
      });
    }

    // Crear nueva calificación
    const nuevaGrade = await Grade.create({
      estudiante,
      clase,
      calificacion,
      descripcion,
      periodo: periodo || 'Primer Periodo',
      profesor: req.user._id
    });

    const gradeCreada = await Grade.findById(nuevaGrade._id)
      .populate('estudiante', 'nombreCompleto email grado')
      .populate('clase', 'nombreClase')
      .populate('profesor', 'nombreCompleto');

    res.status(201).json({
      success: true,
      message: 'Calificación creada exitosamente',
      grade: gradeCreada
    });

  } catch (error) {
    console.error('Error al crear calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear calificación',
      error: error.message
    });
  }
};

// @desc    Obtener calificaciones de una clase (Solo Profesor de la clase)
// @route   GET /api/grades/clase/:claseId
// @access  Private/Profesor
exports.obtenerCalificacionesClase = async (req, res) => {
  try {
    const { claseId } = req.params;

    // Verificar que la clase existe
    const clase = await Class.findById(claseId);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la clase
    if (req.user.rol === 'profesor' && clase.profesor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para ver las calificaciones de esta clase'
      });
    }

    const calificaciones = await Grade.find({ clase: claseId })
      .populate('estudiante', 'nombreCompleto email grado')
      .populate('clase', 'nombreClase')
      .populate('profesor', 'nombreCompleto')
      .sort('estudiante');

    res.status(200).json({
      success: true,
      count: calificaciones.length,
      calificaciones
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificaciones',
      error: error.message
    });
  }
};

// @desc    Obtener calificaciones de un estudiante (Estudiante solo puede ver las suyas)
// @route   GET /api/grades/estudiante/:estudianteId
// @access  Private/Estudiante/Profesor/Admin
exports.obtenerCalificacionesEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // Verificar que el estudiante autenticado solo pueda ver sus propias calificaciones
    if (req.user.rol === 'estudiante' && req.user._id.toString() !== estudianteId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estas calificaciones'
      });
    }

    const calificaciones = await Grade.find({ estudiante: estudianteId })
      .populate('clase', 'nombreClase descripcion')
      .populate('profesor', 'nombreCompleto')
      .sort('clase');

    res.status(200).json({
      success: true,
      count: calificaciones.length,
      calificaciones
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificaciones',
      error: error.message
    });
  }
};

// @desc    Obtener mis calificaciones (Estudiante autenticado)
// @route   GET /api/grades/mis-calificaciones
// @access  Private/Estudiante
exports.obtenerMisCalificaciones = async (req, res) => {
  try {
    const calificaciones = await Grade.find({ estudiante: req.user._id })
      .populate('clase', 'nombreClase descripcion')
      .populate('profesor', 'nombreCompleto')
      .sort('clase');

    res.status(200).json({
      success: true,
      count: calificaciones.length,
      calificaciones
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificaciones',
      error: error.message
    });
  }
};

// @desc    Actualizar calificación
// @route   PUT /api/grades/:id
// @access  Private/Profesor
exports.actualizarCalificacion = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la calificación
    if (req.user.rol === 'profesor' && grade.profesor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para actualizar esta calificación'
      });
    }

    const { calificacion, descripcion } = req.body;

    if (calificacion !== undefined) grade.calificacion = calificacion;
    if (descripcion !== undefined) grade.descripcion = descripcion;

    await grade.save();

    const gradeActualizada = await Grade.findById(grade._id)
      .populate('estudiante', 'nombreCompleto email grado')
      .populate('clase', 'nombreClase')
      .populate('profesor', 'nombreCompleto');

    res.status(200).json({
      success: true,
      message: 'Calificación actualizada exitosamente',
      grade: gradeActualizada
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar calificación',
      error: error.message
    });
  }
};

// @desc    Eliminar calificación
// @route   DELETE /api/grades/:id
// @access  Private/Profesor/Admin
exports.eliminarCalificacion = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la calificación
    if (req.user.rol === 'profesor' && grade.profesor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para eliminar esta calificación'
      });
    }

    await Grade.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Calificación eliminada exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar calificación',
      error: error.message
    });
  }
};

// @desc    Generar reporte de calificaciones (Estudiante)
// @route   GET /api/grades/reporte/:estudianteId
// @access  Private/Estudiante
exports.generarReporte = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // Verificar que el estudiante autenticado solo pueda generar su propio reporte
    if (req.user.rol === 'estudiante' && req.user._id.toString() !== estudianteId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para generar este reporte'
      });
    }

    const estudiante = await User.findById(estudianteId);
    if (!estudiante) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const calificaciones = await Grade.find({ estudiante: estudianteId })
      .populate('clase', 'nombreClase descripcion')
      .populate('profesor', 'nombreCompleto')
      .sort('clase');

    // Calcular promedio
    const promedio = calificaciones.length > 0
      ? calificaciones.reduce((sum, grade) => sum + grade.calificacion, 0) / calificaciones.length
      : 0;

    const reporte = {
      estudiante: {
        nombreCompleto: estudiante.nombreCompleto,
        grado: estudiante.grado,
        email: estudiante.email
      },
      calificaciones: calificaciones.map(cal => ({
        clase: cal.clase.nombreClase,
        calificacion: cal.calificacion,
        descripcion: cal.descripcion,
        periodo: cal.periodo,
        profesor: cal.profesor.nombreCompleto
      })),
      promedio: promedio.toFixed(2),
      totalClases: calificaciones.length,
      fechaGeneracion: new Date()
    };

    res.status(200).json({
      success: true,
      reporte
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};
