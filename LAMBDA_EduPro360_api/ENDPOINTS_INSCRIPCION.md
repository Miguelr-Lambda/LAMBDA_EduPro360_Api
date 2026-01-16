# 📚 Documentación de Endpoints de Inscripción de Estudiantes

## Nuevos Endpoints Implementados

### 1. Inscribir Estudiantes en Asignatura
Permite inscribir uno o varios estudiantes a una asignatura específica.

**Endpoint:** `POST /api/Academico/asignaturas/<id>/inscribir/`

**Permisos Requeridos:**
- `gestionar_asignaturas` o `crear_asignatura`
- Usuario autenticado

**Request Body:**
```json
{
  "estudiantes": [1, 2, 3, 4]
}
```

**Response (200 OK):**
```json
{
  "message": "Inscripción completada.",
  "asignatura": "Programación Web Avanzada",
  "total_estudiantes": 15,
  "inscritos_nuevos": ["Juan Pérez", "María García"],
  "ya_inscritos": ["Carlos López"]
}
```

**Funcionalidades:**
- ✅ Valida que todos los IDs sean de usuarios válidos
- ✅ Detecta estudiantes ya inscritos
- ✅ Envía notificación por email a cada estudiante inscrito
- ✅ Retorna resumen detallado de la operación

---

### 2. Desinscribir Estudiantes de Asignatura
Permite desinscribir uno o varios estudiantes de una asignatura específica.

**Endpoint:** `POST /api/Academico/asignaturas/<id>/desinscribir/`

**Permisos Requeridos:**
- `gestionar_asignaturas` o `crear_asignatura`
- Usuario autenticado

**Request Body:**
```json
{
  "estudiantes": [1, 2, 3]
}
```

**Response (200 OK):**
```json
{
  "message": "Desinscripción completada.",
  "asignatura": "Programación Web Avanzada",
  "total_estudiantes": 12,
  "desinscritos": ["Juan Pérez", "María García"],
  "no_inscritos": ["Pedro Ramírez"]
}
```

**Funcionalidades:**
- ✅ Valida que todos los IDs sean de usuarios válidos
- ✅ Detecta estudiantes que no estaban inscritos
- ✅ Envía notificación por email a cada estudiante desinscrito
- ✅ Retorna resumen detallado de la operación

---

### 3. Listar Estudiantes de Asignatura
Lista todos los estudiantes inscritos en una asignatura específica.

**Endpoint:** `GET /api/Academico/asignaturas/<id>/estudiantes/`

**Permisos Requeridos:**
- Usuario autenticado

**Response (200 OK):**
```json
{
  "asignatura": "Programación Web Avanzada",
  "codigo": "PWA-2024-01",
  "total_estudiantes": 15,
  "estudiantes": [
    {
      "id": 1,
      "username": "jperez",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "jperez@example.com"
    },
    {
      "id": 2,
      "username": "mgarcia",
      "first_name": "María",
      "last_name": "García",
      "email": "mgarcia@example.com"
    }
  ]
}
```

---

## 🎨 Admin de Django - Modelos Académicos

Se han registrado todos los modelos del módulo académico en el Admin de Django con funcionalidades avanzadas:

### AsignaturaAdmin
**Características:**
- ✅ Lista con badges de estado coloreados
- ✅ Contador de estudiantes y tareas
- ✅ Filtros por estado, periodo y docente
- ✅ Widget `filter_horizontal` para seleccionar múltiples estudiantes
- ✅ Inline para ver y crear tareas dentro de la asignatura
- ✅ Acciones: Activar/Desactivar asignaturas en lote

**Columnas mostradas:**
- Código, Nombre, Docente, Periodo, Total Estudiantes, Total Tareas, Estado, Fecha Creación

### TareaAdmin
**Características:**
- ✅ Muestra total de entregas vs estudiantes inscritos
- ✅ Calcula promedio de calificaciones
- ✅ Filtros por estado, tipo, asignatura y fecha
- ✅ Jerarquía de fechas por vencimiento
- ✅ Acciones: Activar/Desactivar tareas en lote

**Columnas mostradas:**
- Título, Asignatura, Tipo, Fecha Publicación, Fecha Vencimiento, Peso %, Entregas, Promedio, Estado

### EntregaAdmin
**Características:**
- ✅ Notas con código de colores (verde ≥3.0, amarillo ≥2.0, rojo <2.0)
- ✅ Badge de estado de calificación
- ✅ Filtros por estado de calificación, entrega, asignatura y fecha
- ✅ Acciones: Marcar como calificadas (solo entregas con nota)

**Columnas mostradas:**
- Estudiante, Tarea, Asignatura, Fecha Entrega, Nota, Estado Calificación, Estado Entrega

### RecordatorioTareaAdmin
**Características:**
- ✅ Badge de estado de envío (Enviado/Pendiente)
- ✅ Filtros por envío, tipo y asignatura
- ✅ Jerarquía de fechas programadas
- ✅ Solo lectura para fechas de envío

### ReporteMensualAdmin
**Características:**
- ✅ Muestra periodo y fecha de generación
- ✅ Contador de asignaturas en el reporte
- ✅ Link para ver datos JSON
- ✅ No permite crear/editar manualmente (solo Celery)

---

## 📧 Notificaciones por Email

### Email de Inscripción
**Se envía a:** Estudiante inscrito
**Asunto:** Inscripción en asignatura
**Contenido:**
```
Hola [Nombre],

Has sido inscrito en la asignatura [Nombre Asignatura] ([Código]).
Docente responsable: [Nombre Docente].
```

### Email de Desinscripción
**Se envía a:** Estudiante desinscrito
**Asunto:** Desinscripción de asignatura
**Contenido:**
```
Hola [Nombre],

Has sido desinscrito de la asignatura [Nombre Asignatura] ([Código]).
```

---

## 🔒 Control de Permisos

### Permisos para Inscripción/Desinscripción:
- **Rol Administrador:** Acceso completo
- **Rol Coordinador:** Con permiso `gestionar_asignaturas`
- **Rol Docente:** Con permiso `crear_asignatura`

### Permisos para Listar Estudiantes:
- Cualquier usuario autenticado puede ver la lista de estudiantes de una asignatura

---

## 📝 Ejemplo de Uso desde Frontend

### Ejemplo con Fetch API:

```javascript
// Inscribir estudiantes
async function inscribirEstudiantes(asignaturaId, estudiantesIds) {
  const response = await fetch(
    `http://localhost:8000/api/Academico/asignaturas/${asignaturaId}/inscribir/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estudiantes: estudiantesIds })
    }
  );

  return await response.json();
}

// Listar estudiantes
async function listarEstudiantes(asignaturaId) {
  const response = await fetch(
    `http://localhost:8000/api/Academico/asignaturas/${asignaturaId}/estudiantes/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}
```

---

## ✅ Validaciones Implementadas

1. **Validación de IDs:** Todos los IDs deben corresponder a usuarios existentes
2. **Validación de Permisos:** Solo usuarios con permisos adecuados pueden inscribir/desinscribir
3. **Duplicados:** Detecta automáticamente estudiantes ya inscritos
4. **Lista Vacía:** No permite inscribir una lista vacía
5. **Asignatura No Existente:** Retorna 404 si la asignatura no existe

---

## 🚀 Próximos Pasos

- [ ] Implementar frontend para gestionar inscripciones
- [ ] Agregar opción de inscripción masiva desde CSV
- [ ] Implementar sistema de pre-requisitos por asignatura
- [ ] Agregar límite máximo de estudiantes por asignatura
- [ ] Implementar notificaciones en tiempo real (WebSockets)
