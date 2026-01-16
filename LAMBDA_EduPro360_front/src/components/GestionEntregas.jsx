import { useState, useEffect } from 'react';
import { entregasAPI, tareasAPI, asignaturasAPI } from '../services/api';
import CalificarEntrega from './CalificarEntrega';
import '../styles/GestionEntregas.css';

export default function GestionEntregas({ onCerrar }) {
  const [entregas, setEntregas] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [asignaturaFiltro, setAsignaturaFiltro] = useState('');
  const [tareaFiltro, setTareaFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todas'); // todas, pendientes, calificadas
  const [busqueda, setBusqueda] = useState('');

  // Estado para modal de calificación
  const [entregaCalificar, setEntregaCalificar] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataEntregas, dataTareas, dataAsignaturas] = await Promise.all([
        entregasAPI.listar(),
        tareasAPI.listar(),
        asignaturasAPI.listar()
      ]);

      setEntregas(dataEntregas);
      setTareas(dataTareas);
      setAsignaturas(dataAsignaturas);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalificar = (entrega) => {
    setEntregaCalificar(entrega);
  };

  const handleCalificacionGuardada = async () => {
    setEntregaCalificar(null);
    await cargarDatos();
  };

  // Filtrar tareas según asignatura seleccionada
  const tareasFiltradas = asignaturaFiltro
    ? tareas.filter(t => t.asignatura === parseInt(asignaturaFiltro))
    : tareas;

  // Filtrar entregas
  const entregasFiltradas = entregas.filter(entrega => {
    // Filtro por tarea
    if (tareaFiltro && entrega.tarea !== parseInt(tareaFiltro)) return false;

    // Filtro por asignatura (a través de la tarea)
    if (asignaturaFiltro) {
      const tarea = tareas.find(t => t.id === entrega.tarea);
      if (!tarea || tarea.asignatura !== parseInt(asignaturaFiltro)) return false;
    }

    // Filtro por estado de calificación
    if (estadoFiltro === 'pendientes' && entrega.estado_calificacion !== 'SIN_CALIFICAR') return false;
    if (estadoFiltro === 'calificadas' && entrega.estado_calificacion !== 'CALIFICADO') return false;

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      return (
        entrega.estudiante_nombre?.toLowerCase().includes(termino) ||
        entrega.tarea_titulo?.toLowerCase().includes(termino) ||
        entrega.comentarios_estudiante?.toLowerCase().includes(termino)
      );
    }

    return true;
  });

  // Agrupar entregas por tarea
  const entregasAgrupadas = entregasFiltradas.reduce((acc, entrega) => {
    const tareaId = entrega.tarea;
    if (!acc[tareaId]) {
      const tarea = tareas.find(t => t.id === tareaId);
      const asignatura = asignaturas.find(a => a.id === tarea?.asignatura);
      acc[tareaId] = {
        tarea,
        asignatura,
        entregas: []
      };
    }
    acc[tareaId].entregas.push(entrega);
    return acc;
  }, {});

  // Calcular estadísticas por tarea
  const calcularEstadisticas = (entregas) => {
    const total = entregas.length;
    const calificadas = entregas.filter(e => e.estado_calificacion === 'CALIFICADO').length;
    const pendientes = total - calificadas;
    const promedio = calificadas > 0
      ? entregas
          .filter(e => e.nota !== null)
          .reduce((sum, e) => sum + parseFloat(e.nota), 0) / calificadas
      : 0;

    return { total, calificadas, pendientes, promedio };
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-xlarge">
          <div className="loading">Cargando entregas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-xlarge" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de Entregas y Calificaciones</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="gestion-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por estudiante o tarea..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filters-row">
            <select
              value={asignaturaFiltro}
              onChange={(e) => {
                setAsignaturaFiltro(e.target.value);
                setTareaFiltro(''); // Limpiar filtro de tarea
              }}
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
              value={tareaFiltro}
              onChange={(e) => setTareaFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las tareas</option>
              {tareasFiltradas.map(tarea => (
                <option key={tarea.id} value={tarea.id}>
                  {tarea.titulo}
                </option>
              ))}
            </select>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="todas">Todos los estados</option>
              <option value="pendientes">Pendientes</option>
              <option value="calificadas">Calificadas</option>
            </select>
          </div>
        </div>

        <div className="entregas-container">
          {Object.keys(entregasAgrupadas).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              No se encontraron entregas
            </div>
          ) : (
            Object.values(entregasAgrupadas).map(({ tarea, asignatura, entregas: entregasGrupo }) => {
              const stats = calcularEstadisticas(entregasGrupo);

              return (
                <div key={tarea.id} className="tarea-grupo">
                  <div className="tarea-grupo-header">
                    <div>
                      <h3>{tarea.titulo}</h3>
                      <p className="tarea-info">
                        {asignatura.nombre} • {tarea.peso_porcentual}% • Vence: {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="estadisticas">
                      <div className="stat-item">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Entregas</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value calificadas">{stats.calificadas}</span>
                        <span className="stat-label">Calificadas</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value pendientes">{stats.pendientes}</span>
                        <span className="stat-label">Pendientes</span>
                      </div>
                      {stats.calificadas > 0 && (
                        <div className="stat-item">
                          <span className="stat-value promedio">{stats.promedio.toFixed(2)}</span>
                          <span className="stat-label">Promedio</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="entregas-tabla">
                    <table>
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Fecha Entrega</th>
                          <th>Archivo</th>
                          <th>Nota</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entregasGrupo.map(entrega => (
                          <tr key={entrega.id} className={entrega.estado_calificacion === 'SIN_CALIFICAR' ? 'pendiente' : ''}>
                            <td>
                              <strong>{entrega.estudiante_nombre}</strong>
                              {entrega.comentarios_estudiante && (
                                <p className="comentario">{entrega.comentarios_estudiante}</p>
                              )}
                            </td>
                            <td>{new Date(entrega.fecha_entrega).toLocaleString()}</td>
                            <td>
                              <span className="archivo-badge">📎 {entrega.archivo_entrega}</span>
                            </td>
                            <td>
                              {entrega.nota !== null ? (
                                <span className={`nota-badge ${entrega.nota >= 3.0 ? 'aprobado' : 'reprobado'}`}>
                                  {parseFloat(entrega.nota).toFixed(2)}
                                </span>
                              ) : (
                                <span className="sin-nota">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${entrega.estado_calificacion === 'CALIFICADO' ? 'badge-success' : 'badge-warning'}`}>
                                {entrega.estado_calificacion === 'CALIFICADO' ? 'Calificada' : 'Pendiente'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-sm btn-primary"
                                onClick={() => handleCalificar(entrega)}
                              >
                                {entrega.estado_calificacion === 'CALIFICADO' ? '✏️ Editar' : '✅ Calificar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

      {/* Modal de Calificación */}
      {entregaCalificar && (
        <CalificarEntrega
          entrega={entregaCalificar}
          tarea={tareas.find(t => t.id === entregaCalificar.tarea)}
          onGuardar={handleCalificacionGuardada}
          onCerrar={() => setEntregaCalificar(null)}
        />
      )}
    </div>
  );
}
