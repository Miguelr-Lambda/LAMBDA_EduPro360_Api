const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Proteger rutas - verificar JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verificar si el token está en el header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuario
      req.user = await User.findById(decoded.id).select('-contraseña');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (!req.user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación'
    });
  }
};

// Autorizar roles específicos
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.rol} no está autorizado para acceder a este recurso`
      });
    }
    next();
  };
};
