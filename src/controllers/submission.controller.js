const { Submission, Task, User } = require('../models');

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
    const tareaDoc = await Task.findByPk(tarea);
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
      where: {
        tareaId: tarea,
        estudianteId: req.user.id
      }
    });

    if (entrega) {
      // Actualizar entrega existente
      await entrega.update({
        archivo_entrega: archivo_entrega || entrega.archivo_entrega,
        comentarios_estudiante: comentarios_estudiante || entrega.comentarios_estudiante,
        fecha_entrega: new Date()
      });

      const entregaActualizada = await Submission.findByPk(entrega.id, {
        include: [
          {
            association: 'tarea',
            attributes: ['titulo', 'tipo_tarea', 'fecha_vencimiento']
          },
          {
            association: 'estudiante',
            attributes: ['nombreCompleto', 'email']
          }
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Entrega actualizada exitosamente',
        entrega: entregaActualizada
      });
    }

    // Crear nueva entrega
    const nuevaEntrega = await Submission.create({
      tareaId: tarea,
      estudianteId: req.user.id,
      archivo_entrega,
      comentarios_estudiante
    });

    const entregaCreada = await Submission.findByPk(nuevaEntrega.id, {
      include: [
        {
          association: 'tarea',
          attributes: ['titulo', 'tipo_tarea', 'fecha_vencimiento']
        },
        {
          association: 'estudiante',
          attributes: ['nombreCompleto', 'email']
        }
      ]
    });

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
    const tarea = await Task.findByPk(tareaId);
    if (!tarea) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (req.user.rol === 'profesor' && tarea.docenteId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para ver estas entregas'
      });
    }

    const entregas = await Submission.findAll({
      where: { tareaId },
      include: [
        {
          association: 'estudiante',
          attributes: ['id', 'nombreCompleto', 'email', 'grado']
        },
        {
          association: 'tarea',
          attributes: ['titulo', 'tipo_tarea']
        }
      ],
      order: [['fecha_entrega', 'ASC']]
    });

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
    const entregas = await Submission.findAll({
      where: { estudianteId: req.user.id },
      include: [
        {
          association: 'tarea',
          attributes: ['titulo', 'tipo_tarea', 'fecha_vencimiento', 'peso_porcentual'],
          include: [{
            association: 'asignatura',
            attributes: ['nombreClase']
          }]
        }
      ],
      order: [['fecha_entrega', 'DESC']]
    });

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

    const entrega = await Submission.findByPk(req.params.id, {
      include: [{
        association: 'tarea'
      }]
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    // Verificar que el profesor es el responsable
    if (req.user.rol === 'profesor' && entrega.tarea.docenteId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para calificar esta entrega'
      });
    }

    await entrega.update({
      nota,
      retroalimentacion_docente,
      fecha_calificacion: new Date(),
      estado_calificacion: 'Calificada',
      estado_entrega: 'Calificada'
    });

    const entregaCalificada = await Submission.findByPk(entrega.id, {
      include: [
        {
          association: 'estudiante',
          attributes: ['nombreCompleto', 'email']
        },
        {
          association: 'tarea',
          attributes: ['titulo', 'tipo_tarea']
        }
      ]
    });

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
