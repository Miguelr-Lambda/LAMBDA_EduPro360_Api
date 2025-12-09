import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clasesAPI, calificacionesAPI, tareasAPI, entregasAPI, notificacionesAPI } from "../services/api";
import NotificationsPanel from "../components/NotificationsPanel";

export default function ProfesorDashboard() {
  const { user, logout } = useAuth();

  // Estados principales
  const [activeTab, setActiveTab] = useState("overview");
  const [clases, setClases] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados de notificaciones
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Estados de estadísticas
  const [stats, setStats] = useState({
    totalClases: 0,
    totalEstudiantes: 0,
    totalTareas: 0,
    tareasActivas: 0
  });

  // Estados de calificaciones
  const [students, setStudents] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});

  // Estados de tareas
  const [tareas, setTareas] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    titulo: '',
    descripcion: '',
    fecha_vencimiento: '',
    peso_porcentual: 0,
    tipo_tarea: 'tarea'
  });
  const [editingTask, setEditingTask] = useState(null);

  // Estados de entregas
  const [entregas, setEntregas] = useState([]);
  const [selectedTaskForSubmissions, setSelectedTaskForSubmissions] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    if (user && user._id) {
      cargarClasesProfesor();
    }
  }, [user]);

  // Actualizar stats cuando cambien los datos
  useEffect(() => {
    calcularEstadisticas();
  }, [clases, students, tareas]);

  // Cargar datos según la clase seleccionada
  useEffect(() => {
    if (selectedClass) {
      cargarEstudiantesYCalificaciones();
      cargarTareas();
    }
  }, [selectedClass]);

  // Cargar conteo de notificaciones
  useEffect(() => {
    cargarConteoNotificaciones();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarConteoNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarConteoNotificaciones = async () => {
    try {
      const response = await notificacionesAPI.obtenerConteo();
      if (response.success) {
        setNotificationCount(response.count);
      }
    } catch (error) {
      console.error('Error al cargar conteo de notificaciones:', error);
    }
  };

  const cargarClasesProfesor = async () => {
    try {
      const response = await clasesAPI.obtenerPorProfesor(user._id);
      if (response.success) {
        setClases(response.clases);
        if (response.clases.length > 0) {
          setSelectedClass(response.clases[0]._id);
        }
      }
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setMessage({ type: 'error', text: 'Error al cargar clases' });
    }
  };

  const cargarEstudiantesYCalificaciones = async () => {
    try {
      setLoading(true);
      const claseResponse = await clasesAPI.obtenerPorId(selectedClass);

      if (claseResponse.success) {
        setStudents(claseResponse.clase.estudiantes || []);

        const gradesResponse = await calificacionesAPI.obtenerPorClase(selectedClass);

        if (gradesResponse.success) {
          const gradesMap = {};
          gradesResponse.calificaciones.forEach(grade => {
            gradesMap[grade.estudiante._id] = {
              calificacion: grade.calificacion,
              descripcion: grade.descripcion || '',
              gradeId: grade._id
            };
          });
          setCalificaciones(gradesMap);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar estudiantes' });
    } finally {
      setLoading(false);
    }
  };

  const cargarTareas = async () => {
    try {
      const response = await tareasAPI.obtenerPorClase(selectedClass);
      if (response.success) {
        setTareas(response.tareas);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  };

  const cargarEntregas = async (tareaId) => {
    try {
      const response = await entregasAPI.obtenerPorTarea(tareaId);
      if (response.success) {
        setEntregas(response.entregas);
      }
    } catch (error) {
      console.error('Error al cargar entregas:', error);
    }
  };

  const calcularEstadisticas = () => {
    const totalEstudiantes = students.length;
    const totalTareas = tareas.length;
    const now = new Date();
    const tareasActivas = tareas.filter(t => new Date(t.fecha_vencimiento) > now).length;

    setStats({
      totalClases: clases.length,
      totalEstudiantes,
      totalTareas,
      tareasActivas
    });
  };

  // Funciones de calificaciones
  const handleCalificacionChange = (estudianteId, value) => {
    setCalificaciones({
      ...calificaciones,
      [estudianteId]: {
        ...calificaciones[estudianteId],
        calificacion: parseFloat(value) || 0
      }
    });
  };

  const handleDescripcionChange = (estudianteId, value) => {
    setCalificaciones({
      ...calificaciones,
      [estudianteId]: {
        ...calificaciones[estudianteId],
        descripcion: value
      }
    });
  };

  const handleGuardarCalificacion = async (estudianteId) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const calificacionData = calificaciones[estudianteId];

      if (!calificacionData || calificacionData.calificacion === undefined) {
        setMessage({ type: 'error', text: 'Por favor ingrese una calificación' });
        return;
      }

      const response = await calificacionesAPI.crear({
        estudiante: estudianteId,
        clase: selectedClass,
        calificacion: calificacionData.calificacion,
        descripcion: calificacionData.descripcion || '',
        periodo: 'Q1'
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Calificación guardada exitosamente' });
        await cargarEstudiantesYCalificaciones();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar calificación' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarTodas = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      let errores = 0;
      let guardadas = 0;

      for (const estudiante of students) {
        const calificacionData = calificaciones[estudiante._id];

        if (calificacionData && calificacionData.calificacion !== undefined) {
          try {
            await calificacionesAPI.crear({
              estudiante: estudiante._id,
              clase: selectedClass,
              calificacion: calificacionData.calificacion,
              descripcion: calificacionData.descripcion || '',
              periodo: 'Q1'
            });
            guardadas++;
          } catch (error) {
            errores++;
            console.error(`Error guardando calificación para ${estudiante.nombreCompleto}:`, error);
          }
        }
      }

      if (guardadas > 0) {
        setMessage({
          type: errores > 0 ? 'error' : 'success',
          text: `${guardadas} calificaciones guardadas${errores > 0 ? `, ${errores} errores` : ''}`
        });
        await cargarEstudiantesYCalificaciones();
      } else {
        setMessage({ type: 'error', text: 'No hay calificaciones para guardar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar calificaciones' });
    } finally {
      setLoading(false);
    }
  };

  // Funciones de tareas
  const handleTaskFormChange = (field, value) => {
    setTaskForm({ ...taskForm, [field]: value });
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      if (!taskForm.titulo || !taskForm.fecha_vencimiento) {
        setMessage({ type: 'error', text: 'Título y fecha de vencimiento son requeridos' });
        return;
      }

      const taskData = {
        ...taskForm,
        clase: selectedClass,
        peso_porcentual: parseFloat(taskForm.peso_porcentual) || 0
      };

      if (editingTask) {
        const response = await tareasAPI.actualizar(editingTask._id, taskData);
        if (response.success) {
          setMessage({ type: 'success', text: 'Tarea actualizada exitosamente' });
        }
      } else {
        const response = await tareasAPI.crear(taskData);
        if (response.success) {
          setMessage({ type: 'success', text: 'Tarea creada exitosamente' });
        }
      }

      setShowTaskForm(false);
      setEditingTask(null);
      setTaskForm({
        titulo: '',
        descripcion: '',
        fecha_vencimiento: '',
        peso_porcentual: 0,
        tipo_tarea: 'tarea'
      });
      await cargarTareas();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar tarea' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditarTarea = (tarea) => {
    setEditingTask(tarea);
    setTaskForm({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fecha_vencimiento: tarea.fecha_vencimiento.split('T')[0],
      peso_porcentual: tarea.peso_porcentual,
      tipo_tarea: tarea.tipo_tarea
    });
    setShowTaskForm(true);
  };

  const handleEliminarTarea = async (tareaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta tarea?')) return;

    try {
      setLoading(true);
      const response = await tareasAPI.eliminar(tareaId);
      if (response.success) {
        setMessage({ type: 'success', text: 'Tarea eliminada exitosamente' });
        await cargarTareas();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar tarea' });
    } finally {
      setLoading(false);
    }
  };

  const handleCalificarEntrega = async (entregaId, calificacion, retroalimentacion) => {
    try {
      setLoading(true);
      const response = await entregasAPI.calificar(entregaId, {
        calificacion: parseFloat(calificacion),
        retroalimentacion
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Entrega calificada exitosamente' });
        await cargarEntregas(selectedTaskForSubmissions);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al calificar entrega' });
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (tarea) => {
    const now = new Date();
    const vencimiento = new Date(tarea.fecha_vencimiento);

    if (vencimiento < now) return 'overdue';
    return 'active';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="logo">🎓</span>
          <h1>EduPro360 <span className="role-badge">Profesor</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 600 }}>👨‍🏫 {user?.nombreCompleto}</span>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn-notifications"
          >
            🔔 Notificaciones
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>
          <button onClick={logout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Panel de notificaciones */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          cargarConteoNotificaciones();
        }}
      />

      <main className="dashboard-content">
        {/* Mensajes de feedback */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Selector de clase */}
        <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
          <div className="class-selector">
            <label htmlFor="clase">📚 Clase Activa:</label>
            <select
              id="clase"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="class-dropdown"
              disabled={loading || clases.length === 0}
            >
              {clases.length === 0 ? (
                <option value="">No hay clases asignadas</option>
              ) : (
                clases.map((clase) => (
                  <option key={clase._id} value={clase._id}>
                    {clase.nombreClase}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="tabs-container">
          <div className="tabs-nav">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Resumen
            </button>
            <button
              className={`tab-button ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              📝 Calificaciones
            </button>
            <button
              className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              📋 Tareas
            </button>
            <button
              className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              📥 Entregas
            </button>
          </div>

          {/* Contenido de Overview */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <h2 className="dashboard-title">📊 Resumen General</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Clases Asignadas</span>
                    <span className="stat-icon">🏫</span>
                  </div>
                  <div className="stat-value">{stats.totalClases}</div>
                  <p className="stat-label">Total de clases</p>
                </div>

                <div className="stat-card gold">
                  <div className="stat-header">
                    <span className="stat-title">Estudiantes</span>
                    <span className="stat-icon">👨‍🎓</span>
                  </div>
                  <div className="stat-value">{stats.totalEstudiantes}</div>
                  <p className="stat-label">En clase actual</p>
                </div>

                <div className="stat-card green">
                  <div className="stat-header">
                    <span className="stat-title">Tareas Activas</span>
                    <span className="stat-icon">✅</span>
                  </div>
                  <div className="stat-value">{stats.tareasActivas}</div>
                  <p className="stat-label">De {stats.totalTareas} totales</p>
                </div>
              </div>

              {selectedClass && (
                <div className="dashboard-card" style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--dark-navy)' }}>
                    📚 Información de la Clase
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <strong>Nombre:</strong>
                      <p>{clases.find(c => c._id === selectedClass)?.nombreClase}</p>
                    </div>
                    <div>
                      <strong>Estudiantes Inscritos:</strong>
                      <p>{students.length}</p>
                    </div>
                    <div>
                      <strong>Tareas Creadas:</strong>
                      <p>{tareas.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de Calificaciones */}
          {activeTab === 'grades' && (
            <div className="tab-content">
              <h2 className="dashboard-title">📝 Gestión de Calificaciones</h2>

              {loading && <p className="loading-message">Cargando datos...</p>}

              {!loading && students.length === 0 && selectedClass && (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No hay estudiantes</h3>
                  <p>No hay estudiantes inscritos en esta clase</p>
                </div>
              )}

              {!loading && students.length > 0 && (
                <div className="dashboard-card">
                  <div className="grades-table-container">
                    <table className="enhanced-table">
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Email</th>
                          <th>Calificación</th>
                          <th>Descripción</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student._id}>
                            <td>
                              <strong>{student.nombreCompleto}</strong>
                            </td>
                            <td>{student.email}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={calificaciones[student._id]?.calificacion || ''}
                                onChange={(e) => handleCalificacionChange(student._id, e.target.value)}
                                className="grade-input"
                                placeholder="0-100"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={calificaciones[student._id]?.descripcion || ''}
                                onChange={(e) => handleDescripcionChange(student._id, e.target.value)}
                                className="description-input"
                                placeholder="Descripción"
                              />
                            </td>
                            <td>
                              <button
                                className="btn-task btn-task-success"
                                onClick={() => handleGuardarCalificacion(student._id)}
                                disabled={loading}
                              >
                                💾 Guardar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="actions-footer" style={{ marginTop: '2rem' }}>
                    <button
                      className="btn-save-all"
                      onClick={handleGuardarTodas}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : '💾 Guardar Todas las Calificaciones'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de Tareas */}
          {activeTab === 'tasks' && (
            <div className="tab-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="dashboard-title">📋 Gestión de Tareas</h2>
                <button
                  className="btn-task btn-task-primary"
                  onClick={() => {
                    setShowTaskForm(!showTaskForm);
                    setEditingTask(null);
                    setTaskForm({
                      titulo: '',
                      descripcion: '',
                      fecha_vencimiento: '',
                      peso_porcentual: 0,
                      tipo_tarea: 'tarea'
                    });
                  }}
                >
                  {showTaskForm ? '❌ Cancelar' : '➕ Nueva Tarea'}
                </button>
              </div>

              {showTaskForm && (
                <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                    {editingTask ? '✏️ Editar Tarea' : '➕ Crear Nueva Tarea'}
                  </h3>
                  <form onSubmit={handleCrearTarea} className="admin-form">
                    <div className="form-row">
                      <div className="form-group-inline">
                        <label>Título *</label>
                        <input
                          type="text"
                          value={taskForm.titulo}
                          onChange={(e) => handleTaskFormChange('titulo', e.target.value)}
                          placeholder="Título de la tarea"
                          required
                        />
                      </div>
                      <div className="form-group-inline">
                        <label>Tipo de Tarea</label>
                        <select
                          value={taskForm.tipo_tarea}
                          onChange={(e) => handleTaskFormChange('tipo_tarea', e.target.value)}
                        >
                          <option value="tarea">Tarea</option>
                          <option value="examen">Examen</option>
                          <option value="proyecto">Proyecto</option>
                          <option value="quiz">Quiz</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group-inline">
                        <label>Fecha de Vencimiento *</label>
                        <input
                          type="date"
                          value={taskForm.fecha_vencimiento}
                          onChange={(e) => handleTaskFormChange('fecha_vencimiento', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group-inline">
                        <label>Peso Porcentual (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={taskForm.peso_porcentual}
                          onChange={(e) => handleTaskFormChange('peso_porcentual', e.target.value)}
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    <div className="form-group-inline">
                      <label>Descripción</label>
                      <textarea
                        value={taskForm.descripcion}
                        onChange={(e) => handleTaskFormChange('descripcion', e.target.value)}
                        placeholder="Descripción detallada de la tarea..."
                        rows="4"
                      />
                    </div>

                    <div className="form-buttons">
                      <button type="submit" className="btn-submit" disabled={loading}>
                        {editingTask ? '💾 Actualizar Tarea' : '➕ Crear Tarea'}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setShowTaskForm(false);
                          setEditingTask(null);
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {tareas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No hay tareas</h3>
                  <p>Crea tu primera tarea usando el botón "Nueva Tarea"</p>
                </div>
              ) : (
                <div className="tasks-section">
                  {tareas.map((tarea) => {
                    const status = getTaskStatus(tarea);
                    return (
                      <div key={tarea._id} className={`task-card ${status === 'overdue' ? 'urgent' : ''}`}>
                        <div className="task-header">
                          <h3 className="task-title">{tarea.titulo}</h3>
                          <span className={`task-badge ${status}`}>
                            {status === 'overdue' ? '⚠️ Vencida' : '✅ Activa'}
                          </span>
                        </div>

                        <div className="task-meta">
                          <div className="task-meta-item">
                            <strong>📅 Vencimiento:</strong>
                            <span>{formatDate(tarea.fecha_vencimiento)}</span>
                          </div>
                          <div className="task-meta-item">
                            <strong>📊 Peso:</strong>
                            <span>{tarea.peso_porcentual}%</span>
                          </div>
                          <div className="task-meta-item">
                            <strong>📝 Tipo:</strong>
                            <span style={{ textTransform: 'capitalize' }}>{tarea.tipo_tarea}</span>
                          </div>
                        </div>

                        {tarea.descripcion && (
                          <p className="task-description">{tarea.descripcion}</p>
                        )}

                        <div className="task-actions">
                          <button
                            className="btn-task btn-task-primary"
                            onClick={() => handleEditarTarea(tarea)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn-task btn-task-secondary"
                            onClick={() => {
                              setSelectedTaskForSubmissions(tarea._id);
                              cargarEntregas(tarea._id);
                              setActiveTab('submissions');
                            }}
                          >
                            📥 Ver Entregas
                          </button>
                          <button
                            className="btn-task btn-task-danger"
                            onClick={() => handleEliminarTarea(tarea._id)}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Contenido de Entregas */}
          {activeTab === 'submissions' && (
            <div className="tab-content">
              <h2 className="dashboard-title">📥 Entregas de Estudiantes</h2>

              {tareas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No hay tareas</h3>
                  <p>Primero debes crear tareas para poder ver las entregas</p>
                </div>
              ) : (
                <>
                  <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                    <div className="form-group-inline">
                      <label>Seleccionar Tarea:</label>
                      <select
                        value={selectedTaskForSubmissions}
                        onChange={(e) => {
                          setSelectedTaskForSubmissions(e.target.value);
                          if (e.target.value) {
                            cargarEntregas(e.target.value);
                          }
                        }}
                        className="class-dropdown"
                      >
                        <option value="">-- Seleccione una tarea --</option>
                        {tareas.map((tarea) => (
                          <option key={tarea._id} value={tarea._id}>
                            {tarea.titulo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedTaskForSubmissions && (
                    <>
                      {entregas.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-icon">📭</div>
                          <h3>Sin entregas</h3>
                          <p>No hay entregas para esta tarea aún</p>
                        </div>
                      ) : (
                        <div>
                          {entregas.map((entrega) => (
                            <div
                              key={entrega._id}
                              className={`submission-card ${entrega.calificacion !== null ? 'graded' : entrega.entregado_tarde ? 'late' : 'submitted'}`}
                            >
                              <div className="submission-header">
                                <div>
                                  <h3 style={{ margin: 0, color: 'var(--dark-navy)' }}>
                                    👨‍🎓 {entrega.estudiante?.nombreCompleto || 'Estudiante'}
                                  </h3>
                                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {entrega.estudiante?.email}
                                  </p>
                                </div>
                                <span className={`submission-status ${entrega.calificacion !== null ? 'graded' : entrega.entregado_tarde ? 'late' : 'submitted'}`}>
                                  {entrega.calificacion !== null ? '✅ Calificada' : entrega.entregado_tarde ? '⚠️ Tarde' : '📝 Entregada'}
                                </span>
                              </div>

                              <div className="task-meta">
                                <div className="task-meta-item">
                                  <strong>📅 Fecha de Entrega:</strong>
                                  <span>{formatDate(entrega.fecha_entrega)}</span>
                                </div>
                                {entrega.entregado_tarde && (
                                  <div className="task-meta-item">
                                    <strong>⚠️ Estado:</strong>
                                    <span style={{ color: 'var(--warning-yellow)' }}>Entregado Tarde</span>
                                  </div>
                                )}
                              </div>

                              {entrega.archivo_url && (
                                <div style={{ margin: '1rem 0' }}>
                                  <a
                                    href={entrega.archivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-task btn-task-secondary"
                                  >
                                    📎 Ver Archivo Adjunto
                                  </a>
                                </div>
                              )}

                              {entrega.calificacion !== null ? (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--light-gray)', borderRadius: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <strong style={{ color: 'var(--dark-navy)' }}>Calificación:</strong>
                                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary-blue)', marginLeft: '1rem' }}>
                                        {entrega.calificacion}/100
                                      </span>
                                    </div>
                                  </div>
                                  {entrega.retroalimentacion && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      <strong style={{ color: 'var(--dark-navy)' }}>Retroalimentación:</strong>
                                      <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                                        {entrega.retroalimentacion}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="submission-form">
                                  <h4 style={{ margin: '0 0 0.5rem', color: 'var(--dark-navy)' }}>
                                    📝 Calificar Entrega
                                  </h4>
                                  <div className="form-row">
                                    <div className="form-group-inline">
                                      <label>Calificación (0-100)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        id={`grade-${entrega._id}`}
                                        placeholder="0-100"
                                      />
                                    </div>
                                  </div>
                                  <div className="form-group-inline">
                                    <label>Retroalimentación</label>
                                    <textarea
                                      id={`feedback-${entrega._id}`}
                                      placeholder="Comentarios para el estudiante..."
                                      rows="3"
                                    />
                                  </div>
                                  <button
                                    className="btn-task btn-task-success"
                                    onClick={() => {
                                      const grade = document.getElementById(`grade-${entrega._id}`).value;
                                      const feedback = document.getElementById(`feedback-${entrega._id}`).value;
                                      if (grade) {
                                        handleCalificarEntrega(entrega._id, grade, feedback);
                                      } else {
                                        setMessage({ type: 'error', text: 'Por favor ingrese una calificación' });
                                      }
                                    }}
                                  >
                                    💾 Guardar Calificación
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
