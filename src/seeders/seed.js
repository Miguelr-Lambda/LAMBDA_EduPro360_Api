require('dotenv').config();
const { sequelize, connectDB } = require('../config/database');
const { User, Class, Grade } = require('../models');

const seedDatabase = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos limpia');

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
    console.log('  ✓ Admin creado:', admin.usuario);

    // Crear Profesores
    console.log('👨‍🏫 Creando Profesores...');
    const profesor1 = await User.create({
      nombreCompleto: 'María García',
      email: 'maria.garcia@edupro360.com',
      usuario: 'mgarcia',
      contraseña: 'profesor123',
      documentoIdentidad: 'PROF001',
      rol: 'profesor'
    });
    console.log('  ✓ Profesor creado:', profesor1.usuario);

    const profesor2 = await User.create({
      nombreCompleto: 'Juan Pérez',
      email: 'juan.perez@edupro360.com',
      usuario: 'jperez',
      contraseña: 'profesor123',
      documentoIdentidad: 'PROF002',
      rol: 'profesor'
    });
    console.log('  ✓ Profesor creado:', profesor2.usuario);

    const profesor3 = await User.create({
      nombreCompleto: 'Ana Rodríguez',
      email: 'ana.rodriguez@edupro360.com',
      usuario: 'arodriguez',
      contraseña: 'profesor123',
      documentoIdentidad: 'PROF003',
      rol: 'profesor'
    });
    console.log('  ✓ Profesor creado:', profesor3.usuario);

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
    console.log('  ✓ Estudiante creado:', estudiante1.usuario);

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
    console.log('  ✓ Estudiante creado:', estudiante2.usuario);

    const estudiante3 = await User.create({
      nombreCompleto: 'Michael Brown',
      email: 'michael.brown@estudiante.com',
      usuario: 'mbrown',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST003',
      rol: 'estudiante',
      grado: 'Cuarto Grado',
      contactoEmergencia: '555-0103',
      observacionesMedicas: 'Asma leve'
    });
    console.log('  ✓ Estudiante creado:', estudiante3.usuario);

    const estudiante4 = await User.create({
      nombreCompleto: 'Sarah Wilson',
      email: 'sarah.wilson@estudiante.com',
      usuario: 'swilson',
      contraseña: 'estudiante123',
      documentoIdentidad: 'EST004',
      rol: 'estudiante',
      grado: 'Tercer Grado',
      contactoEmergencia: '555-0104',
      observacionesMedicas: 'Ninguna'
    });
    console.log('  ✓ Estudiante creado:', estudiante4.usuario);

    // Crear Clases
    console.log('📚 Creando Clases...');
    const clase1 = await Class.create({
      nombreClase: 'Matemáticas',
      profesorId: profesor1.id,
      descripcion: 'Matemáticas básicas para tercer grado',
      horarioDia: 'Lunes',
      horarioHora: '08:00 AM'
    });
    console.log('  ✓ Clase creada:', clase1.nombreClase);

    const clase2 = await Class.create({
      nombreClase: 'Ciencias Naturales',
      profesorId: profesor2.id,
      descripcion: 'Introducción a las ciencias naturales',
      horarioDia: 'Martes',
      horarioHora: '09:00 AM'
    });
    console.log('  ✓ Clase creada:', clase2.nombreClase);

    const clase3 = await Class.create({
      nombreClase: 'Lenguaje y Literatura',
      profesorId: profesor3.id,
      descripcion: 'Comprensión lectora y escritura creativa',
      horarioDia: 'Miércoles',
      horarioHora: '10:00 AM'
    });
    console.log('  ✓ Clase creada:', clase3.nombreClase);

    const clase4 = await Class.create({
      nombreClase: 'Estudios Sociales',
      profesorId: profesor1.id,
      descripcion: 'Historia y geografía básica',
      horarioDia: 'Jueves',
      horarioHora: '11:00 AM'
    });
    console.log('  ✓ Clase creada:', clase4.nombreClase);

    // Asignar estudiantes a las clases
    console.log('📝 Asignando estudiantes a clases...');
    await clase1.addEstudiantes([estudiante1, estudiante2, estudiante4]);
    await clase2.addEstudiantes([estudiante1, estudiante2, estudiante3]);
    await clase3.addEstudiantes([estudiante1, estudiante3, estudiante4]);
    await clase4.addEstudiantes([estudiante2, estudiante3, estudiante4]);
    console.log('  ✓ Estudiantes asignados a clases');

    // Crear Calificaciones
    console.log('📊 Creando Calificaciones...');

    // Calificaciones para John Smith
    await Grade.create({
      estudianteId: estudiante1.id,
      claseId: clase1.id,
      calificacion: 88,
      descripcion: 'Buen desempeño en matemáticas',
      periodo: 'Primer Periodo',
      profesorId: profesor1.id
    });

    await Grade.create({
      estudianteId: estudiante1.id,
      claseId: clase2.id,
      calificacion: 92,
      descripcion: 'Excelente participación',
      periodo: 'Primer Periodo',
      profesorId: profesor2.id
    });

    await Grade.create({
      estudianteId: estudiante1.id,
      claseId: clase3.id,
      calificacion: 85,
      descripcion: 'Buena comprensión lectora',
      periodo: 'Primer Periodo',
      profesorId: profesor3.id
    });

    // Calificaciones para Emily Johnson
    await Grade.create({
      estudianteId: estudiante2.id,
      claseId: clase1.id,
      calificacion: 95,
      descripcion: 'Excelente en matemáticas',
      periodo: 'Primer Periodo',
      profesorId: profesor1.id
    });

    await Grade.create({
      estudianteId: estudiante2.id,
      claseId: clase2.id,
      calificacion: 90,
      descripcion: 'Muy buena participación',
      periodo: 'Primer Periodo',
      profesorId: profesor2.id
    });

    await Grade.create({
      estudianteId: estudiante2.id,
      claseId: clase4.id,
      calificacion: 87,
      descripcion: 'Buen conocimiento de historia',
      periodo: 'Primer Periodo',
      profesorId: profesor1.id
    });

    // Calificaciones para Michael Brown
    await Grade.create({
      estudianteId: estudiante3.id,
      claseId: clase2.id,
      calificacion: 78,
      descripcion: 'Necesita mejorar en ciencias',
      periodo: 'Primer Periodo',
      profesorId: profesor2.id
    });

    await Grade.create({
      estudianteId: estudiante3.id,
      claseId: clase3.id,
      calificacion: 82,
      descripcion: 'Buena escritura creativa',
      periodo: 'Primer Periodo',
      profesorId: profesor3.id
    });

    await Grade.create({
      estudianteId: estudiante3.id,
      claseId: clase4.id,
      calificacion: 89,
      descripcion: 'Excelente en geografía',
      periodo: 'Primer Periodo',
      profesorId: profesor1.id
    });

    console.log('  ✓ Calificaciones creadas');

    console.log('\n✅ ¡Base de datos poblada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Administrador:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('\n👨‍🏫 Profesores:');
    console.log('   Usuario: mgarcia | Contraseña: profesor123');
    console.log('   Usuario: jperez | Contraseña: profesor123');
    console.log('   Usuario: arodriguez | Contraseña: profesor123');
    console.log('\n👨‍🎓 Estudiantes:');
    console.log('   Usuario: jsmith | Contraseña: estudiante123');
    console.log('   Usuario: ejohnson | Contraseña: estudiante123');
    console.log('   Usuario: mbrown | Contraseña: estudiante123');
    console.log('   Usuario: swilson | Contraseña: estudiante123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar base de datos:', error);
    process.exit(1);
  }
};

// Ejecutar seeder
seedDatabase();
