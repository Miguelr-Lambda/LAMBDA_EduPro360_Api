import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AsignaturasPanel() {
  const { tokens } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nombre: "", codigo: "", descripcion: "", periodo_academico: "2025-1", docente_responsable: "" });
  const [status, setStatus] = useState(null);

  const disabled = !tokens?.access;

  const loadAsignaturas = async () => {
    if (!tokens?.access) return;
    try {
      const data = await apiFetch("/Academico/asignaturas/", { token: tokens.access });
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadAsignaturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) return;
    setStatus({ type: "loading", message: "Creando asignatura..." });
    try {
      await apiFetch("/Academico/asignaturas/", {
        method: "POST",
        token: tokens.access,
        body: {
          nombre: form.nombre,
          codigo: form.codigo,
          descripcion: form.descripcion,
          periodo_academico: form.periodo_academico,
          docente_responsable: Number(form.docente_responsable),
        },
      });
      setStatus({ type: "success", message: "Asignatura creada. Refrescando lista." });
      setForm({ nombre: "", codigo: "", descripcion: "", periodo_academico: form.periodo_academico, docente_responsable: form.docente_responsable });
      loadAsignaturas();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className="card">
      <p className="eyebrow">Asignaturas</p>
      <h2>Crear y listar</h2>
      <p className="hint">
        Necesitas el identificador del docente responsable y el periodo académico. Los estudiantes pueden añadirse desde el backend si se requiere control detallado.
      </p>
      <form className="grid two" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre</span>
          <input name="nombre" value={form.nombre} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field">
          <span>Código</span>
          <input name="codigo" value={form.codigo} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field">
          <span>Periodo académico</span>
          <input name="periodo_academico" value={form.periodo_academico} onChange={handleChange} disabled={disabled} />
        </label>
        <label className="field">
          <span>ID docente responsable</span>
          <input name="docente_responsable" value={form.docente_responsable} onChange={handleChange} required disabled={disabled} />
        </label>
        <label className="field full">
          <span>Descripción</span>
          <textarea name="descripcion" rows="2" value={form.descripcion} onChange={handleChange} disabled={disabled} />
        </label>
        <button className="full" type="submit" disabled={disabled}>
          Crear asignatura
        </button>
      </form>
      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}
      <div className="list">
        {items.map((asignatura) => (
          <article key={asignatura.id} className="list-item">
            <div>
              <p className="eyebrow">{asignatura.periodo_academico}</p>
              <h3>{asignatura.nombre}</h3>
              <p>{asignatura.descripcion}</p>
            </div>
            <div className="meta">
              <span className="pill">Código: {asignatura.codigo}</span>
              {asignatura.docente_nombre && <span className="pill">Docente: {asignatura.docente_nombre}</span>}
            </div>
          </article>
        ))}
        {!items.length && <p className="hint">No hay asignaturas todavía.</p>}
      </div>
    </div>
  );
}