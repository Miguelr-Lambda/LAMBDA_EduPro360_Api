const { Class, User } = require('../models');
const { sequelize } = require('../config/database');

// @desc    Crear nueva clase (Solo Administrador)
// @route   POST /api/classes
// @access  Private/Admin
exports.crearClase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { nombreClase, profesor, descripcion, horario } = req.body;

    // Validar campos requeridos
    if (!nombreClase || !profesor) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el nombre de la clase y el profesor'
      });
    }

    // Verificar que el profesor existe y tiene rol de profesor
    const profesorUser = await User.findByPk(profesor, { transaction });
    if (!profesorUser || profesorUser.rol !== 'profesor') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El profesor especificado no es válido'
      });
    }

    // Crear clase
    const nuevaClase = await Class.create({
      nombreClase,
      profesorId: profesor,
      descripcion,
      horarioDia: horario?.dia,
      horarioHora: horario?.hora
    }, { transaction });

    await transaction.commit();

    const clase = await Class.findByPk(nuevaClase.id, {
      include: [{
        association: 'profesor',
        attributes: ['id', 'nombreCompleto', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Clase creada exitosamente',
      clase
    });

  } catch (error) {
    await transaction.rollback();
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
    const clases = await Class.findAll({
      where: { activa: true },
      include: [
        {
          association: 'profesor',
          attributes: ['id', 'nombreCompleto', 'email']
        },
        {
          association: 'estudiantes',
          attributes: ['id', 'nombreCompleto', 'email', 'grado'],
          through: { attributes: [] }
        }
      ]
    });

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
    if (req.user.rol === 'profesor' && req.user.id !== profesorId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estas clases'
      });
    }

    const clases = await Class.findAll({
      where: { profesorId: profesorId, activa: true },
      include: [{
        association: 'estudiantes',
        attributes: ['id', 'nombreCompleto', 'email', 'grado'],
        through: { attributes: [] }
      }]
    });

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
    const clase = await Class.findByPk(req.params.id, {
      include: [
        {
          association: 'profesor',
          attributes: ['id', 'nombreCompleto', 'email']
        },
        {
          association: 'estudiantes',
          attributes: ['id', 'nombreCompleto', 'email', 'grado'],
          through: { attributes: [] }
        }
      ]
    });

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
    const clase = await Class.findByPk(req.params.id);

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    const { nombreClase, profesor, descripcion, horario } = req.body;

    // Si se está actualizando el profesor, verificar que sea válido
    if (profesor && profesor !== clase.profesorId) {
      const profesorUser = await User.findByPk(profesor);
      if (!profesorUser || profesorUser.rol !== 'profesor') {
        return res.status(400).json({
          success: false,
          message: 'El profesor especificado no es válido'
        });
      }
    }

    await clase.update({
      nombreClase: nombreClase || clase.nombreClase,
      profesorId: profesor || clase.profesorId,
      descripcion: descripcion !== undefined ? descripcion : clase.descripcion,
      horarioDia: horario?.dia || clase.horarioDia,
      horarioHora: horario?.hora || clase.horarioHora
    });

    const claseActualizada = await Class.findByPk(req.params.id, {
      include: [{
        association: 'profesor',
        attributes: ['id', 'nombreCompleto', 'email']
      }]
    });

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

    const clase = await Class.findByPk(req.params.id);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    const estudiante = await User.findByPk(estudianteId);
    if (!estudiante || estudiante.rol !== 'estudiante') {
      return res.status(400).json({
        success: false,
        message: 'El estudiante especificado no es válido'
      });
    }

    // Agregar estudiante a la clase (many-to-many)
    await clase.addEstudiante(estudiante);

    const claseActualizada = await Class.findByPk(req.params.id, {
      include: [{
        association: 'estudiantes',
        attributes: ['id', 'nombreCompleto', 'email', 'grado'],
        through: { attributes: [] }
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Estudiante agregado a la clase exitosamente',
      clase: claseActualizada
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar estudiante a la clase',
      error: error.message
    });
  }
};

// @desc    Remover estudiante de clase
// @route   DELETE /api/classes/:id/estudiantes/:estudianteId
// @access  Private/Admin
exports.removerEstudiante = async (req, res) => {
  try {
    const { id, estudianteId } = req.params;

    const clase = await Class.findByPk(id);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    const estudiante = await User.findByPk(estudianteId);
    if (!estudiante) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Remover estudiante de la clase
    await clase.removeEstudiante(estudiante);

    res.status(200).json({
      success: true,
      message: 'Estudiante removido de la clase exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al remover estudiante de la clase',
      error: error.message
    });
  }
};

// @desc    Desactivar clase
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.desactivarClase = async (req, res) => {
  try {
    const clase = await Class.findByPk(req.params.id);

    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    await clase.update({ activa: false });

    res.status(200).json({
      success: true,
      message: 'Clase desactivada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al desactivar clase',
      error: error.message
    });
  }
};
