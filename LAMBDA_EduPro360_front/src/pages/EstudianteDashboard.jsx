import { useAuth } from "../context/AuthContext";

export default function EstudianteDashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Mi Portal Estudiantil</h1>
        <p className="welcome-text">
          Bienvenido/a, <strong>{user?.first_name || user?.username}</strong>
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Mis Asignaturas</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Asignaturas matriculadas</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Tareas Pendientes</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Por entregar</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Tareas Completadas</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Este periodo</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Promedio General</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Calificación actual</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2>Mis Asignaturas</h2>
          </div>
          <p>Accede a tus asignaturas y consulta el contenido del curso.</p>
          <button className="btn btn-primary">Ver Asignaturas</button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Tareas Pendientes</h2>
          </div>
          <p>Consulta las tareas asignadas y envía tus entregas.</p>
          <button className="btn btn-primary">Ver Tareas</button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Mis Calificaciones</h2>
          </div>
          <p>Revisa tus calificaciones y tu progreso académico.</p>
          <button className="btn btn-primary">Ver Notas</button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Horario de Clases</h2>
          </div>
          <p>Consulta tu horario académico semanal.</p>
          <button className="btn btn-primary">Ver Horario</button>
        </div>
      </div>

      <div className="card full highlight-card">
        <div className="card-header">
          <h2>Próximas Entregas</h2>
        </div>
        <p className="hint">
          No tienes tareas con fecha de entrega próxima. ¡Buen trabajo!
        </p>
      </div>
    </div>
  );
}
