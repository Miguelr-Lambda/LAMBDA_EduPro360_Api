// Servicio centralizado para las llamadas al backend
const API_BASE_URL = 'http://localhost:8000/api';

// Helper para obtener el token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

// Helper para hacer peticiones con autenticación
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error en la solicitud' }));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  return response.json();
};

// ========================================
// USUARIOS
// ========================================

export const usuariosAPI = {
  // Listar todos los usuarios
  listar: (page = 1) => fetchWithAuth(`/Usuarios/?page=${page}`),

  // Obtener un usuario específico
  obtener: (id) => fetchWithAuth(`/Usuarios/${id}/`),

  // Crear usuario
  crear: (data) => fetchWithAuth('/Usuarios/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Actualizar usuario
  actualizar: (id, data) => fetchWithAuth(`/Usuarios/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Actualización parcial
  actualizarParcial: (id, data) => fetchWithAuth(`/Usuarios/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Eliminar usuario
  eliminar: (id) => fetchWithAuth(`/Usuarios/${id}/`, {
    method: 'DELETE',
  }),

  // Activar usuario
  activar: (id) => fetchWithAuth(`/Usuarios/${id}/activar/`, {
    method: 'POST',
  }),

  // Desactivar usuario
  desactivar: (id) => fetchWithAuth(`/Usuarios/${id}/desactivar/`, {
    method: 'POST',
  }),

  // Cambiar contraseña
  cambiarContrasena: (id, data) => fetchWithAuth(`/Usuarios/${id}/cambiar-contrasena/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Enviar email de bienvenida
  enviarBienvenida: (id) => fetchWithAuth(`/Usuarios/${id}/enviar-bienvenida/`, {
    method: 'POST',
  }),

  // Obtener estadísticas de usuarios
  estadisticas: async () => {
    const data = await fetchWithAuth('/Usuarios/');
    const usuarios = data.results || data;

    const total = usuarios.length;
    const docentes = usuarios.filter(u => u.rol?.nombre === 'Docente').length;
    const estudiantes = usuarios.filter(u => u.rol?.nombre === 'Estudiante').length;
    const activos = usuarios.filter(u => u.activo).length;

    return { total, docentes, estudiantes, activos };
  },
};

// ========================================
// ROLES
// ========================================

export const rolesAPI = {
  // Listar roles
  listar: () => fetchWithAuth('/roles/'),

  // Obtener rol
  obtener: (id) => fetchWithAuth(`/roles/${id}/`),

  // Crear rol
  crear: (data) => fetchWithAuth('/roles/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Actualizar rol
  actualizar: (id, data) => fetchWithAuth(`/roles/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Eliminar rol
  eliminar: (id) => fetchWithAuth(`/roles/${id}/`, {
    method: 'DELETE',
  }),
};

// ========================================
// ASIGNATURAS
// ========================================

export const asignaturasAPI = {
  // Listar asignaturas
  listar: () => fetchWithAuth('/Academico/asignaturas/'),

  // Obtener asignatura
  obtener: (id) => fetchWithAuth(`/Academico/asignaturas/${id}/`),

  // Crear asignatura
  crear: (data) => fetchWithAuth('/Academico/asignaturas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Actualizar asignatura
  actualizar: (id, data) => fetchWithAuth(`/Academico/asignaturas/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Actualización parcial
  actualizarParcial: (id, data) => fetchWithAuth(`/Academico/asignaturas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Eliminar asignatura
  eliminar: (id) => fetchWithAuth(`/Academico/asignaturas/${id}/`, {
    method: 'DELETE',
  }),

  // Inscribir estudiantes
  inscribirEstudiantes: (id, estudiantesIds) => fetchWithAuth(`/Academico/asignaturas/${id}/inscribir/`, {
    method: 'POST',
    body: JSON.stringify({ estudiantes: estudiantesIds }),
  }),

  // Desinscribir estudiantes
  desinscribirEstudiantes: (id, estudiantesIds) => fetchWithAuth(`/Academico/asignaturas/${id}/desinscribir/`, {
    method: 'POST',
    body: JSON.stringify({ estudiantes: estudiantesIds }),
  }),

  // Listar estudiantes de asignatura
  listarEstudiantes: (id) => fetchWithAuth(`/Academico/asignaturas/${id}/estudiantes/`),
};

// ========================================
// TAREAS
// ========================================

export const tareasAPI = {
  // Listar tareas (opcional filtrar por asignatura)
  listar: (asignaturaId = null) => {
    const url = asignaturaId
      ? `/Academico/tareas/?asignatura=${asignaturaId}`
      : '/Academico/tareas/';
    return fetchWithAuth(url);
  },

  // Obtener tarea
  obtener: (id) => fetchWithAuth(`/Academico/tareas/${id}/`),

  // Crear tarea
  crear: (data) => fetchWithAuth('/Academico/tareas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Actualizar tarea
  actualizar: (id, data) => fetchWithAuth(`/Academico/tareas/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Actualización parcial
  actualizarParcial: (id, data) => fetchWithAuth(`/Academico/tareas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Eliminar tarea
  eliminar: (id) => fetchWithAuth(`/Academico/tareas/${id}/`, {
    method: 'DELETE',
  }),
};

// ========================================
// ENTREGAS
// ========================================

export const entregasAPI = {
  // Listar entregas (opcional filtrar por tarea)
  listar: (tareaId = null) => {
    const url = tareaId
      ? `/Academico/entregas/?tarea=${tareaId}`
      : '/Academico/entregas/';
    return fetchWithAuth(url);
  },

  // Obtener entrega
  obtener: (id) => fetchWithAuth(`/Academico/entregas/${id}/`),

  // Crear entrega
  crear: (data) => fetchWithAuth('/Academico/entregas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Eliminar entrega
  eliminar: (id) => fetchWithAuth(`/Academico/entregas/${id}/`, {
    method: 'DELETE',
  }),

  // Calificar entrega
  calificar: (id, nota, retroalimentacion = '') => fetchWithAuth(`/Academico/entregas/${id}/calificar/`, {
    method: 'POST',
    body: JSON.stringify({
      nota,
      retroalimentacion_docente: retroalimentacion
    }),
  }),
};

// ========================================
// NOTAS
// ========================================

export const notasAPI = {
  // Obtener notas de estudiante
  obtener: (asignaturaId = null, periodo = null) => {
    let url = '/Academico/notas/?';
    if (asignaturaId) url += `asignatura=${asignaturaId}&`;
    if (periodo) url += `periodo=${periodo}`;
    return fetchWithAuth(url);
  },
};

// ========================================
// REPORTES
// ========================================

export const reportesAPI = {
  // Generar reporte mensual
  generarMensual: (periodo = null) => fetchWithAuth('/Academico/reportes/mensual/', {
    method: 'POST',
    body: JSON.stringify({ periodo }),
  }),

  // Ejecutar recordatorios
  ejecutarRecordatorios: () => fetchWithAuth('/Academico/recordatorios/ejecutar/', {
    method: 'POST',
  }),
};

export default {
  usuarios: usuariosAPI,
  roles: rolesAPI,
  asignaturas: asignaturasAPI,
  tareas: tareasAPI,
  entregas: entregasAPI,
  notas: notasAPI,
  reportes: reportesAPI,
};
