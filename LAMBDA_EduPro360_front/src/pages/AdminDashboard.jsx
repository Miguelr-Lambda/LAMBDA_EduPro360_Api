import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import RegistrarUsuarioForm from "../components/RegistrarUsuarioForm";
import FormularioAsignatura from "../components/FormularioAsignatura";
import { apiFetch } from "../utils/api";

export default function AdminDashboard() {
  const { user, tokens } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormAsignatura, setMostrarFormAsignatura] = useState(false);
  const [asignaturas, setAsignaturas] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [stats, setStats] = useState({
    usuarios: 0,
    docentes: 0,
    estudiantes: 0,
    asignaturas: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar asignaturas
      const respAsignaturas = await apiFetch("/asignaturas/", {
        headers: { Authorization: `Bearer ${tokens.access}` }
      });
      setAsignaturas(respAsignaturas);

      // Cargar usuarios para obtener docentes y estudiantes
      const respUsuarios = await apiFetch("/Usuarios/", {
        headers: { Authorization: `Bearer ${tokens.access}` }
      });
      const usuarios = respUsuarios.results || respUsuarios;

      const docentesList = usuarios.filter(u => u.rol_detalle?.nombre === "Docente");
      const estudiantesList = usuarios.filter(u => u.rol_detalle?.nombre === "Estudiante");

      setDocentes(docentesList);
      setEstudiantes(estudiantesList);

      // Actualizar stats
      setStats({
        usuarios: usuarios.length,
        docentes: docentesList.length,
        estudiantes: estudiantesList.length,
        asignaturas: respAsignaturas.length,
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const handleUsuarioCreado = (nuevoUsuario) => {
    console.log("Usuario creado:", nuevoUsuario);
    setMostrarFormulario(false);
    cargarDatos(); // Recargar datos
  };

  const handleAsignaturaCreada = () => {
    setMostrarFormAsignatura(false);
    cargarDatos(); // Recargar datos
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
            <p className="stat-number">{stats.usuarios}</p>
            <span className="stat-label">Total de usuarios en el sistema</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>Docentes</h3>
            <p className="stat-number">{stats.docentes}</p>
            <span className="stat-label">Profesores activos</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>Estudiantes</h3>
            <p className="stat-number">{stats.estudiantes}</p>
            <span className="stat-label">Estudiantes registrados</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Asignaturas</h3>
            <p className="stat-number">{stats.asignaturas}</p>
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

        <div className="card full">
          <div className="card-header">
            <h2>📚 Gestión de Asignaturas (Materias)</h2>
          </div>
          {!mostrarFormAsignatura ? (
            <>
              <p>Como administrador, eres el único que puede crear y gestionar asignaturas.</p>
              <button
                className="btn btn-primary"
                onClick={() => setMostrarFormAsignatura(true)}
              >
                ➕ Crear Nueva Asignatura
              </button>

              {asignaturas.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h3>Asignaturas Registradas</h3>
                  <div className="asignaturas-list">
                    {asignaturas.map((asig) => (
                      <div key={asig.id} className="asignatura-item">
                        <div>
                          <strong>{asig.nombre}</strong> ({asig.codigo})
                          <br />
                          <small>
                            Docente: {asig.docente_nombre || "No asignado"} |
                            Periodo: {asig.periodo_academico} |
                            Estudiantes: {asig.estudiantes?.length || 0}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <FormularioAsignatura
                docentes={docentes}
                estudiantes={estudiantes}
                tokens={tokens}
                onAsignaturaCreada={handleAsignaturaCreada}
              />
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarFormAsignatura(false)}
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
