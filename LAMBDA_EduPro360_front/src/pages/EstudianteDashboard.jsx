import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { calificacionesAPI } from "../services/api";

export default function EstudianteDashboard() {
  const { user, logout } = useAuth();

  // Estados
  const [calificaciones, setCalificaciones] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showReporte, setShowReporte] = useState(false);

  // Cargar calificaciones al montar
  useEffect(() => {
    if (user && user._id) {
      cargarCalificaciones();
    }
  }, [user]);

  const cargarCalificaciones = async () => {
    try {
      setLoading(true);
      const response = await calificacionesAPI.obtenerMisCalificaciones();

      if (response.success) {
        setCalificaciones(response.calificaciones);
      }
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      setMessage({ type: 'error', text: 'Error al cargar calificaciones' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarReporte = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await calificacionesAPI.generarReporte(user._id);

      if (response.success) {
        setReporte(response.reporte);
        setShowReporte(true);
        setMessage({ type: 'success', text: 'Reporte generado exitosamente' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al generar reporte' });
    } finally {
      setLoading(false);
    }
  };

  // Calcular promedio
  const promedio = calificaciones.length > 0
    ? (calificaciones.reduce((sum, c) => sum + c.calificacion, 0) / calificaciones.length).toFixed(2)
    : '0.00';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="logo">🎓</span>
          <h1>EduPro360 <span className="role-badge">Estudiante</span></h1>
        </div>
        <button onClick={logout} className="btn-logout">
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard-content">
        {/* Mensajes de feedback */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="dashboard-card">
          <h2 className="dashboard-title">Mis Calificaciones</h2>

          {loading && (
            <p className="loading-message">Cargando calificaciones...</p>
          )}

          {!loading && calificaciones.length === 0 && (
            <p className="empty-message">No tienes calificaciones registradas aún</p>
          )}

          {!loading && calificaciones.length > 0 && (
            <>
              <div className="grades-table-container">
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Clase</th>
                      <th>Calificación</th>
                      <th>Periodo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calificaciones.map((item, index) => (
                      <tr key={index}>
                        <td>{item.clase?.nombreClase || 'N/A'}</td>
                        <td className="grade-cell">{item.calificacion}</td>
                        <td>{item.periodo || 'Primer Periodo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="average-section">
                <p className="average-label">Promedio General:</p>
                <p className="average-value">{promedio}</p>
              </div>

              <button
                className="btn-generate-report"
                onClick={handleGenerarReporte}
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </button>
            </>
          )}
        </div>

        {/* Modal de Reporte */}
        {showReporte && reporte && (
          <div className="report-modal">
            <div className="report-content">
              <div className="report-header">
                <h2>📄 Reporte Académico</h2>
                <button
                  className="btn-close-report"
                  onClick={() => setShowReporte(false)}
                >
                  ✕
                </button>
              </div>

              <div className="report-body">
                <div className="report-section">
                  <h3>Información del Estudiante</h3>
                  <p><strong>Nombre:</strong> {reporte.estudiante.nombreCompleto}</p>
                  <p><strong>Grado:</strong> {reporte.estudiante.grado}</p>
                  <p><strong>Email:</strong> {reporte.estudiante.email}</p>
                </div>

                <div className="report-section">
                  <h3>Calificaciones</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Clase</th>
                        <th>Calificación</th>
                        <th>Periodo</th>
                        <th>Profesor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.calificaciones.map((cal, index) => (
                        <tr key={index}>
                          <td>{cal.clase}</td>
                          <td className="grade-cell">{cal.calificacion}</td>
                          <td>{cal.periodo}</td>
                          <td>{cal.profesor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h3>Resumen</h3>
                  <p><strong>Total de Clases:</strong> {reporte.totalClases}</p>
                  <p><strong>Promedio General:</strong> <span className="average-value">{reporte.promedio}</span></p>
                  <p><strong>Fecha de Generación:</strong> {new Date(reporte.fechaGeneracion).toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              <div className="report-footer">
                <button
                  className="btn-download-report"
                  onClick={() => window.print()}
                >
                  Imprimir / Descargar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
