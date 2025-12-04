const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User.model');
const Class = require('../models/Class.model');
const Grade = require('../models/Grade.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    await User.deleteMany({});
    await Class.deleteMany({});
    await Grade.deleteMany({});

    // Crear Administrador
    console.log('👤 Creando Administrador...');
    const admin = await User.create({
      nombreCompleto: 'Carlos Administrador',
      email: 'admin@edupro360.com',
      usuario: 'admin',
      contraseña: 'admin123',
      documentoIdentidad: 'ADM001',
      rol: 'administrador'
    });

    // Crear Profesores
    console.log('👨‍🏫 Creando Profesores...');
    const profesor1 = await User.create({
      nombreCompleto: 'María García',
      email: 'maria.garcia@edupro360.com',
      usuario: 'mgarcia',
      contraseña: 'profesor123',
      documentoIdentidad: 'PROF001',
      rol: 'profesor',
      clasesAsignadas: []
    });

    const profesor2 = await User.create({
      nombreCompleto: 'Juan Pérez',
      email: 'juan.perez@edupro360.com',
      usuario: 'jperez',
      contraseña: 'profesor123',
      documentoIdentidad: 'PROF002',
      rol: 'profesor',
      clasesAsignadas: []
    });

    const profesor3 = await User.create({
      nombreCompleto: 'Ana Rodríguez',
      email: 'ana.rodriguez@edupro360.com',
      usuario: 'arodriguez',
      contraseña: 'profesor123',
      documentoIdentidad: 'PROF003',
      rol: 'profesor',
      clasesAsignadas: []
    });

    // Crear Estudiantes
    console.log('👨‍🎓 Creando Estudiantes...');
    const estudiante1 = await User.create({
      nombreCompleto: 'John Smith',
      email: 'john.smith@estudiante.com',
      usuario: 'jsmith',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST001',
      rol: 'estudiante',
      grado: 'Tercer Grado',
      contactoEmergencia: '555-0101',
      observacionesMedicas: 'Ninguna'
    });

    const estudiante2 = await User.create({
      nombreCompleto: 'Emily Johnson',
      email: 'emily.johnson@estudiante.com',
      usuario: 'ejohnson',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST002',
      rol: 'estudiante',
      grado: 'Tercer Grado',
      contactoEmergencia: '555-0102',
      observacionesMedicas: 'Alergia al polen'
    });

    const estudiante3 = await User.create({
      nombreCompleto: 'Michael Brown',
      email: 'michael.brown@estudiante.com',
      usuario: 'mbrown',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST003',
      rol: 'estudiante',
      grado: 'Tercer Grado',
      contactoEmergencia: '555-0103',
      observacionesMedicas: 'Ninguna'
    });

    const estudiante4 = await User.create({
      nombreCompleto: 'Sarah Wilson',
      email: 'sarah.wilson@estudiante.com',
      usuario: 'swilson',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST004',
      rol: 'estudiante',
      grado: 'Tercer Grado',
      contactoEmergencia: '555-0104',
      observacionesMedicas: 'Asma leve'
    });

    const estudiante5 = await User.create({
      nombreCompleto: 'David Martinez',
      email: 'david.martinez@estudiante.com',
      usuario: 'dmartinez',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST005',
      rol: 'estudiante',
      grado: 'Cuarto Grado',
      contactoEmergencia: '555-0105',
      observacionesMedicas: 'Ninguna'
    });

    // Crear Clases
    console.log('📚 Creando Clases...');
    const matematicas = await Class.create({
      nombreClase: 'Matemáticas',
      profesor: profesor1._id,
      descripcion: 'Curso de matemáticas básicas',
      horario: {
        dia: 'Lunes',
        hora: '08:00 AM'
      },
      estudiantes: [estudiante1._id, estudiante2._id, estudiante3._id, estudiante4._id]
    });

    const sociales = await Class.create({
      nombreClase: 'Sociales',
      profesor: profesor2._id,
      descripcion: 'Historia y geografía',
      horario: {
        dia: 'Martes',
        hora: '10:00 AM'
      },
      estudiantes: [estudiante1._id, estudiante2._id, estudiante3._id, estudiante4._id]
    });

    const lecturaCritica = await Class.create({
      nombreClase: 'Lectura Crítica',
      profesor: profesor3._id,
      descripcion: 'Comprensión lectora y análisis',
      horario: {
        dia: 'Miércoles',
        hora: '09:00 AM'
      },
      estudiantes: [estudiante1._id, estudiante2._id, estudiante3._id, estudiante4._id]
    });

    const ingles = await Class.create({
      nombreClase: 'Inglés',
      profesor: profesor1._id,
      descripcion: 'Inglés básico',
      horario: {
        dia: 'Jueves',
        hora: '11:00 AM'
      },
      estudiantes: [estudiante1._id, estudiante2._id, estudiante3._id, estudiante4._id]
    });

    // Actualizar clases asignadas de profesores
    await User.findByIdAndUpdate(profesor1._id, {
      $push: { clasesAsignadas: { $each: [matematicas._id, ingles._id] } }
    });

    await User.findByIdAndUpdate(profesor2._id, {
      $push: { clasesAsignadas: sociales._id }
    });

    await User.findByIdAndUpdate(profesor3._id, {
      $push: { clasesAsignadas: lecturaCritica._id }
    });

    // Crear Calificaciones
    console.log('📝 Creando Calificaciones...');

    // Calificaciones de John Smith
    await Grade.create([
      {
        estudiante: estudiante1._id,
        clase: matematicas._id,
        calificacion: 88,
        descripcion: 'Buen desempeño en álgebra',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      },
      {
        estudiante: estudiante1._id,
        clase: sociales._id,
        calificacion: 92,
        descripcion: 'Excelente participación',
        periodo: 'Primer Periodo',
        profesor: profesor2._id
      },
      {
        estudiante: estudiante1._id,
        clase: lecturaCritica._id,
        calificacion: 85,
        descripcion: 'Buena comprensión lectora',
        periodo: 'Primer Periodo',
        profesor: profesor3._id
      },
      {
        estudiante: estudiante1._id,
        clase: ingles._id,
        calificacion: 90,
        descripcion: 'Muy buena pronunciación',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      }
    ]);

    // Calificaciones de Emily Johnson
    await Grade.create([
      {
        estudiante: estudiante2._id,
        clase: matematicas._id,
        calificacion: 92,
        descripcion: 'Excelente en geometría',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      },
      {
        estudiante: estudiante2._id,
        clase: sociales._id,
        calificacion: 88,
        descripcion: 'Buen conocimiento histórico',
        periodo: 'Primer Periodo',
        profesor: profesor2._id
      },
      {
        estudiante: estudiante2._id,
        clase: lecturaCritica._id,
        calificacion: 95,
        descripcion: 'Análisis profundo de textos',
        periodo: 'Primer Periodo',
        profesor: profesor3._id
      },
      {
        estudiante: estudiante2._id,
        clase: ingles._id,
        calificacion: 87,
        descripcion: 'Buen vocabulario',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      }
    ]);

    // Calificaciones de Michael Brown
    await Grade.create([
      {
        estudiante: estudiante3._id,
        clase: matematicas._id,
        calificacion: 85,
        descripcion: 'Progreso constante',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      },
      {
        estudiante: estudiante3._id,
        clase: sociales._id,
        calificacion: 90,
        descripcion: 'Gran interés en geografía',
        periodo: 'Primer Periodo',
        profesor: profesor2._id
      },
      {
        estudiante: estudiante3._id,
        clase: lecturaCritica._id,
        calificacion: 83,
        descripcion: 'Mejoró en comprensión',
        periodo: 'Primer Periodo',
        profesor: profesor3._id
      },
      {
        estudiante: estudiante3._id,
        clase: ingles._id,
        calificacion: 86,
        descripcion: 'Buen esfuerzo',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      }
    ]);

    // Calificaciones de Sarah Wilson
    await Grade.create([
      {
        estudiante: estudiante4._id,
        clase: matematicas._id,
        calificacion: 80,
        descripcion: 'Necesita refuerzo',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      },
      {
        estudiante: estudiante4._id,
        clase: sociales._id,
        calificacion: 85,
        descripcion: 'Buena participación',
        periodo: 'Primer Periodo',
        profesor: profesor2._id
      },
      {
        estudiante: estudiante4._id,
        clase: lecturaCritica._id,
        calificacion: 88,
        descripcion: 'Excelente redacción',
        periodo: 'Primer Periodo',
        profesor: profesor3._id
      },
      {
        estudiante: estudiante4._id,
        clase: ingles._id,
        calificacion: 82,
        descripcion: 'En progreso',
        periodo: 'Primer Periodo',
        profesor: profesor1._id
      }
    ]);

    console.log('✅ Base de datos poblada exitosamente');
    console.log('\n📋 Credenciales de acceso:');
    console.log('\n--- Administrador ---');
    console.log('Usuario: admin');
    console.log('Contraseña: admin123');
    console.log('\n--- Profesores ---');
    console.log('Usuario: mgarcia | Contraseña: profesor123');
    console.log('Usuario: jperez | Contraseña: profesor123');
    console.log('Usuario: arodriguez | Contraseña: profesor123');
    console.log('\n--- Estudiantes ---');
    console.log('Usuario: jsmith | Contraseña: estudiante123');
    console.log('Usuario: ejohnson | Contraseña: estudiante123');
    console.log('Usuario: mbrown | Contraseña: estudiante123');
    console.log('Usuario: swilson | Contraseña: estudiante123');
    console.log('Usuario: dmartinez | Contraseña: estudiante123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error al poblar base de datos:', error);
    process.exit(1);
  }
};

// Ejecutar
connectDB().then(() => seedDatabase());
