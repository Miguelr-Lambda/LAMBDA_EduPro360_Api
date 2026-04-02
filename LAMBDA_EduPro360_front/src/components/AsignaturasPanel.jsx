import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { asignaturasAPI } from "../services/api";
import GestionAsignaturas from "./GestionAsignaturas";

export default function AsignaturasPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(null);
  const [mostrarGestion, setMostrarGestion] = useState(false);

  const disabled = !user;

  const loadAsignaturas = async () => {
    if (!user) return;
    try {
      setStatus({ type: "loading", message: "Cargando asignaturas..." });
      const data = await asignaturasAPI.listar();
      setItems(Array.isArray(data) ? data : data.results || []);
      setStatus(null);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadAsignaturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="card">
      <p className="eyebrow">Asignaturas</p>
      <h2>Gestión Académica</h2>
      <p className="hint">
        Administra asignaturas, docentes responsables, periodos académicos e inscripción de estudiantes.
      </p>

      <button
        className="full"
        onClick={() => setMostrarGestion(true)}
        disabled={disabled}
        style={{ marginBottom: '1rem' }}
      >
        📚 Gestionar Asignaturas
      </button>

      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}

      <div className="list">
        {items.slice(0, 5).map((asignatura) => (
          <article key={asignatura.id} className="list-item">
            <div>
              <p className="eyebrow">{asignatura.periodo_academico}</p>
              <h3>{asignatura.nombre}</h3>
              <p>{asignatura.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="meta">
              <span className="pill">Código: {asignatura.codigo}</span>
              {asignatura.docente_nombre && (
                <span className="pill">👨‍🏫 {asignatura.docente_nombre}</span>
              )}
              <span className="pill">
                👥 {asignatura.estudiantes?.length || 0} estudiantes
              </span>
              <span className={`pill ${asignatura.estado === 'ACTIVA' ? 'success' : 'danger'}`}>
                {asignatura.estado === 'ACTIVA' ? '✓ Activa' : '✕ Inactiva'}
              </span>
            </div>
          </article>
        ))}
        {items.length > 5 && (
          <p className="hint" style={{ textAlign: 'center', marginTop: '1rem' }}>
            Mostrando 5 de {items.length} asignaturas.{' '}
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
        {items.length === 0 && !status && (
          <p className="hint">No hay asignaturas todavía.</p>
        )}
      </div>

      {/* Modal de Gestión */}
      {mostrarGestion && (
        <GestionAsignaturas
          onCerrar={() => {
            setMostrarGestion(false);
            loadAsignaturas();
          }}
        />
      )}
    </div>
  );
}
