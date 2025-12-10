import { useAuth } from "../context/AuthContext";

export default function DocenteDashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Panel del Docente</h1>
        <p className="welcome-text">
          Bienvenido, <strong>Profesor/a {user?.first_name || user?.username}</strong>
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Mis Asignaturas</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Asignaturas que imparto</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Tareas Activas</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Tareas pendientes de calificar</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>Estudiantes</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Total de estudiantes</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Entregas Recibidas</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Esta semana</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2>Mis Asignaturas</h2>
          </div>
          <p>Gestiona las asignaturas que impartes y su contenido.</p>
          <div className="button-group">
            <button className="btn btn-primary">Ver Asignaturas</button>
            <button className="btn btn-secondary">Crear Asignatura</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Tareas y Evaluaciones</h2>
          </div>
          <p>Crea tareas, gestiona entregas y califica a tus estudiantes.</p>
          <div className="button-group">
            <button className="btn btn-primary">Ver Tareas</button>
            <button className="btn btn-secondary">Crear Tarea</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Calificaciones</h2>
          </div>
          <p>Revisa y gestiona las calificaciones de tus estudiantes.</p>
          <button className="btn btn-primary">Ver Calificaciones</button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Mis Estudiantes</h2>
          </div>
          <p>Consulta información sobre tus estudiantes y su progreso.</p>
          <button className="btn btn-primary">Ver Estudiantes</button>
        </div>
      </div>
    </div>
  );
}
