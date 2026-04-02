import { useState, useEffect } from 'react';
import { entregasAPI } from '../services/api';

export default function CalificarEntrega({ entrega, tarea, onGuardar, onCerrar }) {
  const [formData, setFormData] = useState({
    nota: '',
    retroalimentacion_docente: ''
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [notaPonderada, setNotaPonderada] = useState(null);

  useEffect(() => {
    if (entrega) {
      setFormData({
        nota: entrega.nota !== null ? entrega.nota : '',
        retroalimentacion_docente: entrega.retroalimentacion_docente || ''
      });
    }
  }, [entrega]);

  // Calcular nota ponderada cuando cambia la nota
  useEffect(() => {
    if (formData.nota && tarea) {
      const notaNum = parseFloat(formData.nota);
      const peso = parseFloat(tarea.peso_porcentual);
      const ponderada = (notaNum * peso) / 100;
      setNotaPonderada(ponderada.toFixed(2));
    } else {
      setNotaPonderada(null);
    }
  }, [formData.nota, tarea]);

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

    if (!formData.nota || formData.nota === '') {
      nuevosErrores.nota = 'La nota es obligatoria';
    } else {
      const nota = parseFloat(formData.nota);
      if (isNaN(nota) || nota < 0 || nota > 5) {
        nuevosErrores.nota = 'La nota debe estar entre 0 y 5';
      }
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

      await entregasAPI.calificar(
        entrega.id,
        parseFloat(formData.nota),
        formData.retroalimentacion_docente
      );

      alert('Calificación guardada correctamente. El estudiante recibirá una notificación por email.');
      onGuardar();
    } catch (err) {
      alert('Error al guardar calificación: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Calificar Entrega</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Información de la entrega */}
          <div className="entrega-info">
            <h3>{tarea.titulo}</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Estudiante:</span>
                <span className="value">{entrega.estudiante_nombre}</span>
              </div>
              <div className="info-item">
                <span className="label">Peso de la tarea:</span>
                <span className="value">{tarea.peso_porcentual}%</span>
              </div>
              <div className="info-item">
                <span className="label">Fecha de entrega:</span>
                <span className="value">{new Date(entrega.fecha_entrega).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Archivo:</span>
                <span className="value">📎 {entrega.archivo_entrega}</span>
              </div>
            </div>

            {entrega.comentarios_estudiante && (
              <div className="comentario-estudiante">
                <strong>Comentarios del estudiante:</strong>
                <p>{entrega.comentarios_estudiante}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nota">
                Nota (0 - 5) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="nota"
                name="nota"
                value={formData.nota}
                onChange={handleChange}
                className={errores.nota ? 'error' : ''}
                min="0"
                max="5"
                step="0.1"
                placeholder="Ej: 4.5"
                autoFocus
              />
              {errores.nota && <span className="error-message">{errores.nota}</span>}

              {notaPonderada !== null && (
                <div className="nota-ponderada-info">
                  <p>
                    <strong>Nota ponderada:</strong> {notaPonderada} puntos
                    <br />
                    <small>
                      Cálculo: {formData.nota} × {tarea.peso_porcentual}% = {notaPonderada}
                    </small>
                  </p>
                  {parseFloat(formData.nota) >= 3.0 ? (
                    <span className="badge badge-success">✓ Aprobado</span>
                  ) : (
                    <span className="badge badge-danger">✗ Reprobado</span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="retroalimentacion_docente">
                Retroalimentación para el estudiante
              </label>
              <textarea
                id="retroalimentacion_docente"
                name="retroalimentacion_docente"
                value={formData.retroalimentacion_docente}
                onChange={handleChange}
                rows="6"
                placeholder="Escribe aquí tus comentarios, sugerencias de mejora, aspectos destacados, etc."
              />
              <p className="hint">
                Esta retroalimentación será enviada al estudiante junto con su nota.
              </p>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={onCerrar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Guardando...' : entrega.estado_calificacion === 'CALIFICADO' ? 'Actualizar Calificación' : 'Guardar Calificación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
