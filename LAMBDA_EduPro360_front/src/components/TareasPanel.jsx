import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TareasPanel() {
  const { tokens } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [form, setForm] = useState({
    asignatura: "",
    titulo: "",
    descripcion: "",
    fecha_vencimiento: "",
    peso_porcentual: "100.00",
    tipo_tarea: "TAREA",
  });
  const [status, setStatus] = useState(null);

  const disabled = !tokens?.access;

  const loadTareas = async () => {
    if (!tokens?.access) return;
    try {
      const data = await apiFetch("/Academico/tareas/", { token: tokens.access });
      setTareas(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) return;
    setStatus({ type: "loading", message: "Publicando tarea..." });
    try {
      await apiFetch("/Academico/tareas/", {
        method: "POST",
        token: tokens.access,
        body: {
          asignatura: Number(form.asignatura),
          titulo: form.titulo,
          descripcion: form.descripcion,
          fecha_vencimiento: form.fecha_vencimiento,
          peso_porcentual: form.peso_porcentual,
          tipo_tarea: form.tipo_tarea,
        },
      });
      setStatus({ type: "success", message: "Tarea creada. Recuerda que el peso total por asignatura debe ser 100%." });
      setForm({ ...form, titulo: "", descripcion: "" });
      loadTareas();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className="card">
      <p className="eyebrow">Tareas y evaluaciones</p>
      <h2>Publicar tareas</h2>
      <p className="hint">El validador del backend exige que el plan de evaluación por asignatura sume 100%.</p>
      <form className="grid two" onSubmit={handleSubmit}>
        <label className="field">
          <span>ID de asignatura</span>
          <input name="asignatura" value={form.asignatura} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field">
          <span>Fecha de vencimiento</span>
          <input type="date" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field">
          <span>Título</span>
          <input name="titulo" value={form.titulo} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field">
          <span>Peso porcentual</span>
          <input name="peso_porcentual" type="number" step="0.01" value={form.peso_porcentual} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field">
          <span>Tipo</span>
          <select name="tipo_tarea" value={form.tipo_tarea} onChange={handleChange} disabled={disabled}>
            <option value="TAREA">Tarea</option>
            <option value="EXAMEN">Examen</option>
          </select>
        </label>
        <label className="field full">
          <span>Descripción</span>
          <textarea name="descripcion" rows="2" value={form.descripcion} onChange={handleChange} disabled={disabled} />
        </label>
        <button className="full" type="submit" disabled={disabled}>
          Publicar
        </button>
      </form>
      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}
      <div className="list">
        {tareas.map((tarea) => (
          <article key={tarea.id} className="list-item">
            <div>
              <p className="eyebrow">{tarea.asignatura_nombre || `Asignatura ${tarea.asignatura}`}</p>
              <h3>{tarea.titulo}</h3>
              <p>{tarea.descripcion}</p>
            </div>
            <div className="meta">
              <span className="pill">Vence: {tarea.fecha_vencimiento}</span>
              <span className="pill">Peso: {tarea.peso_porcentual}%</span>
              <span className="pill">Tipo: {tarea.tipo_tarea}</span>
            </div>
          </article>
        ))}
        {!tareas.length && <p className="hint">Aún no hay tareas registradas.</p>}
      </div>
    </div>
  );
}