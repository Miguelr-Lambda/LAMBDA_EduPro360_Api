import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { entregasAPI } from "../services/api";
import GestionEntregas from "./GestionEntregas";

export default function EntregasPanel() {
  const { user } = useAuth();
  const [entregas, setEntregas] = useState([]);
  const [status, setStatus] = useState(null);
  const [mostrarGestion, setMostrarGestion] = useState(false);

  const disabled = !user;

  const loadEntregas = async () => {
    if (!user) return;
    try {
      setStatus({ type: "loading", message: "Cargando entregas..." });
      const data = await entregasAPI.listar();
      setEntregas(Array.isArray(data) ? data : data.results || []);
      setStatus(null);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadEntregas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Calcular estadísticas
  const totalEntregas = entregas.length;
  const pendientesCalificar = entregas.filter(e => e.estado_calificacion === 'SIN_CALIFICAR').length;
  const calificadas = entregas.filter(e => e.estado_calificacion === 'CALIFICADO').length;

  return (
    <div className="card">
      <p className="eyebrow">Entregas y Calificaciones</p>
      <h2>Gestión de Calificaciones</h2>
      <p className="hint">
        Califica las entregas de los estudiantes y proporciona retroalimentación. Las notas se calculan automáticamente según el peso de cada tarea.
      </p>

      {/* Estadísticas rápidas */}
      {totalEntregas > 0 && (
        <div className="stats-row" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{totalEntregas}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Entregas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{pendientesCalificar}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Pendientes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>{calificadas}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Calificadas</div>
          </div>
        </div>
      )}

      <button
        className="full"
        onClick={() => setMostrarGestion(true)}
        disabled={disabled}
        style={{ marginBottom: '1rem' }}
      >
        ✅ Gestionar Calificaciones
      </button>

      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}

      <div className="list compact">
        {entregas.slice(0, 5).map((entrega) => (
          <article key={entrega.id} className="list-item">
            <div>
              <p className="eyebrow">{entrega.tarea_titulo || `Tarea ${entrega.tarea}`}</p>
              <h3>{entrega.estudiante_nombre || `Estudiante ${entrega.estudiante}`}</h3>
              {entrega.comentarios_estudiante && (
                <p>{entrega.comentarios_estudiante}</p>
              )}
            </div>
            <div className="meta">
              <span className={`pill ${entrega.estado_calificacion === 'CALIFICADO' ? 'success' : 'warning'}`}>
                {entrega.estado_calificacion === 'CALIFICADO' ? '✓ Calificada' : '⏳ Pendiente'}
              </span>
              {entrega.nota !== null && (
                <span className={`pill ${parseFloat(entrega.nota) >= 3.0 ? 'success' : 'danger'}`}>
                  Nota: {parseFloat(entrega.nota).toFixed(2)}
                </span>
              )}
              <span className="pill">
                📎 {entrega.archivo_entrega}
              </span>
            </div>
          </article>
        ))}
        {entregas.length > 5 && (
          <p className="hint" style={{ textAlign: 'center', marginTop: '1rem' }}>
            Mostrando 5 de {entregas.length} entregas.{' '}
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
        {entregas.length === 0 && !status && (
          <p className="hint">No hay entregas cargadas.</p>
        )}
      </div>

      {/* Modal de Gestión */}
      {mostrarGestion && (
        <GestionEntregas
          onCerrar={() => {
            setMostrarGestion(false);
            loadEntregas();
          }}
        />
      )}
    </div>
  );
}
