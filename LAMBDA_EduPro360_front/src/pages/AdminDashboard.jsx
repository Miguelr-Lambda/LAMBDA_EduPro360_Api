import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import RegistrarUsuarioForm from "../components/RegistrarUsuarioForm";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleUsuarioCreado = (nuevoUsuario) => {
    // Aquí podrías actualizar estadísticas o mostrar una notificación
    console.log("Usuario creado:", nuevoUsuario);
    setMostrarFormulario(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p className="welcome-text">
          Bienvenido, <strong>{user?.first_name || user?.username}</strong>
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Usuarios</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Total de usuarios en el sistema</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>Docentes</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Profesores activos</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>Estudiantes</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Estudiantes registrados</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Asignaturas</h3>
            <p className="stat-number">-</p>
            <span className="stat-label">Total de asignaturas</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card full">
          <div className="card-header">
            <h2>Registrar Nuevo Usuario</h2>
          </div>
          {!mostrarFormulario ? (
            <>
              <p>Crea nuevos usuarios (profesores o estudiantes) en el sistema.</p>
              <p className="hint">
                Se generará automáticamente una contraseña segura que será enviada al correo del usuario.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setMostrarFormulario(true)}
              >
                Registrar Usuario
              </button>
            </>
          ) : (
            <>
              <RegistrarUsuarioForm onUsuarioCreado={handleUsuarioCreado} />
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarFormulario(false)}
                style={{ marginTop: "1rem" }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Gestión de Usuarios</h2>
          </div>
          <p>Administra usuarios, roles y permisos del sistema.</p>
          <div className="button-group">
            <button className="btn btn-primary">Ver Usuarios</button>
            <button className="btn btn-secondary">Gestionar Roles</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Configuración del Sistema</h2>
          </div>
          <p>Configura parámetros generales y ajustes de la plataforma.</p>
          <div className="button-group">
            <button className="btn btn-primary">Configuración</button>
            <button className="btn btn-secondary">Logs del Sistema</button>
          </div>
        </div>

        <div className="card full">
          <div className="card-header">
            <h2>Reportes Administrativos</h2>
          </div>
          <p>Genera y consulta reportes sobre el uso de la plataforma.</p>
          <button className="btn btn-primary">Ver Reportes</button>
        </div>
      </div>
    </div>
  );
}
