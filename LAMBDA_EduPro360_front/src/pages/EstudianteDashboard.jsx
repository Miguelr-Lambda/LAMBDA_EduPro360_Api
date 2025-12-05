import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function EstudianteDashboard() {
  const { user, logout } = useAuth();
  const [calificaciones] = useState([
    { clase: "Matematicas", calificacion: 88 },
    { clase: "Sociales", calificacion: 92 },
    { clase: "Lectura Crítica", calificacion: 85 },
    { clase: "Ingles", calificacion: 90 },
  ]);

  const promedio = (calificaciones.reduce((sum, c) => sum + c.calificacion, 0) / calificaciones.length).toFixed(2);

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
        <div className="dashboard-card">
          <h2 className="dashboard-title">Mis Calificaciones</h2>

          <div className="grades-table-container">
            <table className="grades-table">
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>Calificación</th>
                </tr>
              </thead>
              <tbody>
                {calificaciones.map((item, index) => (
                  <tr key={index}>
                    <td>{item.clase}</td>
                    <td className="grade-cell">{item.calificacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="average-section">
            <p className="average-label">Promedio General:</p>
            <p className="average-value">{promedio}</p>
          </div>

          <button className="btn-generate-report">
            Generar Reporte
          </button>
        </div>
      </main>
    </div>
  );
}
