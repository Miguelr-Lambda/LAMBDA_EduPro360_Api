const { Sequelize } = require('sequelize');
require('dotenv').config();

async function createDatabase() {
  // Conectar a la base de datos postgres por defecto
  const sequelize = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar si la base de datos existe
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
    );

    if (results.length === 0) {
      // Crear la base de datos
      await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Base de datos '${process.env.DB_NAME}' creada exitosamente`);
    } else {
      console.log(`✅ Base de datos '${process.env.DB_NAME}' ya existe`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createDatabase();
