import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { tareasAPI } from "../services/api";
import GestionTareas from "./GestionTareas";

export default function TareasPanel() {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [status, setStatus] = useState(null);
  const [mostrarGestion, setMostrarGestion] = useState(false);

  const disabled = !user;

  const loadTareas = async () => {
    if (!user) return;
    try {
      setStatus({ type: "loading", message: "Cargando tareas..." });
      const data = await tareasAPI.listar();
      setTareas(Array.isArray(data) ? data : data.results || []);
      setStatus(null);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Ordenar tareas por fecha de vencimiento
  const tareasOrdenadas = [...tareas].sort((a, b) => {
    return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
  });

  // Función para calcular días restantes
  const diasRestantes = (fechaVencimiento) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="card">
      <p className="eyebrow">Tareas y Evaluaciones</p>
      <h2>Gestión de Tareas</h2>
      <p className="hint">
        Crea y gestiona tareas y exámenes. El plan de evaluación por asignatura debe sumar exactamente 100%.
      </p>

      <button
        className="full"
        onClick={() => setMostrarGestion(true)}
        disabled={disabled}
        style={{ marginBottom: '1rem' }}
      >
        📝 Gestionar Tareas
      </button>

      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}

      <div className="list">
        {tareasOrdenadas.slice(0, 5).map((tarea) => {
          const dias = diasRestantes(tarea.fecha_vencimiento);
          let estadoVencimiento = '';
          if (dias < 0) {
            estadoVencimiento = 'vencida';
          } else if (dias <= 3) {
            estadoVencimiento = 'proxima';
          }

          return (
            <article key={tarea.id} className={`list-item ${estadoVencimiento}`}>
              <div>
                <p className="eyebrow">{tarea.asignatura_nombre || `Asignatura ${tarea.asignatura}`}</p>
                <h3>{tarea.titulo}</h3>
                <p>{tarea.descripcion}</p>
              </div>
              <div className="meta">
                <span className={`pill ${tarea.tipo_tarea === 'EXAMEN' ? 'warning' : ''}`}>
                  {tarea.tipo_tarea === 'EXAMEN' ? '📝 Examen' : '📄 Tarea'}
                </span>
                <span className="pill">
                  {tarea.peso_porcentual}%
                </span>
                <span className={`pill ${dias < 0 ? 'danger' : dias <= 3 ? 'warning' : ''}`}>
                  {dias < 0
                    ? '⚠️ Vencida'
                    : dias === 0
                    ? '⏰ Vence hoy'
                    : dias <= 3
                    ? `⏰ ${dias} día${dias > 1 ? 's' : ''}`
                    : `📅 ${new Date(tarea.fecha_vencimiento).toLocaleDateString()}`
                  }
                </span>
                <span className={`pill ${tarea.estado === 'ACTIVA' ? 'success' : 'danger'}`}>
                  {tarea.estado === 'ACTIVA' ? '✓ Activa' : '✕ Inactiva'}
                </span>
              </div>
            </article>
          );
        })}
        {tareas.length > 5 && (
          <p className="hint" style={{ textAlign: 'center', marginTop: '1rem' }}>
            Mostrando 5 de {tareas.length} tareas.{' '}
            <button
              onClick={() => setMostrarGestion(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Ver todas
            </button>
          </p>
        )}
        {tareas.length === 0 && !status && (
          <p className="hint">Aún no hay tareas registradas.</p>
        )}
      </div>

      {/* Modal de Gestión */}
      {mostrarGestion && (
        <GestionTareas
          onCerrar={() => {
            setMostrarGestion(false);
            loadTareas();
          }}
        />
      )}
    </div>
  );
}
