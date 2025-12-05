const API_URL = 'http://localhost:5000/api';

// Helper para hacer peticiones autenticadas
const apiRequest = async (endpoint, options = {}) => {
  const tokens = JSON.parse(localStorage.getItem('edupro360_tokens') || '{}');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (tokens.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición');
  }

  return data;
};

// ===== USUARIOS =====
export const usuariosAPI = {
  registrarProfesor: async (data) => {
    return apiRequest('/users/profesor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  registrarEstudiante: async (data) => {
    return apiRequest('/users/estudiante', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  obtenerProfesores: async () => {
    return apiRequest('/users/profesores');
  },

  obtenerEstudiantes: async () => {
    return apiRequest('/users/estudiantes');
  },
};

// ===== CLASES =====
export const clasesAPI = {
  crear: async (data) => {
    return apiRequest('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  obtenerTodas: async () => {
    return apiRequest('/classes');
  },

  obtenerPorProfesor: async (profesorId) => {
    return apiRequest(`/classes/profesor/${profesorId}`);
  },

  obtenerPorId: async (claseId) => {
    return apiRequest(`/classes/${claseId}`);
  },

  agregarEstudiante: async (claseId, estudianteId) => {
    return apiRequest(`/classes/${claseId}/estudiantes`, {
      method: 'POST',
      body: JSON.stringify({ estudianteId }),
    });
  },
};

// ===== CALIFICACIONES =====
export const calificacionesAPI = {
  crear: async (data) => {
    return apiRequest('/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  obtenerPorClase: async (claseId) => {
    return apiRequest(`/grades/clase/${claseId}`);
  },

  obtenerMisCalificaciones: async () => {
    return apiRequest('/grades/mis-calificaciones');
  },

  generarReporte: async (estudianteId) => {
    return apiRequest(`/grades/reporte/${estudianteId}`);
  },
};

// ===== TAREAS =====
export const tareasAPI = {
  crear: async (data) => {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  obtenerPorClase: async (claseId) => {
    return apiRequest(`/tasks/clase/${claseId}`);
  },

  obtenerMisTareas: async () => {
    return apiRequest('/tasks/mis-tareas');
  },

  actualizar: async (tareaId, data) => {
    return apiRequest(`/tasks/${tareaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  eliminar: async (tareaId) => {
    return apiRequest(`/tasks/${tareaId}`, {
      method: 'DELETE',
    });
  },
};

// ===== ENTREGAS =====
export const entregasAPI = {
  crear: async (data) => {
    return apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  obtenerPorTarea: async (tareaId) => {
    return apiRequest(`/submissions/tarea/${tareaId}`);
  },

  obtenerMisEntregas: async () => {
    return apiRequest('/submissions/mis-entregas');
  },

  calificar: async (entregaId, data) => {
    return apiRequest(`/submissions/${entregaId}/calificar`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ===== NOTIFICACIONES =====
export const notificacionesAPI = {
  obtenerMisNotificaciones: async (leidas) => {
    const query = leidas !== undefined ? `?leidas=${leidas}` : '';
    return apiRequest(`/notifications${query}`);
  },

  obtenerNoLeidas: async () => {
    return apiRequest('/notifications/no-leidas');
  },

  obtenerConteo: async () => {
    return apiRequest('/notifications/conteo');
  },

  marcarComoLeida: async (notificacionId) => {
    return apiRequest(`/notifications/${notificacionId}/leer`, {
      method: 'PUT',
    });
  },

  marcarTodasComoLeidas: async () => {
    return apiRequest('/notifications/leer-todas', {
      method: 'PUT',
    });
  },

  eliminar: async (notificacionId) => {
    return apiRequest(`/notifications/${notificacionId}`, {
      method: 'DELETE',
    });
  },

  crear: async (data) => {
    return apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
