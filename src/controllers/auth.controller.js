const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Generar JWT Token
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;

    // Validar datos
    if (!usuario || !contraseña) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione usuario y contraseña'
      });
    }

    // Buscar usuario y incluir contraseña
    const user = await User.findOne({ usuario }).select('+contraseña');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isMatch = await user.compararContraseña(contraseña);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si está activo
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Generar token
    const token = generarToken(user._id);

    // Preparar respuesta según el rol
    const userData = {
      _id: user._id,
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      usuario: user.usuario,
      documentoIdentidad: user.documentoIdentidad,
      rol: user.rol
    };

    // Agregar campos específicos según el rol
    if (user.rol === 'profesor') {
      userData.clasesAsignadas = user.clasesAsignadas;
    } else if (user.rol === 'estudiante') {
      userData.grado = user.grado;
      userData.contactoEmergencia = user.contactoEmergencia;
      userData.observacionesMedicas = user.observacionesMedicas;
    }

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('clasesAsignadas', 'nombreClase descripcion');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// @desc    Logout de usuario
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // En una implementación real con tokens en base de datos, aquí se invalidaría el token
    res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};
