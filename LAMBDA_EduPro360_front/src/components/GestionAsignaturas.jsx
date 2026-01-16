import { useState, useEffect } from 'react';
import { asignaturasAPI, usuariosAPI } from '../services/api';
import FormularioAsignatura from './FormularioAsignatura';
import InscripcionEstudiantes from './InscripcionEstudiantes';
import '../styles/GestionAsignaturas.css';

export default function GestionAsignaturas({ onCerrar }) {
  const [asignaturas, setAsignaturas] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas, activas, inactivas
  const [busqueda, setBusqueda] = useState('');

  // Estados para modales
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [asignaturaEditar, setAsignaturaEditar] = useState(null);
  const [mostrarInscripcion, setMostrarInscripcion] = useState(null);
  const [estudiantesAsignatura, setEstudiantesAsignatura] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataAsignaturas, dataUsuarios] = await Promise.all([
        asignaturasAPI.listar(),
        usuariosAPI.listar()
      ]);

      setAsignaturas(dataAsignaturas);

      // Filtrar solo docentes
      const usuarios = dataUsuarios.results || dataUsuarios;
      setDocentes(usuarios.filter(u => u.rol?.nombre === 'Docente'));

      setError(null);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = () => {
    setAsignaturaEditar(null);
    setMostrarFormulario(true);
  };

  const handleEditar = (asignatura) => {
    setAsignaturaEditar(asignatura);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta asignatura? Esta acción no se puede deshacer.')) return;
    try {
      await asignaturasAPI.eliminar(id);
      await cargarDatos();
      alert('Asignatura eliminada correctamente');
    } catch (err) {
      alert('Error al eliminar asignatura: ' + err.message);
    }
  };

  const handleGuardado = async () => {
    setMostrarFormulario(false);
    setAsignaturaEditar(null);
    await cargarDatos();
  };

  const handleVerEstudiantes = async (asignatura) => {
    try {
      const data = await asignaturasAPI.listarEstudiantes(asignatura.id);
      setEstudiantesAsignatura({
        asignatura: data.asignatura,
        codigo: data.codigo,
        estudiantes: data.estudiantes
      });
    } catch (err) {
      alert('Error al cargar estudiantes: ' + err.message);
    }
  };

  const handleInscribir = (asignatura) => {
    setMostrarInscripcion(asignatura);
  };

  const asignaturasFiltradas = asignaturas.filter(asignatura => {
    // Filtro por estado
    if (filtro === 'activas' && asignatura.estado !== 'ACTIVA') return false;
    if (filtro === 'inactivas' && asignatura.estado !== 'INACTIVA') return false;

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      return (
        asignatura.nombre?.toLowerCase().includes(termino) ||
        asignatura.codigo?.toLowerCase().includes(termino) ||
        asignatura.periodo_academico?.toLowerCase().includes(termino) ||
        asignatura.docente_nombre?.toLowerCase().includes(termino)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-large">
          <div className="loading">Cargando asignaturas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-xlarge" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de Asignaturas</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="gestion-controls">
          <div className="controls-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por nombre, código, periodo o docente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCrear}>
              ➕ Nueva Asignatura
            </button>
          </div>

          <div className="filter-tabs">
            <button
              className={filtro === 'todas' ? 'active' : ''}
              onClick={() => setFiltro('todas')}
            >
              Todas ({asignaturas.length})
            </button>
            <button
              className={filtro === 'activas' ? 'active' : ''}
              onClick={() => setFiltro('activas')}
            >
              Activas ({asignaturas.filter(a => a.estado === 'ACTIVA').length})
            </button>
            <button
              className={filtro === 'inactivas' ? 'active' : ''}
              onClick={() => setFiltro('inactivas')}
            >
              Inactivas ({asignaturas.filter(a => a.estado === 'INACTIVA').length})
            </button>
          </div>
        </div>

        <div className="asignaturas-grid">
          {asignaturasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              No se encontraron asignaturas
            </div>
          ) : (
            asignaturasFiltradas.map(asignatura => (
              <div key={asignatura.id} className="asignatura-card">
                <div className="asignatura-header">
                  <div>
                    <h3>{asignatura.nombre}</h3>
                    <p className="codigo">Código: {asignatura.codigo}</p>
                  </div>
                  <span className={`badge ${asignatura.estado === 'ACTIVA' ? 'badge-success' : 'badge-danger'}`}>
                    {asignatura.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="asignatura-info">
                  <div className="info-item">
                    <span className="label">👨‍🏫 Docente:</span>
                    <span className="value">{asignatura.docente_nombre || 'Sin asignar'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">📅 Periodo:</span>
                    <span className="value">{asignatura.periodo_academico}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">👥 Estudiantes:</span>
                    <span className="value">{asignatura.estudiantes?.length || 0}</span>
                  </div>
                </div>

                {asignatura.descripcion && (
                  <p className="descripcion">{asignatura.descripcion}</p>
                )}

                <div className="asignatura-actions">
                  <button
                    className="btn-sm btn-info"
                    onClick={() => handleVerEstudiantes(asignatura)}
                    title="Ver estudiantes"
                  >
                    👥 Estudiantes
                  </button>
                  <button
                    className="btn-sm btn-primary"
                    onClick={() => handleInscribir(asignatura)}
                    title="Inscribir estudiantes"
                  >
                    ➕ Inscribir
                  </button>
                  <button
                    className="btn-sm btn-secondary"
                    onClick={() => handleEditar(asignatura)}
                    title="Editar"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-sm btn-danger"
                    onClick={() => handleEliminar(asignatura.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCerrar}>
            Cerrar
          </button>
          <button className="btn btn-primary" onClick={cargarDatos}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <FormularioAsignatura
          asignatura={asignaturaEditar}
          docentes={docentes}
          onGuardar={handleGuardado}
          onCerrar={() => {
            setMostrarFormulario(false);
            setAsignaturaEditar(null);
          }}
        />
      )}

      {/* Modal Inscripción */}
      {mostrarInscripcion && (
        <InscripcionEstudiantes
          asignatura={mostrarInscripcion}
          onActualizar={() => {
            cargarDatos();
            setMostrarInscripcion(null);
          }}
          onCerrar={() => setMostrarInscripcion(null)}
        />
      )}

      {/* Modal Ver Estudiantes */}
      {estudiantesAsignatura && (
        <div className="modal-overlay" onClick={() => setEstudiantesAsignatura(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Estudiantes Inscritos</h2>
              <button className="btn-close" onClick={() => setEstudiantesAsignatura(null)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p><strong>Asignatura:</strong> {estudiantesAsignatura.asignatura}</p>
              <p><strong>Código:</strong> {estudiantesAsignatura.codigo}</p>
              <p><strong>Total:</strong> {estudiantesAsignatura.estudiantes.length} estudiante(s)</p>

              <div className="estudiantes-lista">
                {estudiantesAsignatura.estudiantes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                    No hay estudiantes inscritos
                  </p>
                ) : (
                  <ul>
                    {estudiantesAsignatura.estudiantes.map(est => (
                      <li key={est.id}>
                        <strong>{est.first_name} {est.last_name}</strong>
                        <br />
                        <small>
                          {est.username} • {est.email}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEstudiantesAsignatura(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
