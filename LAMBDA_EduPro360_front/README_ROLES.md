# Sistema de Login Basado en Roles - EduPro360

## Descripción

Sistema de autenticación con vistas específicas según el rol del usuario (Administrador, Profesor, Estudiante).

## Flujo de la Aplicación

### 1. Página de Inicio (`HomePage`)
- Landing page con información de EduPro360
- Botón "Iniciar Sesión" que redirige al login

### 2. Página de Login (`LoginPage`)
- Formulario simple con:
  - Campo: **Usuario**
  - Campo: **Contraseña**
  - Botón: **Log In**

### 3. Redirección Automática por Rol

Después del login exitoso, el sistema redirige automáticamente a:

#### **Administrador** → `/dashboard/administrador`
- **Panel de Manage Users**
  - Registrar Profesor
  - Registrar Estudiante
  - Formularios con campos específicos

- **Panel de Manage Classes**
  - Crear Clase
  - Asignar profesores
  - Configurar horarios

#### **Profesor** → `/dashboard/profesor`
- **Panel de Calificación de Estudiantes**
  - Selector de clase
  - Tabla con estudiantes
  - Campos de calificación (0-100)
  - Campo de descripción por estudiante

#### **Estudiante** → `/dashboard/estudiante`
- **Panel de Mis Calificaciones**
  - Tabla de calificaciones por clase
  - Promedio general calculado
  - Botón "Generar Reporte"

## Cómo Ejecutar

### Requisitos Previos

1. **Backend Node.js** corriendo en `http://localhost:5000`
```bash
cd /ruta/al/proyecto
npm install
npm run dev
```

2. **MongoDB** corriendo localmente o en servidor

3. **Datos de prueba** cargados:
```bash
npm run seed
```

### Ejecutar el Frontend

```bash
cd LAMBDA_EduPro360_front
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Credenciales de Prueba

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`

### Profesores
- **Usuario:** `mgarcia` | **Contraseña:** `profesor123`
- **Usuario:** `jperez` | **Contraseña:** `profesor123`
- **Usuario:** `arodriguez` | **Contraseña:** `profesor123`

### Estudiantes
- **Usuario:** `jsmith` | **Contraseña:** `estudiante123`
- **Usuario:** `ejohnson` | **Contraseña:** `estudiante123`
- **Usuario:** `mbrown` | **Contraseña:** `estudiante123`
- **Usuario:** `swilson` | **Contraseña:** `estudiante123`

## Estructura de Archivos

```
LAMBDA_EduPro360_front/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx                    # Landing page
│   │   ├── LoginPage.jsx                   # Formulario de login
│   │   ├── AdministradorDashboard.jsx      # Vista admin
│   │   ├── ProfesorDashboard.jsx           # Vista profesor
│   │   └── EstudianteDashboard.jsx         # Vista estudiante
│   ├── context/
│   │   └── AuthContext.jsx                 # Manejo de autenticación
│   ├── styles/
│   │   └── roles.css                       # Estilos de las vistas
│   ├── App.jsx                             # Rutas y navegación
│   └── main.jsx                            # Punto de entrada
```

## Características

### Autenticación
- JWT almacenado en localStorage
- Protección de rutas por rol
- Redirección automática según rol
- Cierre de sesión en todos los dashboards

### Seguridad
- Rutas protegidas con `PrivateRoute`
- Validación de rol antes de mostrar contenido
- Redirección a login si no está autenticado
- Token JWT para todas las peticiones

### Diseño
- UI moderna y limpia
- Responsive design
- Colores y estilos según mockups
- Formularios intuitivos

## API Endpoints Utilizados

### Autenticación
```
POST http://localhost:5000/api/auth/login
Body: { "usuario": "string", "contraseña": "string" }
Response: {
  "success": true,
  "token": "jwt_token",
  "user": {
    "_id": "string",
    "nombreCompleto": "string",
    "email": "string",
    "usuario": "string",
    "rol": "administrador|profesor|estudiante",
    ...campos específicos del rol
  }
}
```

## Flujo de Navegación

```
[HomePage]
    ↓
[Login Page]
    ↓
[Autenticación exitosa]
    ↓
    ├─→ rol = "administrador" → [AdministradorDashboard]
    ├─→ rol = "profesor"      → [ProfesorDashboard]
    └─→ rol = "estudiante"    → [EstudianteDashboard]
```

## Próximas Funcionalidades

- [ ] Conectar formularios de Admin a la API
- [ ] Implementar actualización de calificaciones en tiempo real
- [ ] Agregar filtros de período en calificaciones
- [ ] Implementar generación de reportes en PDF
- [ ] Agregar notificaciones de nuevas calificaciones
- [ ] Implementar chat entre profesores y estudiantes

## Notas Importantes

1. El frontend **NO** usa la API Django, solo la API Node.js
2. La conexión se hace directamente a `http://localhost:5000/api`
3. Todos los formularios están listos para conectar a los endpoints
4. El diseño sigue fielmente los mockups proporcionados
5. Los datos actuales son de demostración (no se guardan en backend aún)

## Troubleshooting

### Error: "Cannot connect to server"
- Verifica que el backend Node.js esté corriendo en puerto 5000
- Verifica que MongoDB esté corriendo

### Error: "Invalid credentials"
- Usa las credenciales de prueba exactamente como se muestran
- Ejecuta `npm run seed` para cargar los datos de prueba

### La página se queda en blanco
- Abre la consola del navegador (F12)
- Verifica que no haya errores de CORS
- Verifica que las rutas en App.jsx estén correctas
