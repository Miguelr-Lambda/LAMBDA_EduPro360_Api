import { useState, useEffect } from 'react';
import { asignaturasAPI } from '../services/api';

export default function FormularioAsignatura({ asignatura, docentes, onGuardar, onCerrar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    estado: 'ACTIVA',
    docente_responsable: '',
    periodo_academico: ''
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (asignatura) {
      setFormData({
        nombre: asignatura.nombre || '',
        codigo: asignatura.codigo || '',
        descripcion: asignatura.descripcion || '',
        estado: asignatura.estado || 'ACTIVA',
        docente_responsable: asignatura.docente_responsable || '',
        periodo_academico: asignatura.periodo_academico || ''
      });
    }
  }, [asignatura]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!formData.codigo.trim()) {
      nuevosErrores.codigo = 'El código es obligatorio';
    }

    if (!formData.docente_responsable) {
      nuevosErrores.docente_responsable = 'Debe seleccionar un docente';
    }

    if (!formData.periodo_academico.trim()) {
      nuevosErrores.periodo_academico = 'El periodo académico es obligatorio';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validar()) {
      return;
    }

    try {
      setEnviando(true);

      const datos = {
        ...formData,
        docente_responsable: parseInt(formData.docente_responsable),
        estudiantes: asignatura?.estudiantes || []
      };

      if (asignatura) {
        // Actualizar
        await asignaturasAPI.actualizar(asignatura.id, datos);
        alert('Asignatura actualizada correctamente');
      } else {
        // Crear
        await asignaturasAPI.crear(datos);
        alert('Asignatura creada correctamente');
      }

      onGuardar();
    } catch (err) {
      alert('Error al guardar asignatura: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{asignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="nombre">
              Nombre de la Asignatura <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errores.nombre ? 'error' : ''}
              placeholder="Ej: Programación Web Avanzada"
            />
            {errores.nombre && <span className="error-message">{errores.nombre}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo">
                Código <span className="required">*</span>
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                className={errores.codigo ? 'error' : ''}
                placeholder="Ej: PWA-2024-01"
              />
              {errores.codigo && <span className="error-message">{errores.codigo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="docente_responsable">
                Docente Responsable <span className="required">*</span>
              </label>
              <select
                id="docente_responsable"
                name="docente_responsable"
                value={formData.docente_responsable}
                onChange={handleChange}
                className={errores.docente_responsable ? 'error' : ''}
              >
                <option value="">Seleccione un docente</option>
                {docentes.map(docente => (
                  <option key={docente.id} value={docente.id}>
                    {docente.first_name && docente.last_name
                      ? `${docente.first_name} ${docente.last_name}`
                      : docente.username}
                  </option>
                ))}
              </select>
              {errores.docente_responsable && (
                <span className="error-message">{errores.docente_responsable}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="periodo_academico">
                Periodo Académico <span className="required">*</span>
              </label>
              <input
                type="text"
                id="periodo_academico"
                name="periodo_academico"
                value={formData.periodo_academico}
                onChange={handleChange}
                className={errores.periodo_academico ? 'error' : ''}
                placeholder="Ej: 2024-1"
              />
              {errores.periodo_academico && (
                <span className="error-message">{errores.periodo_academico}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="4"
              placeholder="Descripción opcional de la asignatura..."
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Guardando...' : asignatura ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
