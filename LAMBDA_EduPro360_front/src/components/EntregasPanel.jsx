import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function EntregasPanel({ canGrade = false }) {
  const { tokens } = useAuth();
  const [entregas, setEntregas] = useState([]);
  const [form, setForm] = useState({ tarea: "", estudiante: "", archivo_entrega: "", comentarios_estudiante: "" });
  const [calificacion, setCalificacion] = useState({ id: "", nota: "", retroalimentacion_docente: "" });
  const [status, setStatus] = useState(null);

  const disabled = !tokens?.access || !canGrade;

  const loadEntregas = async () => {
    if (!tokens?.access) return;
    try {
      const data = await apiFetch("/Academico/entregas/", { token: tokens.access });
      setEntregas(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadEntregas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) return;
    setStatus({ type: "loading", message: "Registrando entrega..." });
    try {
      await apiFetch("/Academico/entregas/", {
        method: "POST",
        token: tokens.access,
        body: {
          tarea: Number(form.tarea),
          estudiante: Number(form.estudiante),
          archivo_entrega: form.archivo_entrega,
          comentarios_estudiante: form.comentarios_estudiante,
        },
      });
      setStatus({ type: "success", message: "Entrega guardada." });
      setForm({ tarea: "", estudiante: "", archivo_entrega: "", comentarios_estudiante: "" });
      loadEntregas();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleCalificar = async (e) => {
    e.preventDefault();
    if (!tokens?.access) return;
    setStatus({ type: "loading", message: "Calificando entrega..." });
    try {
      await apiFetch(`/Academico/entregas/${calificacion.id}/calificar/`, {
        method: "POST",
        token: tokens.access,
        body: {
          nota: calificacion.nota,
          retroalimentacion_docente: calificacion.retroalimentacion_docente,
        },
      });
      setStatus({ type: "success", message: "Calificación registrada." });
      setCalificacion({ id: "", nota: "", retroalimentacion_docente: "" });
      loadEntregas();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className="card">
      <p className="eyebrow">Entregas</p>
      <h2>Subir y calificar</h2>
      <p className="hint">
        {canGrade
          ? "Docentes califican entregas y registran notas finales."
          : "Solo los docentes pueden registrar entregas y calificaciones."}
      </p>
      <div className="grid two">
        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>ID Tarea</span>
            <input name="tarea" value={form.tarea} onChange={(e) => setForm({ ...form, tarea: e.target.value })} required disabled={disabled} />
          </label>
          <label className="field">
            <span>ID Estudiante</span>
            <input name="estudiante" value={form.estudiante} onChange={(e) => setForm({ ...form, estudiante: e.target.value })} required disabled={disabled} />
          </label>
          <label className="field">
            <span>Archivo (ruta)</span>
            <input name="archivo_entrega" value={form.archivo_entrega} onChange={(e) => setForm({ ...form, archivo_entrega: e.target.value })} required disabled={disabled} />
          </label>
          <label className="field">
            <span>Comentarios</span>
            <textarea
              name="comentarios_estudiante"
              rows="2"
              value={form.comentarios_estudiante}
              onChange={(e) => setForm({ ...form, comentarios_estudiante: e.target.value })}
              disabled={disabled}
            />
          </label>
          <button type="submit" disabled={disabled}>
            Registrar entrega
          </button>
        </form>
        <form className="stack" onSubmit={handleCalificar}>
          <label className="field">
            <span>ID Entrega</span>
            <input name="id" value={calificacion.id} onChange={(e) => setCalificacion({ ...calificacion, id: e.target.value })} required disabled={disabled} />
          </label>
          <label className="field">
            <span>Nota</span>
            <input name="nota" type="number" step="0.01" value={calificacion.nota} onChange={(e) => setCalificacion({ ...calificacion, nota: e.target.value })} required disabled={disabled} />
          </label>
          <label className="field">
            <span>Retroalimentación</span>
            <textarea
              name="retroalimentacion_docente"
              rows="2"
              value={calificacion.retroalimentacion_docente}
              onChange={(e) => setCalificacion({ ...calificacion, retroalimentacion_docente: e.target.value })}
              disabled={disabled}
            />
          </label>
          <button type="submit" disabled={disabled}>
            Calificar
          </button>
        </form>
      </div>
      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}
      <div className="list compact">
        {entregas.map((entrega) => (
          <article key={entrega.id} className="list-item">
            <div>
              <p className="eyebrow">Tarea {entrega.tarea_titulo || entrega.tarea}</p>
              <h3>Estudiante {entrega.estudiante_nombre || entrega.estudiante}</h3>
              <p>{entrega.comentarios_estudiante}</p>
            </div>
            <div className="meta">
              <span className="pill">Estado: {entrega.estado_calificacion}</span>
              {entrega.nota && <span className="pill">Nota: {entrega.nota}</span>}
              {entrega.estado_entrega && <span className="pill">Entrega: {entrega.estado_entrega}</span>}
            </div>
          </article>
        ))}
        {!entregas.length && <p className="hint">No hay entregas cargadas.</p>}
      </div>
    </div>
  );
}