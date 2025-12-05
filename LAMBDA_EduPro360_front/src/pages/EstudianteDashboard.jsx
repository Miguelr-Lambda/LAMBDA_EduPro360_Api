import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { calificacionesAPI, tareasAPI, entregasAPI } from "../services/api";

export default function EstudianteDashboard() {
  const { user, logout } = useAuth();

  // Estados principales
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados de estadísticas
  const [stats, setStats] = useState({
    promedioGeneral: 0,
    totalTareas: 0,
    tareasPendientes: 0,
    tareasCompletadas: 0
  });

  // Estados de calificaciones
  const [calificaciones, setCalificaciones] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [showReporte, setShowReporte] = useState(false);

  // Estados de tareas
  const [tareas, setTareas] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Estados de entregas
  const [entregas, setEntregas] = useState([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    tarea: '',
    archivo_url: '',
    comentario: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (user && user._id) {
      cargarCalificaciones();
      cargarTareas();
      cargarEntregas();
    }
  }, [user]);

  // Actualizar estadísticas
  useEffect(() => {
    calcularEstadisticas();
  }, [calificaciones, tareas, entregas]);

  const cargarCalificaciones = async () => {
    try {
      const response = await calificacionesAPI.obtenerMisCalificaciones();
      if (response.success) {
        setCalificaciones(response.calificaciones);
      }
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
    }
  };

  const cargarTareas = async () => {
    try {
      const response = await tareasAPI.obtenerMisTareas();
      if (response.success) {
        setTareas(response.tareas);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  };

  const cargarEntregas = async () => {
    try {
      const response = await entregasAPI.obtenerMisEntregas();
      if (response.success) {
        setEntregas(response.entregas);
      }
    } catch (error) {
      console.error('Error al cargar entregas:', error);
    }
  };

  const calcularEstadisticas = () => {
    const promedio = calificaciones.length > 0
      ? (calificaciones.reduce((sum, c) => sum + c.calificacion, 0) / calificaciones.length).toFixed(2)
      : 0;

    const tareasIds = entregas.map(e => e.tarea._id || e.tarea);
    const tareasCompletadas = new Set(tareasIds).size;
    const tareasPendientes = tareas.length - tareasCompletadas;

    setStats({
      promedioGeneral: promedio,
      totalTareas: tareas.length,
      tareasPendientes: tareasPendientes > 0 ? tareasPendientes : 0,
      tareasCompletadas
    });
  };

  const handleGenerarReporte = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await calificacionesAPI.generarReporte(user._id);

      if (response.success) {
        setReporte(response.reporte);
        setShowReporte(true);
        setMessage({ type: 'success', text: 'Reporte generado exitosamente' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al generar reporte' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionFormChange = (field, value) => {
    setSubmissionForm({ ...submissionForm, [field]: value });
  };

  const handleEntregarTarea = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      if (!submissionForm.tarea) {
        setMessage({ type: 'error', text: 'Por favor seleccione una tarea' });
        return;
      }

      const response = await entregasAPI.crear({
        tarea: submissionForm.tarea,
        archivo_url: submissionForm.archivo_url,
        comentario: submissionForm.comentario
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Tarea entregada exitosamente' });
        setShowSubmissionForm(false);
        setSubmissionForm({
          tarea: '',
          archivo_url: '',
          comentario: ''
        });
        await cargarEntregas();
        await cargarTareas();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al entregar tarea' });
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (tarea) => {
    const now = new Date();
    const vencimiento = new Date(tarea.fecha_vencimiento);
    const entregada = entregas.some(e => (e.tarea._id || e.tarea) === tarea._id);

    if (entregada) return 'completed';
    if (vencimiento < now) return 'overdue';
    return 'pending';
  };

  const getGradeClass = (grade) => {
    if (grade >= 90) return 'excellent';
    if (grade >= 80) return 'good';
    if (grade >= 70) return 'average';
    return 'poor';
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
          <h1>EduPro360 <span className="role-badge">Estudiante</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 600 }}>👨‍🎓 {user?.nombreCompleto}</span>
          <button onClick={logout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Mensajes de feedback */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

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
              📝 Mis Calificaciones
            </button>
            <button
              className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              📋 Mis Tareas
            </button>
            <button
              className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              📥 Mis Entregas
            </button>
          </div>

          {/* Contenido de Overview */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <h2 className="dashboard-title">📊 Resumen General</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Promedio General</span>
                    <span className="stat-icon">📈</span>
                  </div>
                  <div className="stat-value">{stats.promedioGeneral}</div>
                  <p className="stat-label">De 100 puntos</p>
                </div>

                <div className="stat-card gold">
                  <div className="stat-header">
                    <span className="stat-title">Tareas Pendientes</span>
                    <span className="stat-icon">⏳</span>
                  </div>
                  <div className="stat-value">{stats.tareasPendientes}</div>
                  <p className="stat-label">Por entregar</p>
                </div>

                <div className="stat-card green">
                  <div className="stat-header">
                    <span className="stat-title">Tareas Completadas</span>
                    <span className="stat-icon">✅</span>
                  </div>
                  <div className="stat-value">{stats.tareasCompletadas}</div>
                  <p className="stat-label">De {stats.totalTareas} totales</p>
                </div>
              </div>

              {/* Progreso de tareas */}
              <div className="dashboard-card" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--dark-navy)' }}>
                  📊 Progreso de Tareas
                </h3>
                <div className="progress-container">
                  <div className="progress-label">
                    <span>Tareas Completadas</span>
                    <span>{stats.tareasCompletadas} / {stats.totalTareas}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${stats.tareasCompletadas === stats.totalTareas ? 'success' : ''}`}
                      style={{
                        width: `${stats.totalTareas > 0 ? (stats.tareasCompletadas / stats.totalTareas) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="dashboard-card" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--dark-navy)' }}>
                  👨‍🎓 Mi Información
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Grado:</strong>
                    <p>{user?.grado || 'No especificado'}</p>
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <p>{user?.email}</p>
                  </div>
                  <div>
                    <strong>Total Clases:</strong>
                    <p>{calificaciones.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Calificaciones */}
          {activeTab === 'grades' && (
            <div className="tab-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="dashboard-title">📝 Mis Calificaciones</h2>
                {calificaciones.length > 0 && (
                  <button
                    className="btn-task btn-task-primary"
                    onClick={handleGenerarReporte}
                    disabled={loading}
                  >
                    📄 Generar Reporte
                  </button>
                )}
              </div>

              {loading && <p className="loading-message">Cargando calificaciones...</p>}

              {!loading && calificaciones.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h3>Sin calificaciones</h3>
                  <p>No tienes calificaciones registradas aún</p>
                </div>
              )}

              {!loading && calificaciones.length > 0 && (
                <div className="dashboard-card">
                  <div className="grades-table-container">
                    <table className="enhanced-table">
                      <thead>
                        <tr>
                          <th>Clase</th>
                          <th>Calificación</th>
                          <th>Periodo</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calificaciones.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{item.clase?.nombreClase || 'N/A'}</strong>
                            </td>
                            <td>
                              <div className={`grade-display ${getGradeClass(item.calificacion)}`}>
                                {item.calificacion}
                              </div>
                            </td>
                            <td>{item.periodo || 'Primer Periodo'}</td>
                            <td>{item.descripcion || 'Sin descripción'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="average-section">
                    <p className="average-label">Promedio General:</p>
                    <p className="average-value">{stats.promedioGeneral}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de Tareas */}
          {activeTab === 'tasks' && (
            <div className="tab-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="dashboard-title">📋 Mis Tareas Asignadas</h2>
                <button
                  className="btn-task btn-task-success"
                  onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                >
                  {showSubmissionForm ? '❌ Cancelar' : '📤 Entregar Tarea'}
                </button>
              </div>

              {showSubmissionForm && (
                <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                    📤 Entregar Tarea
                  </h3>
                  <form onSubmit={handleEntregarTarea} className="admin-form">
                    <div className="form-group-inline">
                      <label>Seleccionar Tarea *</label>
                      <select
                        value={submissionForm.tarea}
                        onChange={(e) => handleSubmissionFormChange('tarea', e.target.value)}
                        required
                      >
                        <option value="">-- Seleccione una tarea --</option>
                        {tareas.filter(t => getTaskStatus(t) !== 'completed').map((tarea) => (
                          <option key={tarea._id} value={tarea._id}>
                            {tarea.titulo} - Vence: {formatDate(tarea.fecha_vencimiento)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-inline">
                      <label>URL del Archivo (Google Drive, Dropbox, etc.)</label>
                      <input
                        type="url"
                        value={submissionForm.archivo_url}
                        onChange={(e) => handleSubmissionFormChange('archivo_url', e.target.value)}
                        placeholder="https://drive.google.com/..."
                      />
                    </div>

                    <div className="form-group-inline">
                      <label>Comentarios (opcional)</label>
                      <textarea
                        value={submissionForm.comentario}
                        onChange={(e) => handleSubmissionFormChange('comentario', e.target.value)}
                        placeholder="Comentarios adicionales sobre tu entrega..."
                        rows="3"
                      />
                    </div>

                    <div className="form-buttons">
                      <button type="submit" className="btn-submit" disabled={loading}>
                        📤 Entregar Tarea
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowSubmissionForm(false)}
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
                  <h3>Sin tareas asignadas</h3>
                  <p>No tienes tareas asignadas por el momento</p>
                </div>
              ) : (
                <div className="tasks-section">
                  {tareas.map((tarea) => {
                    const status = getTaskStatus(tarea);
                    return (
                      <div
                        key={tarea._id}
                        className={`task-card ${status === 'overdue' ? 'urgent' : status === 'completed' ? 'completed' : ''}`}
                      >
                        <div className="task-header">
                          <h3 className="task-title">{tarea.titulo}</h3>
                          <span className={`task-badge ${status}`}>
                            {status === 'completed' ? '✅ Entregada' : status === 'overdue' ? '⚠️ Vencida' : '📝 Pendiente'}
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
                          <div className="task-meta-item">
                            <strong>📚 Clase:</strong>
                            <span>{tarea.clase?.nombreClase || 'N/A'}</span>
                          </div>
                        </div>

                        {tarea.descripcion && (
                          <p className="task-description">{tarea.descripcion}</p>
                        )}

                        {status !== 'completed' && (
                          <div className="task-actions">
                            <button
                              className="btn-task btn-task-success"
                              onClick={() => {
                                setSubmissionForm({ ...submissionForm, tarea: tarea._id });
                                setShowSubmissionForm(true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              📤 Entregar Ahora
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Contenido de Mis Entregas */}
          {activeTab === 'submissions' && (
            <div className="tab-content">
              <h2 className="dashboard-title">📥 Mis Entregas</h2>

              {entregas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📥</div>
                  <h3>Sin entregas</h3>
                  <p>No has entregado ninguna tarea aún</p>
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
                            {entrega.tarea?.titulo || 'Tarea'}
                          </h3>
                          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            📚 {entrega.tarea?.clase?.nombreClase || 'N/A'}
                          </p>
                        </div>
                        <span className={`submission-status ${entrega.calificacion !== null ? 'graded' : entrega.entregado_tarde ? 'late' : 'submitted'}`}>
                          {entrega.calificacion !== null ? '✅ Calificada' : entrega.entregado_tarde ? '⚠️ Entregada Tarde' : '📝 Entregada'}
                        </span>
                      </div>

                      <div className="task-meta">
                        <div className="task-meta-item">
                          <strong>📅 Fecha de Entrega:</strong>
                          <span>{formatDate(entrega.fecha_entrega)}</span>
                        </div>
                        <div className="task-meta-item">
                          <strong>⏰ Vencimiento Original:</strong>
                          <span>{formatDate(entrega.tarea?.fecha_vencimiento)}</span>
                        </div>
                        {entrega.entregado_tarde && (
                          <div className="task-meta-item">
                            <strong>⚠️ Estado:</strong>
                            <span style={{ color: 'var(--warning-yellow)' }}>Entregado Tarde</span>
                          </div>
                        )}
                      </div>

                      {entrega.comentario && (
                        <div style={{ margin: '1rem 0', padding: '1rem', background: 'var(--light-gray)', borderRadius: '8px' }}>
                          <strong>💬 Tu Comentario:</strong>
                          <p style={{ margin: '0.5rem 0 0' }}>{entrega.comentario}</p>
                        </div>
                      )}

                      {entrega.archivo_url && (
                        <div style={{ margin: '1rem 0' }}>
                          <a
                            href={entrega.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-task btn-task-secondary"
                          >
                            📎 Ver Archivo Entregado
                          </a>
                        </div>
                      )}

                      {entrega.calificacion !== null ? (
                        <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '8px', border: '2px solid var(--secondary-blue)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div className={`grade-display ${getGradeClass(entrega.calificacion)}`} style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                              {entrega.calificacion}
                            </div>
                            <div style={{ flex: 1 }}>
                              <strong style={{ color: 'var(--dark-navy)', fontSize: '1.1rem' }}>Calificación Final</strong>
                              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
                                De 100 puntos
                              </p>
                            </div>
                          </div>
                          {entrega.retroalimentacion && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-gray)' }}>
                              <strong style={{ color: 'var(--dark-navy)' }}>💬 Retroalimentación del Profesor:</strong>
                              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                {entrega.retroalimentacion}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '2px solid var(--warning-yellow)' }}>
                          <p style={{ margin: 0, color: '#92400e', fontWeight: 600 }}>
                            ⏳ Pendiente de calificación
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Reporte */}
        {showReporte && reporte && (
          <div className="report-modal">
            <div className="report-content">
              <div className="report-header">
                <h2>📄 Reporte Académico</h2>
                <button
                  className="btn-close-report"
                  onClick={() => setShowReporte(false)}
                >
                  ✕
                </button>
              </div>

              <div className="report-body">
                <div className="report-section">
                  <h3>Información del Estudiante</h3>
                  <p><strong>Nombre:</strong> {reporte.estudiante.nombreCompleto}</p>
                  <p><strong>Grado:</strong> {reporte.estudiante.grado}</p>
                  <p><strong>Email:</strong> {reporte.estudiante.email}</p>
                </div>

                <div className="report-section">
                  <h3>Calificaciones</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Clase</th>
                        <th>Calificación</th>
                        <th>Periodo</th>
                        <th>Profesor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.calificaciones.map((cal, index) => (
                        <tr key={index}>
                          <td>{cal.clase}</td>
                          <td>
                            <span className={`grade-display ${getGradeClass(cal.calificacion)}`} style={{ width: '50px', height: '50px', fontSize: '1rem' }}>
                              {cal.calificacion}
                            </span>
                          </td>
                          <td>{cal.periodo}</td>
                          <td>{cal.profesor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h3>Resumen</h3>
                  <p><strong>Total de Clases:</strong> {reporte.totalClases}</p>
                  <p><strong>Promedio General:</strong> <span className="average-value">{reporte.promedio}</span></p>
                  <p><strong>Fecha de Generación:</strong> {new Date(reporte.fechaGeneracion).toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              <div className="report-footer">
                <button
                  className="btn-download-report"
                  onClick={() => window.print()}
                >
                  📄 Imprimir / Descargar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
