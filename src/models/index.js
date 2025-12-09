const User = require('./User.model');
const Class = require('./Class.model');
const Grade = require('./Grade.model');

// Definir relaciones

// User - Class (Profesor)
User.hasMany(Class, {
  foreignKey: 'profesorId',
  as: 'clasesAsignadas'
});
Class.belongsTo(User, {
  foreignKey: 'profesorId',
  as: 'profesor'
});

// Class - User (Estudiantes) - Relación Many-to-Many
Class.belongsToMany(User, {
  through: 'class_students',
  foreignKey: 'claseId',
  otherKey: 'estudianteId',
  as: 'estudiantes'
});
User.belongsToMany(Class, {
  through: 'class_students',
  foreignKey: 'estudianteId',
  otherKey: 'claseId',
  as: 'clasesInscritas'
});

// Grade - User (Estudiante)
Grade.belongsTo(User, {
  foreignKey: 'estudianteId',
  as: 'estudiante'
});
User.hasMany(Grade, {
  foreignKey: 'estudianteId',
  as: 'calificaciones'
});

// Grade - User (Profesor)
Grade.belongsTo(User, {
  foreignKey: 'profesorId',
  as: 'profesor'
});

// Grade - Class
Grade.belongsTo(Class, {
  foreignKey: 'claseId',
  as: 'clase'
});
Class.hasMany(Grade, {
  foreignKey: 'claseId',
  as: 'calificaciones'
});

module.exports = {
  User,
  Class,
  Grade
};
