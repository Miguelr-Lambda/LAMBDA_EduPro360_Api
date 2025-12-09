const { Grade, User, Class } = require('../models');
const { Op } = require('sequelize');

// @desc    Crear o actualizar calificación
// @route   POST /api/grades
// @access  Private/Profesor
exports.crearCalificacion = async (req, res) => {
  try {
    const { estudiante, clase, calificacion, descripcion, periodo } = req.body;

    // Validar campos requeridos
    if (!estudiante || !clase || calificacion === undefined || !periodo) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos'
      });
    }

    // Verificar que el estudiante existe y es estudiante
    const estudianteUser = await User.findByPk(estudiante);
    if (!estudianteUser || estudianteUser.rol !== 'estudiante') {
      return res.status(400).json({
        success: false,
        message: 'El estudiante especificado no es válido'
      });
    }

    // Verificar que la clase existe
    const claseObj = await Class.findByPk(clase);
    if (!claseObj) {
      return res.status(400).json({
        success: false,
        message: 'La clase especificada no existe'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la clase
    if (req.user.rol === 'profesor' && claseObj.profesorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para calificar en esta clase'
      });
    }

    // Buscar si ya existe una calificación para este estudiante, clase y periodo
    const calificacionExistente = await Grade.findOne({
      where: {
        estudianteId: estudiante,
        claseId: clase,
        periodo
      }
    });

    let nuevaCalificacion;

    if (calificacionExistente) {
      // Actualizar calificación existente
      await calificacionExistente.update({
        calificacion,
        descripcion,
        profesorId: req.user.id
      });
      nuevaCalificacion = calificacionExistente;
    } else {
      // Crear nueva calificación
      nuevaCalificacion = await Grade.create({
        estudianteId: estudiante,
        claseId: clase,
        calificacion,
        descripcion,
        periodo,
        profesorId: req.user.id
      });
    }

    const calificacionConDatos = await Grade.findByPk(nuevaCalificacion.id, {
      include: [
        {
          association: 'estudiante',
          attributes: ['id', 'nombreCompleto', 'email', 'grado']
        },
        {
          association: 'clase',
          attributes: ['id', 'nombreClase']
        },
        {
          association: 'profesor',
          attributes: ['id', 'nombreCompleto', 'email']
        }
      ]
    });

    res.status(calificacionExistente ? 200 : 201).json({
      success: true,
      message: calificacionExistente ? 'Calificación actualizada exitosamente' : 'Calificación creada exitosamente',
      calificacion: calificacionConDatos
    });

  } catch (error) {
    console.error('Error al crear/actualizar calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar calificación',
      error: error.message
    });
  }
};

// @desc    Obtener calificaciones de una clase
// @route   GET /api/grades/clase/:claseId
// @access  Private/Profesor/Admin
exports.obtenerCalificacionesClase = async (req, res) => {
  try {
    const { claseId } = req.params;

    // Verificar que la clase existe
    const clase = await Class.findByPk(claseId);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la clase
    if (req.user.rol === 'profesor' && clase.profesorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estas calificaciones'
      });
    }

    const calificaciones = await Grade.findAll({
      where: { claseId },
      include: [
        {
          association: 'estudiante',
          attributes: ['id', 'nombreCompleto', 'email', 'grado']
        },
        {
          association: 'clase',
          attributes: ['id', 'nombreClase']
        }
      ],
      order: [['periodo', 'ASC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: calificaciones.length,
      calificaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificaciones de la clase',
      error: error.message
    });
  }
};

