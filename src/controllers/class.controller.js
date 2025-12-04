const Class = require('../models/Class.model');
const User = require('../models/User.model');

// @desc    Crear nueva clase (Solo Administrador)
// @route   POST /api/classes
// @access  Private/Admin
exports.crearClase = async (req, res) => {
  try {
    const { nombreClase, profesor, descripcion, horario } = req.body;

    // Validar campos requeridos
    if (!nombreClase || !profesor) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el nombre de la clase y el profesor'
      });
    }

    // Verificar que el profesor existe y tiene rol de profesor
    const profesorUser = await User.findById(profesor);
    if (!profesorUser || profesorUser.rol !== 'profesor') {
      return res.status(400).json({
        success: false,
        message: 'El profesor especificado no es válido'
      });
    }

    // Crear clase
    const nuevaClase = await Class.create({
      nombreClase,
      profesor,
      descripcion,
      horario
    });

    // Agregar la clase al profesor
    await User.findByIdAndUpdate(profesor, {
      $push: { clasesAsignadas: nuevaClase._id }
    });

    const clase = await Class.findById(nuevaClase._id).populate('profesor', 'nombreCompleto email');

    res.status(201).json({
      success: true,
      message: 'Clase creada exitosamente',
      clase
    });

  } catch (error) {
    console.error('Error al crear clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear clase',
      error: error.message
    });
  }
};

// @desc    Obtener todas las clases
// @route   GET /api/classes
// @access  Private/Admin
exports.obtenerClases = async (req, res) => {
  try {
    const clases = await Class.find({ activa: true })
      .populate('profesor', 'nombreCompleto email')
      .populate('estudiantes', 'nombreCompleto email grado');

    res.status(200).json({
      success: true,
      count: clases.length,
      clases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener clases',
      error: error.message
    });
  }
};

// @desc    Obtener clases de un profesor
// @route   GET /api/classes/profesor/:profesorId
// @access  Private/Profesor
exports.obtenerClasesProfesor = async (req, res) => {
  try {
    const { profesorId } = req.params;

    // Verificar que el profesor autenticado solo pueda ver sus propias clases
    if (req.user.rol === 'profesor' && req.user._id.toString() !== profesorId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estas clases'
      });
    }

    const clases = await Class.find({ profesor: profesorId, activa: true })
      .populate('estudiantes', 'nombreCompleto email grado');

    res.status(200).json({
      success: true,
      count: clases.length,
      clases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener clases del profesor',
      error: error.message
    });
  }
};

// @desc    Obtener clase por ID
// @route   GET /api/classes/:id
// @access  Private
exports.obtenerClase = async (req, res) => {
  try {
    const clase = await Class.findById(req.params.id)
      .populate('profesor', 'nombreCompleto email')
      .populate('estudiantes', 'nombreCompleto email grado');

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      clase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener clase',
      error: error.message
    });
  }
};

// @desc    Actualizar clase
// @route   PUT /api/classes/:id
// @access  Private/Admin
exports.actualizarClase = async (req, res) => {
  try {
    const clase = await Class.findById(req.params.id);

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Si se actualiza el profesor, verificar que sea válido
    if (req.body.profesor) {
      const profesorUser = await User.findById(req.body.profesor);
      if (!profesorUser || profesorUser.rol !== 'profesor') {
        return res.status(400).json({
          success: false,
          message: 'El profesor especificado no es válido'
        });
      }

      // Remover clase del profesor anterior
      await User.findByIdAndUpdate(clase.profesor, {
        $pull: { clasesAsignadas: clase._id }
      });

      // Agregar clase al nuevo profesor
      await User.findByIdAndUpdate(req.body.profesor, {
        $push: { clasesAsignadas: clase._id }
      });
    }

    const claseActualizada = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('profesor', 'nombreCompleto email');

    res.status(200).json({
      success: true,
      message: 'Clase actualizada exitosamente',
      clase: claseActualizada
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar clase',
      error: error.message
    });
  }
};

// @desc    Eliminar clase (desactivar)
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.eliminarClase = async (req, res) => {
  try {
    const clase = await Class.findById(req.params.id);

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Desactivar en lugar de eliminar
    clase.activa = false;
    await clase.save();

    res.status(200).json({
      success: true,
      message: 'Clase desactivada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar clase',
      error: error.message
    });
  }
};

// @desc    Agregar estudiante a clase
// @route   POST /api/classes/:id/estudiantes
// @access  Private/Admin
exports.agregarEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.body;

    if (!estudianteId) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el ID del estudiante'
      });
    }

    // Verificar que el estudiante existe
    const estudiante = await User.findById(estudianteId);
    if (!estudiante || estudiante.rol !== 'estudiante') {
      return res.status(400).json({
        success: false,
        message: 'El estudiante especificado no es válido'
      });
    }

    const clase = await Class.findById(req.params.id);

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Verificar si el estudiante ya está en la clase
    if (clase.estudiantes.includes(estudianteId)) {
      return res.status(400).json({
        success: false,
        message: 'El estudiante ya está inscrito en esta clase'
      });
    }

    clase.estudiantes.push(estudianteId);
    await clase.save();

    const claseActualizada = await Class.findById(clase._id)
      .populate('estudiantes', 'nombreCompleto email grado');

    res.status(200).json({
      success: true,
      message: 'Estudiante agregado exitosamente',
      clase: claseActualizada
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar estudiante',
      error: error.message
    });
  }
};

// @desc    Remover estudiante de clase
// @route   DELETE /api/classes/:id/estudiantes/:estudianteId
// @access  Private/Admin
exports.removerEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    const clase = await Class.findById(req.params.id);

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    clase.estudiantes = clase.estudiantes.filter(
      est => est.toString() !== estudianteId
    );

    await clase.save();

    res.status(200).json({
      success: true,
      message: 'Estudiante removido exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al remover estudiante',
      error: error.message
    });
  }
};
