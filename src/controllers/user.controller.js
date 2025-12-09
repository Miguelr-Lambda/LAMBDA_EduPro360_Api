const { User, Class } = require('../models');
const { Op } = require('sequelize');

// @desc    Registrar nuevo profesor (Solo Administrador)
// @route   POST /api/users/profesor
// @access  Private/Admin
exports.registrarProfesor = async (req, res) => {
  try {
    const { nombreCompleto, email, usuario, contraseña, documentoIdentidad } = req.body;

    // Validar campos requeridos
    if (!nombreCompleto || !email || !usuario || !contraseña || !documentoIdentidad) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos'
      });
    }

    // Verificar si el usuario o email ya existe
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { usuario }, { documentoIdentidad }]
      }
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario, email o documento de identidad ya está registrado'
      });
    }

    // Crear profesor
    const profesor = await User.create({
      nombreCompleto,
      email,
      usuario,
      contraseña,
      documentoIdentidad,
      rol: 'profesor'
    });

    res.status(201).json({
      success: true,
      message: 'Profesor registrado exitosamente',
      user: {
        id: profesor.id,
        nombreCompleto: profesor.nombreCompleto,
        email: profesor.email,
        usuario: profesor.usuario,
        rol: profesor.rol
      }
    });

  } catch (error) {
    console.error('Error al registrar profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar profesor',
      error: error.message
    });
  }
};

// @desc    Registrar nuevo estudiante (Solo Administrador)
// @route   POST /api/users/estudiante
// @access  Private/Admin
exports.registrarEstudiante = async (req, res) => {
  try {
    const {
      nombreCompleto,
      email,
      usuario,
      contraseña,
      documentoIdentidad,
      grado,
      contactoEmergencia,
      observacionesMedicas
    } = req.body;

    // Validar campos requeridos
    if (!nombreCompleto || !email || !usuario || !contraseña || !documentoIdentidad || !grado) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos'
      });
    }

    // Verificar si el usuario o email ya existe
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { usuario }, { documentoIdentidad }]
      }
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario, email o documento de identidad ya está registrado'
      });
    }

    // Crear estudiante
    const estudiante = await User.create({
      nombreCompleto,
      email,
      usuario,
      contraseña,
      documentoIdentidad,
      rol: 'estudiante',
      grado,
      contactoEmergencia,
      observacionesMedicas
    });

    res.status(201).json({
      success: true,
      message: 'Estudiante registrado exitosamente',
      user: {
        id: estudiante.id,
        nombreCompleto: estudiante.nombreCompleto,
        email: estudiante.email,
        usuario: estudiante.usuario,
        rol: estudiante.rol,
        grado: estudiante.grado
      }
    });

  } catch (error) {
    console.error('Error al registrar estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar estudiante',
      error: error.message
    });
  }
};

// @desc    Obtener todos los profesores
// @route   GET /api/users/profesores
// @access  Private/Admin
exports.obtenerProfesores = async (req, res) => {
  try {
    const profesores = await User.findAll({
      where: { rol: 'profesor' },
      attributes: { exclude: ['contraseña'] },
      include: [{
        association: 'clasesAsignadas',
        attributes: ['id', 'nombreClase']
      }]
    });

    res.status(200).json({
      success: true,
      count: profesores.length,
      profesores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesores',
      error: error.message
    });
  }
};

// @desc    Obtener todos los estudiantes
// @route   GET /api/users/estudiantes
// @access  Private/Admin/Profesor
exports.obtenerEstudiantes = async (req, res) => {
  try {
    const estudiantes = await User.findAll({
      where: { rol: 'estudiante' },
      attributes: { exclude: ['contraseña'] }
    });

    res.status(200).json({
      success: true,
      count: estudiantes.length,
      estudiantes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: error.message
    });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.obtenerUsuario = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['contraseña'] },
      include: [{
        association: 'clasesAsignadas',
        attributes: ['nombreClase', 'descripcion']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.actualizarUsuario = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir actualizar contraseña desde aquí
    if (req.body.contraseña) {
      delete req.body.contraseña;
    }

    // No permitir actualizar rol
    if (req.body.rol) {
      delete req.body.rol;
    }

    await user.update(req.body);

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['contraseña'] }
    });

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// @desc    Eliminar usuario (desactivar)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.eliminarUsuario = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Desactivar en lugar de eliminar
    await user.update({ activo: false });

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};