// @desc    Obtener calificaciones de un estudiante
// @route   GET /api/grades/estudiante/:estudianteId
// @access  Private/Profesor/Admin
exports.obtenerCalificacionesEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // Verificar que el estudiante existe
    const estudiante = await User.findByPk(estudianteId);
    if (!estudiante || estudiante.rol !== 'estudiante') {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const calificaciones = await Grade.findAll({
      where: { estudianteId },
      include: [
        {
          association: 'clase',
          attributes: ['id', 'nombreClase', 'descripcion']
        },
        {
          association: 'profesor',
          attributes: ['id', 'nombreCompleto', 'email']
        }
      ],
      order: [['periodo', 'ASC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: calificaciones.length,
      calificaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificaciones del estudiante',
      error: error.message
    });
  }
};

// @desc    Obtener mis calificaciones (Estudiante autenticado)
// @route   GET /api/grades/mis-calificaciones
// @access  Private/Estudiante
exports.obtenerMisCalificaciones = async (req, res) => {
  try {
    if (req.user.rol !== 'estudiante') {
      return res.status(403).json({
        success: false,
        message: 'Solo los estudiantes pueden acceder a esta ruta'
      });
    }

    const calificaciones = await Grade.findAll({
      where: { estudianteId: req.user.id },
      include: [
        {
          association: 'clase',
          attributes: ['id', 'nombreClase', 'descripcion']
        },
        {
          association: 'profesor',
          attributes: ['id', 'nombreCompleto', 'email']
        }
      ],
      order: [['periodo', 'ASC'], ['createdAt', 'DESC']]
    });

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

// @desc    Generar reporte de calificaciones de un estudiante
// @route   GET /api/grades/reporte/:estudianteId
// @access  Private/Profesor/Admin/Estudiante
exports.generarReporte = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // Verificar permisos
    if (req.user.rol === 'estudiante' && req.user.id !== estudianteId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este reporte'
      });
    }

    // Obtener información del estudiante
    const estudiante = await User.findByPk(estudianteId, {
      attributes: ['id', 'nombreCompleto', 'email', 'grado', 'documentoIdentidad']
    });

    if (!estudiante || estudiante.rol !== 'estudiante') {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Obtener todas las calificaciones del estudiante
    const calificaciones = await Grade.findAll({
      where: { estudianteId },
      include: [
        {
          association: 'clase',
          attributes: ['nombreClase', 'descripcion']
        },
        {
          association: 'profesor',
          attributes: ['nombreCompleto']
        }
      ],
      order: [['periodo', 'ASC']]
    });

    // Calcular promedio
    const promedio = calificaciones.length > 0
      ? (calificaciones.reduce((sum, cal) => sum + parseFloat(cal.calificacion), 0) / calificaciones.length).toFixed(2)
      : 0;

    // Formatear calificaciones para el reporte
    const calificacionesFormateadas = calificaciones.map(cal => ({
      clase: cal.clase.nombreClase,
      calificacion: cal.calificacion,
      descripcion: cal.descripcion,
      periodo: cal.periodo,
      profesor: cal.profesor.nombreCompleto,
      fecha: cal.createdAt
    }));

    const reporte = {
      estudiante: {
        nombreCompleto: estudiante.nombreCompleto,
        grado: estudiante.grado,
        email: estudiante.email,
        documentoIdentidad: estudiante.documentoIdentidad
      },
      calificaciones: calificacionesFormateadas,
      promedio,
      totalClases: calificacionesFormateadas.length,
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

// @desc    Actualizar calificación
// @route   PUT /api/grades/:id
// @access  Private/Profesor
exports.actualizarCalificacion = async (req, res) => {
  try {
    const calificacionObj = await Grade.findByPk(req.params.id, {
      include: [{
        association: 'clase'
      }]
    });

    if (!calificacionObj) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la clase
    if (req.user.rol === 'profesor' && calificacionObj.clase.profesorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para actualizar esta calificación'
      });
    }

    const { calificacion, descripcion, periodo } = req.body;

    await calificacionObj.update({
      calificacion: calificacion !== undefined ? calificacion : calificacionObj.calificacion,
      descripcion: descripcion !== undefined ? descripcion : calificacionObj.descripcion,
      periodo: periodo || calificacionObj.periodo
    });

    const calificacionActualizada = await Grade.findByPk(req.params.id, {
      include: [
        {
          association: 'estudiante',
          attributes: ['id', 'nombreCompleto', 'email']
        },
        {
          association: 'clase',
          attributes: ['id', 'nombreClase']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Calificación actualizada exitosamente',
      calificacion: calificacionActualizada
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
    const calificacion = await Grade.findByPk(req.params.id, {
      include: [{
        association: 'clase'
      }]
    });

    if (!calificacion) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    // Verificar que el profesor autenticado es el profesor de la clase
    if (req.user.rol === 'profesor' && calificacion.clase.profesorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar esta calificación'
      });
    }

    await calificacion.destroy();

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
