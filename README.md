# EduPro360 API - Plataforma Educativa Integral

API REST para la plataforma educativa EduPro360 que permite la gestión académica, calificaciones y comunicación eficiente entre administradores, profesores y estudiantes.

## Características

- **Sistema de autenticación basado en roles** (Administrador, Profesor, Estudiante)
- **Login con respuesta personalizada** según el rol del usuario
- **Gestión de usuarios** (profesores y estudiantes)
- **Gestión de clases** y asignación de profesores
- **Sistema de calificaciones** con períodos académicos
- **Generación de reportes** para estudiantes
- **Protección de rutas** mediante JWT
- **Validación de datos** y seguridad

## Tecnologías

- Node.js
- Express.js
- PostgreSQL + Sequelize
- JWT (JSON Web Tokens)
- Bcrypt para encriptación de contraseñas
- Express Validator

## Instalación

### Prerrequisitos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)

### Pasos de instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd LAMBDA_EduPro360_Api
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro360
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

4. Poblar la base de datos con datos de prueba:
```bash
npm run seed
```

5. Iniciar el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Datos de Prueba

Después de ejecutar `npm run seed`, tendrás acceso a las siguientes cuentas:

### Administrador
- Usuario: `admin`
- Contraseña: `admin123`

### Profesores
- Usuario: `mgarcia` | Contraseña: `profesor123`
- Usuario: `jperez` | Contraseña: `profesor123`
- Usuario: `arodriguez` | Contraseña: `profesor123`

### Estudiantes
- Usuario: `jsmith` | Contraseña: `estudiante123`
- Usuario: `ejohnson` | Contraseña: `estudiante123`
- Usuario: `mbrown` | Contraseña: `estudiante123`
- Usuario: `swilson` | Contraseña: `estudiante123`

## Documentación de la API

### Base URL
```
http://localhost:5000/api
```

### Autenticación

Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 🔐 Autenticación

#### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "usuario": "admin",
  "contraseña": "admin123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "nombreCompleto": "Carlos Administrador",
    "email": "admin@edupro360.com",
    "usuario": "admin",
    "rol": "administrador"
  }
}
```

#### Obtener perfil
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

### 👥 Gestión de Usuarios (Solo Administrador)

#### Registrar Profesor
```http
POST /api/users/profesor
Authorization: Bearer <token>
```

**Body:**
```json
{
  "nombreCompleto": "Juan Docente",
  "email": "juan@edupro360.com",
  "usuario": "jdocente",
  "contraseña": "password123",
  "documentoIdentidad": "PROF004",
  "clasesAsignadas": []
}
```

#### Registrar Estudiante
```http
POST /api/users/estudiante
Authorization: Bearer <token>
```

**Body:**
```json
{
  "nombreCompleto": "Pedro Alumno",
  "email": "pedro@estudiante.com",
  "usuario": "palumno",
  "contraseña": "password123",
  "documentoIdentidad": "EST006",
  "grado": "Tercer Grado",
  "contactoEmergencia": "555-1234",
  "observacionesMedicas": "Ninguna"
}
```

#### Obtener todos los profesores
```http
GET /api/users/profesores
Authorization: Bearer <token>
```

#### Obtener todos los estudiantes
```http
GET /api/users/estudiantes
Authorization: Bearer <token>
```

#### Obtener usuario por ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Actualizar usuario
```http
PUT /api/users/:id
Authorization: Bearer <token>
```

#### Eliminar usuario (desactivar)
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

### 📚 Gestión de Clases

#### Crear clase (Solo Administrador)
```http
POST /api/classes
Authorization: Bearer <token>
```

**Body:**
```json
{
  "nombreClase": "Física",
  "profesor": "profesor_id",
  "descripcion": "Curso de física básica",
  "horario": {
    "dia": "Lunes",
    "hora": "10:00 AM"
  }
}
```

#### Obtener todas las clases
```http
GET /api/classes
Authorization: Bearer <token>
```

#### Obtener clases de un profesor
```http
GET /api/classes/profesor/:profesorId
Authorization: Bearer <token>
```

#### Obtener clase por ID
```http
GET /api/classes/:id
Authorization: Bearer <token>
```

#### Actualizar clase
```http
PUT /api/classes/:id
Authorization: Bearer <token>
```

#### Agregar estudiante a clase
```http
POST /api/classes/:id/estudiantes
Authorization: Bearer <token>
```

**Body:**
```json
{
  "estudianteId": "estudiante_id"
}
```

#### Remover estudiante de clase
```http
DELETE /api/classes/:id/estudiantes/:estudianteId
Authorization: Bearer <token>
```

---

### 📝 Gestión de Calificaciones

#### Crear/Actualizar calificación (Profesor)
```http
POST /api/grades
Authorization: Bearer <token>
```

**Body:**
```json
{
  "estudiante": "estudiante_id",
  "clase": "clase_id",
  "calificacion": 95,
  "descripcion": "Excelente desempeño",
  "periodo": "Primer Periodo"
}
```

#### Obtener calificaciones de una clase
```http
GET /api/grades/clase/:claseId
Authorization: Bearer <token>
```

#### Obtener calificaciones de un estudiante
```http
GET /api/grades/estudiante/:estudianteId
Authorization: Bearer <token>
```

#### Obtener mis calificaciones (Estudiante)
```http
GET /api/grades/mis-calificaciones
Authorization: Bearer <token>
```

#### Generar reporte de calificaciones
```http
GET /api/grades/reporte/:estudianteId
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "reporte": {
    "estudiante": {
      "nombreCompleto": "John Smith",
      "grado": "Tercer Grado",
      "email": "john.smith@estudiante.com"
    },
    "calificaciones": [
      {
        "clase": "Matemáticas",
        "calificacion": 88,
        "descripcion": "Buen desempeño",
        "periodo": "Primer Periodo",
        "profesor": "María García"
      }
    ],
    "promedio": "88.75",
    "totalClases": 4,
    "fechaGeneracion": "2024-12-04T..."
  }
}
```

#### Actualizar calificación
```http
PUT /api/grades/:id
Authorization: Bearer <token>
```

#### Eliminar calificación
```http
DELETE /api/grades/:id
Authorization: Bearer <token>
```

---

## Roles y Permisos

### 🔑 Administrador
- ✅ Registrar profesores y estudiantes
- ✅ Gestionar usuarios (ver, actualizar, eliminar)
- ✅ Crear y gestionar clases
- ✅ Asignar profesores a clases
- ✅ Agregar estudiantes a clases
- ✅ Ver todas las calificaciones

### 👨‍🏫 Profesor
- ✅ Ver sus clases asignadas
- ✅ Ver estudiantes de sus clases
- ✅ Crear y actualizar calificaciones de sus estudiantes
- ✅ Ver calificaciones de sus clases
- ✅ Generar reportes de estudiantes

### 👨‍🎓 Estudiante
- ✅ Ver sus calificaciones
- ✅ Generar su reporte de calificaciones
- ✅ Ver información de sus clases

---

## Estructura del Proyecto

```
LAMBDA_EduPro360_Api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── class.controller.js
│   │   └── grade.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Class.model.js
│   │   └── Grade.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── class.routes.js
│   │   └── grade.routes.js
│   ├── seeders/
│   │   └── seed.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Flujo de Autenticación por Roles

1. **Usuario hace login** → POST `/api/auth/login`
2. **API valida credenciales** y devuelve:
   - Token JWT
   - Información del usuario con campos específicos según su rol
3. **Frontend usa el rol** para mostrar la interfaz correspondiente:
   - **Administrador**: Panel de gestión de usuarios y clases
   - **Profesor**: Panel de calificación de estudiantes
   - **Estudiante**: Panel de visualización de calificaciones

## Ejemplo de Uso

### Login como Estudiante

```javascript
// Request
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    usuario: 'jsmith',
    contraseña: 'estudiante123'
  })
})
.then(res => res.json())
.then(data => {
  // Guardar token
  localStorage.setItem('token', data.token);

  // Redirigir según rol
  if (data.user.rol === 'estudiante') {
    // Mostrar vista de estudiante
    window.location.href = '/estudiante/dashboard';
  }
});
```

### Obtener Calificaciones del Estudiante

```javascript
fetch('http://localhost:5000/api/grades/mis-calificaciones', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.calificaciones);
});
```

## Licencia

MIT