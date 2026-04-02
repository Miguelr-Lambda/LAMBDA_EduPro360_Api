import { useState, useEffect } from 'react';
import { tareasAPI } from '../services/api';

export default function FormularioTarea({ tarea, asignaturas, tareasExistentes, onGuardar, onCerrar }) {
  const [formData, setFormData] = useState({
    asignatura: '',
    titulo: '',
    descripcion: '',
    fecha_publicacion: '',
    fecha_vencimiento: '',
    peso_porcentual: '',
    tipo_tarea: 'TAREA',
    estado: 'ACTIVA'
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [pesoInfo, setPesoInfo] = useState({ usado: 0, disponible: 100 });

  useEffect(() => {
    if (tarea) {
      setFormData({
        asignatura: tarea.asignatura,
        titulo: tarea.titulo || '',
        descripcion: tarea.descripcion || '',
        fecha_publicacion: tarea.fecha_publicacion || '',
        fecha_vencimiento: tarea.fecha_vencimiento || '',
        peso_porcentual: tarea.peso_porcentual || '',
        tipo_tarea: tarea.tipo_tarea || 'TAREA',
        estado: tarea.estado || 'ACTIVA'
      });
    }
  }, [tarea]);

  // Calcular peso disponible cuando cambia la asignatura
  useEffect(() => {
    if (formData.asignatura) {
      calcularPesoDisponible(formData.asignatura);
    }
  }, [formData.asignatura, tareasExistentes]);

  const calcularPesoDisponible = (asignaturaId) => {
    // Filtrar tareas de la asignatura seleccionada (excluyendo la tarea actual si estamos editando)
    const tareasAsignatura = tareasExistentes.filter(
      t => t.asignatura === parseInt(asignaturaId) && (!tarea || t.id !== tarea.id)
    );

    const pesoUsado = tareasAsignatura.reduce(
      (sum, t) => sum + parseFloat(t.peso_porcentual || 0),
      0
    );

    setPesoInfo({
      usado: pesoUsado,
      disponible: 100 - pesoUsado
    });
  };

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

    if (!formData.asignatura) {
      nuevosErrores.asignatura = 'Debe seleccionar una asignatura';
    }

    if (!formData.titulo.trim()) {
      nuevosErrores.titulo = 'El título es obligatorio';
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.fecha_publicacion) {
      nuevosErrores.fecha_publicacion = 'La fecha de publicación es obligatoria';
    }

    if (!formData.fecha_vencimiento) {
      nuevosErrores.fecha_vencimiento = 'La fecha de vencimiento es obligatoria';
    }

    // Validar que fecha de vencimiento >= fecha de publicación
    if (formData.fecha_publicacion && formData.fecha_vencimiento) {
      if (new Date(formData.fecha_vencimiento) < new Date(formData.fecha_publicacion)) {
        nuevosErrores.fecha_vencimiento = 'La fecha de vencimiento debe ser posterior a la publicación';
      }
    }

    if (!formData.peso_porcentual || formData.peso_porcentual <= 0) {
      nuevosErrores.peso_porcentual = 'El peso debe ser mayor a 0';
    }

    // Validar que el peso no exceda el disponible
    const pesoActual = parseFloat(formData.peso_porcentual || 0);
    if (pesoActual > pesoInfo.disponible) {
      nuevosErrores.peso_porcentual = `El peso no puede exceder ${pesoInfo.disponible.toFixed(1)}%`;
    }

    // Validar que la suma total sea exactamente 100%
    const pesoTotal = pesoInfo.usado + pesoActual;
    if (pesoTotal > 100) {
      nuevosErrores.peso_porcentual = `La suma total sería ${pesoTotal.toFixed(1)}%. Debe ser exactamente 100%`;
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
        asignatura: parseInt(formData.asignatura),
        peso_porcentual: parseFloat(formData.peso_porcentual)
      };

      if (tarea) {
        // Actualizar
        await tareasAPI.actualizar(tarea.id, datos);
        alert('Tarea actualizada correctamente');
      } else {
        // Crear
        await tareasAPI.crear(datos);
        alert('Tarea creada correctamente');
      }

      onGuardar();
    } catch (err) {
      alert('Error al guardar tarea: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tarea ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="asignatura">
              Asignatura <span className="required">*</span>
            </label>
            <select
              id="asignatura"
              name="asignatura"
              value={formData.asignatura}
              onChange={handleChange}
              className={errores.asignatura ? 'error' : ''}
            >
              <option value="">Seleccione una asignatura</option>
              {asignaturas.map(asig => (
                <option key={asig.id} value={asig.id}>
                  {asig.nombre} ({asig.codigo}) - {asig.periodo_academico}
                </option>
              ))}
            </select>
            {errores.asignatura && <span className="error-message">{errores.asignatura}</span>}

            {formData.asignatura && (
              <div className="peso-info-box">
                <p>
                  <strong>Plan de Evaluación:</strong> {pesoInfo.usado.toFixed(1)}% usado •{' '}
                  <span className={pesoInfo.disponible > 0 ? 'text-success' : 'text-danger'}>
                    {pesoInfo.disponible.toFixed(1)}% disponible
                  </span>
                </p>
                {pesoInfo.disponible === 0 && (
                  <p className="text-warning">
                    ⚠️ El plan de evaluación está completo (100%). Para agregar esta tarea, edite o elimine otra.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="titulo">
              Título <span className="required">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className={errores.titulo ? 'error' : ''}
              placeholder="Ej: Taller 1 - Variables y Tipos de Datos"
            />
            {errores.titulo && <span className="error-message">{errores.titulo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">
              Descripción <span className="required">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className={errores.descripcion ? 'error' : ''}
              rows="4"
              placeholder="Describe la tarea, objetivos de aprendizaje, entregables, etc."
            />
            {errores.descripcion && <span className="error-message">{errores.descripcion}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo_tarea">Tipo</label>
              <select
                id="tipo_tarea"
                name="tipo_tarea"
                value={formData.tipo_tarea}
                onChange={handleChange}
              >
                <option value="TAREA">Tarea</option>
                <option value="EXAMEN">Examen</option>
              </select>
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
              <label htmlFor="fecha_publicacion">
                Fecha de Publicación <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fecha_publicacion"
                name="fecha_publicacion"
                value={formData.fecha_publicacion}
                onChange={handleChange}
                className={errores.fecha_publicacion ? 'error' : ''}
              />
              {errores.fecha_publicacion && (
                <span className="error-message">{errores.fecha_publicacion}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="fecha_vencimiento">
                Fecha de Vencimiento <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fecha_vencimiento"
                name="fecha_vencimiento"
                value={formData.fecha_vencimiento}
                onChange={handleChange}
                className={errores.fecha_vencimiento ? 'error' : ''}
              />
              {errores.fecha_vencimiento && (
                <span className="error-message">{errores.fecha_vencimiento}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="peso_porcentual">
              Peso Porcentual (%) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="peso_porcentual"
              name="peso_porcentual"
              value={formData.peso_porcentual}
              onChange={handleChange}
              className={errores.peso_porcentual ? 'error' : ''}
              min="0"
              max="100"
              step="0.1"
              placeholder="Ej: 15"
            />
            {errores.peso_porcentual && (
              <span className="error-message">{errores.peso_porcentual}</span>
            )}
            {formData.peso_porcentual && formData.asignatura && (
              <p className="hint">
                Suma total: {(pesoInfo.usado + parseFloat(formData.peso_porcentual || 0)).toFixed(1)}%
                {(pesoInfo.usado + parseFloat(formData.peso_porcentual || 0)) === 100 && (
                  <span className="text-success"> ✓ Plan completo</span>
                )}
              </p>
            )}
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Guardando...' : tarea ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
