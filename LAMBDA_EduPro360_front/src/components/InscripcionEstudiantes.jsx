import { useState, useEffect } from 'react';
import { asignaturasAPI, usuariosAPI } from '../services/api';

export default function InscripcionEstudiantes({ asignatura, onActualizar, onCerrar }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [asignatura.id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataUsuarios, dataInscritos] = await Promise.all([
        usuariosAPI.listar(),
        asignaturasAPI.listarEstudiantes(asignatura.id)
      ]);

      const usuarios = dataUsuarios.results || dataUsuarios;
      const todosEstudiantes = usuarios.filter(u => u.rol?.nombre === 'Estudiante');
      setEstudiantes(todosEstudiantes);
      setInscritos(dataInscritos.estudiantes || []);
    } catch (err) {
      alert('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeleccion = (estudianteId) => {
    setSeleccionados(prev => {
      if (prev.includes(estudianteId)) {
        return prev.filter(id => id !== estudianteId);
      } else {
        return [...prev, estudianteId];
      }
    });
  };

  const handleInscribir = async () => {
    if (seleccionados.length === 0) {
      alert('Seleccione al menos un estudiante');
      return;
    }

    try {
      setProcesando(true);
      const response = await asignaturasAPI.inscribirEstudiantes(asignatura.id, seleccionados);

      const mensaje = [
        `✅ ${response.inscritos_nuevos.length} estudiante(s) inscrito(s)`,
        response.ya_inscritos.length > 0 ? `ℹ️ ${response.ya_inscritos.length} ya estaban inscritos` : ''
      ].filter(Boolean).join('\n');

      alert(mensaje);

      setSeleccionados([]);
      await cargarDatos();
      onActualizar();
    } catch (err) {
      alert('Error al inscribir estudiantes: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleDesinscribir = async (estudianteId) => {
    if (!confirm('¿Está seguro de desinscribir a este estudiante?')) return;

    try {
      setProcesando(true);
      await asignaturasAPI.desinscribirEstudiantes(asignatura.id, [estudianteId]);
      alert('Estudiante desinscrito correctamente');
      await cargarDatos();
      onActualizar();
    } catch (err) {
      alert('Error al desinscribir estudiante: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const estudiantesDisponibles = estudiantes.filter(est => {
    const yaInscrito = inscritos.some(i => i.id === est.id);
    if (yaInscrito) return false;

    if (busqueda) {
      const termino = busqueda.toLowerCase();
      return (
        est.username?.toLowerCase().includes(termino) ||
        est.email?.toLowerCase().includes(termino) ||
        est.first_name?.toLowerCase().includes(termino) ||
        est.last_name?.toLowerCase().includes(termino)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Inscripción de Estudiantes</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div className="inscripcion-info">
            <h3>{asignatura.nombre}</h3>
            <p><strong>Código:</strong> {asignatura.codigo}</p>
            <p><strong>Estudiantes inscritos:</strong> {inscritos.length}</p>
          </div>

          <div className="inscripcion-container">
            {/* Panel de disponibles */}
            <div className="estudiantes-panel">
              <div className="panel-header">
                <h4>Estudiantes Disponibles</h4>
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input-sm"
                />
              </div>

              <div className="estudiantes-list">
                {estudiantesDisponibles.length === 0 ? (
                  <p className="empty-message">
                    {busqueda ? 'No se encontraron estudiantes' : 'Todos los estudiantes están inscritos'}
                  </p>
                ) : (
                  estudiantesDisponibles.map(est => (
                    <label key={est.id} className="estudiante-item">
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(est.id)}
                        onChange={() => handleToggleSeleccion(est.id)}
                      />
                      <div className="estudiante-info">
                        <strong>
                          {est.first_name && est.last_name
                            ? `${est.first_name} ${est.last_name}`
                            : est.username}
                        </strong>
                        <small>{est.email}</small>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {seleccionados.length > 0 && (
                <div className="panel-footer">
                  <p>{seleccionados.length} seleccionado(s)</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleInscribir}
                    disabled={procesando}
                  >
                    {procesando ? 'Inscribiendo...' : '➕ Inscribir Seleccionados'}
                  </button>
                </div>
              )}
            </div>

            {/* Panel de inscritos */}
            <div className="estudiantes-panel">
              <div className="panel-header">
                <h4>Estudiantes Inscritos ({inscritos.length})</h4>
              </div>

              <div className="estudiantes-list">
                {inscritos.length === 0 ? (
                  <p className="empty-message">No hay estudiantes inscritos</p>
                ) : (
                  inscritos.map(est => (
                    <div key={est.id} className="estudiante-item inscrito">
                      <div className="estudiante-info">
                        <strong>
                          {est.first_name && est.last_name
                            ? `${est.first_name} ${est.last_name}`
                            : est.username}
                        </strong>
                        <small>{est.email}</small>
                      </div>
                      <button
                        className="btn-icon-sm btn-danger"
                        onClick={() => handleDesinscribir(est.id)}
                        disabled={procesando}
                        title="Desinscribir"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
