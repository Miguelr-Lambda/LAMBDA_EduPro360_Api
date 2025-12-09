const User = require('./User.model');
const Class = require('./Class.model');
const Grade = require('./Grade.model');
const Task = require('./Task.model');
const Submission = require('./Submission.model');
const Notification = require('./Notification.model');

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

// Task - Class (Asignatura)
Task.belongsTo(Class, {
  foreignKey: 'asignaturaId',
  as: 'asignatura'
});
Class.hasMany(Task, {
  foreignKey: 'asignaturaId',
  as: 'tareas'
});

// Task - User (Docente)
Task.belongsTo(User, {
  foreignKey: 'docenteId',
  as: 'docente'
});
User.hasMany(Task, {
  foreignKey: 'docenteId',
  as: 'tareasCreadas'
});

// Submission - Task
Submission.belongsTo(Task, {
  foreignKey: 'tareaId',
  as: 'tarea'
});
Task.hasMany(Submission, {
  foreignKey: 'tareaId',
  as: 'entregas'
});

// Submission - User (Estudiante)
Submission.belongsTo(User, {
  foreignKey: 'estudianteId',
  as: 'estudiante'
});
User.hasMany(Submission, {
  foreignKey: 'estudianteId',
  as: 'entregas'
});

// Notification - User
Notification.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario'
});
User.hasMany(Notification, {
  foreignKey: 'usuarioId',
  as: 'notificaciones'
});

module.exports = {
  User,
  Class,
  Grade,
  Task,
  Submission,
  Notification
};
