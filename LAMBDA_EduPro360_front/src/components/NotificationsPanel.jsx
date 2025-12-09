import { useState, useEffect } from 'react';
import { notificacionesAPI } from '../services/api';

export default function NotificationsPanel({ isOpen, onClose }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones();
    }
  }, [isOpen, filter]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const leidas = filter === 'unread' ? false : undefined;
      const response = await notificacionesAPI.obtenerMisNotificaciones(leidas);

      if (response.success) {
        setNotificaciones(response.notificaciones);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoLeida = async (notificacionId) => {
    try {
      await notificacionesAPI.marcarComoLeida(notificacionId);
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarcarTodasComoLeidas = async () => {
    try {
      await notificacionesAPI.marcarTodasComoLeidas();
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleEliminar = async (notificacionId) => {
    try {
      await notificacionesAPI.eliminar(notificacionId);
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'tarea_nueva':
        return '📋';
      case 'tarea_vencida':
        return '⏰';
      case 'calificacion_nueva':
        return '📝';
      case 'entrega_calificada':
        return '✅';
      case 'general':
      default:
        return '📢';
    }
  };

  const formatTiempo = (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diff = Math.floor((ahora - fechaNotif) / 1000); // segundos

    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} d`;
    return fechaNotif.toLocaleDateString('es-ES');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1999
          }}
          onClick={onClose}
        />
      )}

      {/* Panel de notificaciones */}
      <div className={`notifications-panel ${isOpen ? 'open' : ''}`}>
        <div className="notifications-header">
          <h3>🔔 Notificaciones</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filtros */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-gray)', background: 'white' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: filter === 'all' ? 'var(--secondary-blue)' : 'white',
                color: filter === 'all' ? 'white' : 'var(--text-primary)',
                border: '2px solid var(--secondary-blue)',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: filter === 'unread' ? 'var(--secondary-blue)' : 'white',
                color: filter === 'unread' ? 'white' : 'var(--text-primary)',
                border: '2px solid var(--secondary-blue)',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              No leídas
            </button>
          </div>

          {notificaciones.some(n => !n.leida) && (
            <button
              onClick={handleMarcarTodasComoLeidas}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'var(--success-green)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ✓ Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="notifications-body">
          {loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Cargando...
            </p>
          )}

          {!loading && notificaciones.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>🔔</div>
              <p style={{ color: 'var(--text-secondary)' }}>
                {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
              </p>
            </div>
          )}

          {!loading && notificaciones.map((notif) => (
            <div
              key={notif._id}
              className={`notification-item ${!notif.leida ? 'unread' : ''} ${notif.urgente ? 'urgent' : ''}`}
              onClick={() => {
                if (!notif.leida) {
                  handleMarcarComoLeida(notif._id);
                }
              }}
            >
              <div className="notification-header">
                <span className="notification-title">
                  {getTipoIcon(notif.tipo)} {notif.titulo}
                </span>
                <span className="notification-time">{formatTiempo(notif.fecha_creacion)}</span>
              </div>
              <p className="notification-message">{notif.mensaje}</p>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                {!notif.leida && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarcarComoLeida(notif._id);
                    }}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--secondary-blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Marcar leída
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminar(notif._id);
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'var(--danger-red)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Eliminar
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
