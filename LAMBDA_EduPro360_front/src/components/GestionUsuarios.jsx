import { useState, useEffect } from 'react';
import { usuariosAPI, rolesAPI } from '../services/api';
import '../styles/GestionUsuarios.css';

export default function GestionUsuarios({ onCerrar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos'); // todos, activos, inactivos
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataUsuarios, dataRoles] = await Promise.all([
        usuariosAPI.listar(),
        rolesAPI.listar()
      ]);
      setUsuarios(dataUsuarios.results || dataUsuarios);
      setRoles(dataRoles.results || dataRoles);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivar = async (id) => {
    try {
      await usuariosAPI.activar(id);
      await cargarDatos();
      alert('Usuario activado correctamente');
    } catch (err) {
      alert('Error al activar usuario: ' + err.message);
    }
  };

  const handleDesactivar = async (id) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    try {
      await usuariosAPI.desactivar(id);
      await cargarDatos();
      alert('Usuario desactivado correctamente');
    } catch (err) {
      alert('Error al desactivar usuario: ' + err.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await usuariosAPI.eliminar(id);
      await cargarDatos();
      alert('Usuario eliminado correctamente');
    } catch (err) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  const handleEnviarBienvenida = async (id) => {
    try {
      await usuariosAPI.enviarBienvenida(id);
      alert('Email de bienvenida enviado correctamente');
    } catch (err) {
      alert('Error al enviar email: ' + err.message);
    }
  };

  const handleActualizarRol = async (id, nuevoRolId) => {
    try {
      await usuariosAPI.actualizarParcial(id, { rol: nuevoRolId });
      await cargarDatos();
      alert('Rol actualizado correctamente');
    } catch (err) {
      alert('Error al actualizar rol: ' + err.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    // Filtro por estado
    if (filtro === 'activos' && !usuario.activo) return false;
    if (filtro === 'inactivos' && usuario.activo) return false;

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      return (
        usuario.username?.toLowerCase().includes(termino) ||
        usuario.email?.toLowerCase().includes(termino) ||
        usuario.first_name?.toLowerCase().includes(termino) ||
        usuario.last_name?.toLowerCase().includes(termino) ||
        usuario.rol?.nombre?.toLowerCase().includes(termino)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-large">
          <div className="loading">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de Usuarios</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="gestion-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por nombre, email o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={filtro === 'todos' ? 'active' : ''}
              onClick={() => setFiltro('todos')}
            >
              Todos ({usuarios.length})
            </button>
            <button
              className={filtro === 'activos' ? 'active' : ''}
              onClick={() => setFiltro('activos')}
            >
              Activos ({usuarios.filter(u => u.activo).length})
            </button>
            <button
              className={filtro === 'inactivos' ? 'active' : ''}
              onClick={() => setFiltro('inactivos')}
            >
              Inactivos ({usuarios.filter(u => !u.activo).length})
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                  <tr key={usuario.id}>
                    <td>
                      <strong>{usuario.username}</strong>
                    </td>
                    <td>
                      {usuario.first_name && usuario.last_name
                        ? `${usuario.first_name} ${usuario.last_name}`
                        : '-'}
                    </td>
                    <td>{usuario.email || '-'}</td>
                    <td>
                      {editando === usuario.id ? (
                        <select
                          value={usuario.rol?.id || ''}
                          onChange={(e) => {
                            handleActualizarRol(usuario.id, parseInt(e.target.value));
                            setEditando(null);
                          }}
                          onBlur={() => setEditando(null)}
                          autoFocus
                        >
                          {roles.map(rol => (
                            <option key={rol.id} value={rol.id}>
                              {rol.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="rol-badge"
                          onClick={() => setEditando(usuario.id)}
                          style={{ cursor: 'pointer' }}
                          title="Click para editar"
                        >
                          {usuario.rol?.nombre || 'Sin rol'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${usuario.activo ? 'badge-success' : 'badge-danger'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {usuario.activo ? (
                          <button
                            className="btn-icon btn-warning"
                            onClick={() => handleDesactivar(usuario.id)}
                            title="Desactivar"
                          >
                            🚫
                          </button>
                        ) : (
                          <button
                            className="btn-icon btn-success"
                            onClick={() => handleActivar(usuario.id)}
                            title="Activar"
                          >
                            ✅
                          </button>
                        )}
                        <button
                          className="btn-icon btn-info"
                          onClick={() => handleEnviarBienvenida(usuario.id)}
                          title="Enviar credenciales"
                        >
                          📧
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleEliminar(usuario.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
}
