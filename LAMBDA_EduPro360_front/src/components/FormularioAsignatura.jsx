import { useState } from "react";
import { apiFetch } from "../utils/api";

export default function FormularioAsignatura({ docentes, estudiantes, tokens, onAsignaturaCreada }) {
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    docente_responsable: "",
    periodo_academico: "",
    estudiantes: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEstudiantesChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setFormData(prev => ({ ...prev, estudiantes: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/asignaturas/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          docente_responsable: parseInt(formData.docente_responsable),
        }),
      });

      alert(`Asignatura "${response.nombre}" creada exitosamente`);
      setFormData({
        nombre: "",
        codigo: "",
        descripcion: "",
        docente_responsable: "",
        periodo_academico: "",
        estudiantes: [],
      });
      onAsignaturaCreada(response);
    } catch (err) {
      setError(err.message || "Error al crear la asignatura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-registrar">
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="nombre">Nombre de la Asignatura *</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Matemáticas I"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="codigo">Código de la Asignatura *</label>
        <input
          type="text"
          id="codigo"
          name="codigo"
          value={formData.codigo}
          onChange={handleChange}
          placeholder="Ej: MAT-101"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Descripción de la asignatura..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="periodo_academico">Periodo Académico *</label>
        <input
          type="text"
          id="periodo_academico"
          name="periodo_academico"
          value={formData.periodo_academico}
          onChange={handleChange}
          placeholder="Ej: 2024-1, 2024-2"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="docente_responsable">Docente Responsable *</label>
        <select
          id="docente_responsable"
          name="docente_responsable"
          value={formData.docente_responsable}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione un docente...</option>
          {docentes.map((docente) => (
            <option key={docente.id} value={docente.id}>
              {docente.first_name} {docente.last_name} ({docente.email})
            </option>
          ))}
        </select>
        {docentes.length === 0 && (
          <p className="hint">⚠️ No hay docentes registrados. Primero debe registrar docentes.</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="estudiantes">Estudiantes Inscritos</label>
        <select
          id="estudiantes"
          name="estudiantes"
          multiple
          value={formData.estudiantes}
          onChange={handleEstudiantesChange}
          size="6"
        >
          {estudiantes.map((estudiante) => (
            <option key={estudiante.id} value={estudiante.id}>
              {estudiante.first_name} {estudiante.last_name} ({estudiante.email})
            </option>
          ))}
        </select>
        <p className="hint">
          💡 Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples estudiantes
        </p>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Creando..." : "✓ Crear Asignatura"}
      </button>
    </form>
  );
}
