import { useState, useEffect } from 'react';
import { tareasAPI, asignaturasAPI } from '../services/api';
import FormularioTarea from './FormularioTarea';
import '../styles/GestionTareas.css';

export default function GestionTareas({ onCerrar }) {
  const [tareas, setTareas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [asignaturaFiltro, setAsignaturaFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Estados para modales
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tareaEditar, setTareaEditar] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataTareas, dataAsignaturas] = await Promise.all([
        tareasAPI.listar(),
        asignaturasAPI.listar()
      ]);

      setTareas(dataTareas);
      setAsignaturas(dataAsignaturas);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = () => {
    setTareaEditar(null);
    setMostrarFormulario(true);
  };

  const handleEditar = (tarea) => {
    setTareaEditar(tarea);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) return;
    try {
      await tareasAPI.eliminar(id);
      await cargarDatos();
      alert('Tarea eliminada correctamente');
    } catch (err) {
      alert('Error al eliminar tarea: ' + err.message);
    }
  };

  const handleGuardado = async () => {
    setMostrarFormulario(false);
    setTareaEditar(null);
    await cargarDatos();
  };

  const tareasFiltradas = tareas.filter(tarea => {
    // Filtro por asignatura
    if (asignaturaFiltro && tarea.asignatura !== parseInt(asignaturaFiltro)) return false;

    // Filtro por estado
    if (estadoFiltro === 'activas' && tarea.estado !== 'ACTIVA') return false;
    if (estadoFiltro === 'inactivas' && tarea.estado !== 'INACTIVA') return false;

    // Filtro por tipo
    if (tipoFiltro === 'tareas' && tarea.tipo_tarea !== 'TAREA') return false;
    if (tipoFiltro === 'examenes' && tarea.tipo_tarea !== 'EXAMEN') return false;

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      return (
        tarea.titulo?.toLowerCase().includes(termino) ||
        tarea.descripcion?.toLowerCase().includes(termino) ||
        tarea.asignatura_nombre?.toLowerCase().includes(termino)
      );
    }

    return true;
  });

  // Agrupar tareas por asignatura
  const tareasAgrupadas = tareasFiltradas.reduce((acc, tarea) => {
    const asignaturaId = tarea.asignatura;
    if (!acc[asignaturaId]) {
      acc[asignaturaId] = {
        asignatura: asignaturas.find(a => a.id === asignaturaId),
        tareas: []
      };
    }
    acc[asignaturaId].tareas.push(tarea);
    return acc;
  }, {});

  // Calcular suma de pesos por asignatura
  const calcularPesoTotal = (asignaturaId) => {
    const tareasAsignatura = tareas.filter(t => t.asignatura === asignaturaId);
    return tareasAsignatura.reduce((sum, t) => sum + parseFloat(t.peso_porcentual || 0), 0);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-xlarge">
          <div className="loading">Cargando tareas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-xlarge" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de Tareas y Exámenes</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="gestion-controls">
          <div className="controls-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCrear}>
              ➕ Nueva Tarea
            </button>
          </div>

          <div className="filters-row">
            <select
              value={asignaturaFiltro}
              onChange={(e) => setAsignaturaFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las asignaturas</option>
              {asignaturas.map(asig => (
                <option key={asig.id} value={asig.id}>
                  {asig.nombre} ({asig.codigo})
                </option>
              ))}
            </select>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="todas">Todos los estados</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
            </select>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los tipos</option>
              <option value="tareas">Tareas</option>
              <option value="examenes">Exámenes</option>
            </select>
          </div>
        </div>

        <div className="tareas-container">
          {Object.keys(tareasAgrupadas).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              No se encontraron tareas
            </div>
          ) : (
            Object.values(tareasAgrupadas).map(({ asignatura, tareas: tareasGrupo }) => {
              const pesoTotal = calcularPesoTotal(asignatura.id);
              const pesoCompleto = pesoTotal === 100;

              return (
                <div key={asignatura.id} className="asignatura-grupo">
                  <div className="asignatura-grupo-header">
                    <div>
                      <h3>{asignatura.nombre}</h3>
                      <p className="codigo">{asignatura.codigo} • {asignatura.periodo_academico}</p>
                    </div>
                    <div className="peso-total">
                      <span className={`peso-badge ${pesoCompleto ? 'completo' : 'incompleto'}`}>
                        {pesoCompleto ? '✓' : '⚠'} Peso total: {pesoTotal.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="tareas-lista">
                    {tareasGrupo.map(tarea => (
                      <div key={tarea.id} className="tarea-card">
                        <div className="tarea-header">
                          <div>
                            <h4>{tarea.titulo}</h4>
                            <div className="tarea-badges">
                              <span className={`badge ${tarea.tipo_tarea === 'EXAMEN' ? 'badge-warning' : 'badge-info'}`}>
                                {tarea.tipo_tarea === 'EXAMEN' ? '📝 Examen' : '📄 Tarea'}
                              </span>
                              <span className={`badge ${tarea.estado === 'ACTIVA' ? 'badge-success' : 'badge-danger'}`}>
                                {tarea.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
                              </span>
                              <span className="badge badge-secondary">
                                {tarea.peso_porcentual}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="tarea-descripcion">{tarea.descripcion}</p>

                        <div className="tarea-fechas">
                          <div className="fecha-item">
                            <span className="label">📅 Publicación:</span>
                            <span className="value">{new Date(tarea.fecha_publicacion).toLocaleDateString()}</span>
                          </div>
                          <div className="fecha-item">
                            <span className="label">⏰ Vencimiento:</span>
                            <span className="value">{new Date(tarea.fecha_vencimiento).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="tarea-actions">
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => handleEditar(tarea)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => handleEliminar(tarea.id)}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
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
        <FormularioTarea
          tarea={tareaEditar}
          asignaturas={asignaturas}
          tareasExistentes={tareas}
          onGuardar={handleGuardado}
          onCerrar={() => {
            setMostrarFormulario(false);
            setTareaEditar(null);
          }}
        />
      )}
    </div>
  );
}
