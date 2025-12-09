import { useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function NotasPage() {
  const { tokens } = useAuth();
  const [filters, setFilters] = useState({ asignatura: "", periodo: "" });
  const [resultado, setResultado] = useState(null);
  const [status, setStatus] = useState(null);

  const disabled = !tokens?.access;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) return;
    if (!filters.asignatura && !filters.periodo) {
      setStatus({ type: "error", message: "Indica al menos una asignatura o un periodo." });
      return;
    }
    setStatus({ type: "loading", message: "Consultando notas..." });
    const query = new URLSearchParams();
    if (filters.asignatura) query.append("asignatura", filters.asignatura);
    if (filters.periodo) query.append("periodo", filters.periodo);
    try {
      const qs = query.toString();
      const data = await apiFetch(`/Academico/notas/${qs ? `?${qs}` : ""}`, { token: tokens.access });
      setResultado(data);
      setStatus({ type: "success", message: "Notas actualizadas." });
    } catch (error) {
      setResultado(null);
      setStatus({ type: "error", message: error.message });
    }
  };

  const renderNotas = () => {
    if (!resultado) return <p className="hint">Aún no hay resultados.</p>;
    const registros = Array.isArray(resultado) ? resultado : [resultado];
    return registros.map((registro, idx) => (
      <article key={idx} className="list-item">
        <div>
          <p className="eyebrow">{registro.periodo}</p>
          <h3>{registro.asignatura}</h3>
          <ul className="tasks">
            {registro.tareas?.map((tarea, index) => (
              <li key={index}>
                <span>{tarea.titulo}</span>
                <span className="pill">{tarea.tipo_tarea}</span>
                <span className="pill">{tarea.peso_porcentual}%</span>
                <span className="pill">{tarea.estado_calificacion}</span>
                {tarea.nota && <strong>{tarea.nota}</strong>}
              </li>
            ))}
          </ul>
        </div>
        <div className="meta">
          <span className="pill">Promedio: {registro.promedio_general}</span>
        </div>
      </article>
    ));
  };

  return (
    <section className="card">
      <p className="eyebrow">Notas</p>
      <h1>Progreso académico</h1>
      <p className="hint">Filtra por asignatura o periodo académico para obtener el cálculo desde el endpoint <code>/api/Academico/notas/</code>.</p>
      <form className="grid two" onSubmit={handleSubmit}>
        <label className="field">
          <span>ID asignatura</span>
          <input name="asignatura" value={filters.asignatura} onChange={(e) => setFilters({ ...filters, asignatura: e.target.value })} disabled={disabled} />
        </label>
        <label className="field">
          <span>Periodo</span>
          <input name="periodo" value={filters.periodo} onChange={(e) => setFilters({ ...filters, periodo: e.target.value })} disabled={disabled} />
        </label>
        <button className="full" type="submit" disabled={disabled}>
          Consultar notas
        </button>
      </form>
      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}
      <div className="list">{renderNotas()}</div>
    </section>
  );
}