import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfesorDashboard() {
  const { user, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([
    { id: 1, name: "John Smith", calificacion: 88, descripcion: "" },
    { id: 2, name: "Emily Johnson", calificacion: 92, descripcion: "" },
    { id: 3, name: "Michael Brown", calificacion: 85, descripcion: "" },
    { id: 4, name: "Sarah Wilson", calificacion: 80, descripcion: "" },
  ]);

  const handleCalificacionChange = (id, value) => {
    setStudents(students.map(student =>
      student.id === id ? { ...student, calificacion: value } : student
    ));
  };

  const handleDescripcionChange = (id, value) => {
    setStudents(students.map(student =>
      student.id === id ? { ...student, descripcion: value } : student
    ));
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="logo">🎓</span>
          <h1>EduPro360 <span className="role-badge">Profesor</span></h1>
        </div>
        <button onClick={logout} className="btn-logout">
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-card">
          <h2 className="dashboard-title">Calificación de los estudiantes</h2>

          <div className="class-selector">
            <label htmlFor="clase">Clase:</label>
            <select
              id="clase"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="class-dropdown"
            >
              <option value="">Matematicas</option>
              <option value="matematicas">Matematicas</option>
              <option value="ciencias">Ciencias</option>
              <option value="historia">Historia</option>
              <option value="ingles">Inglés</option>
            </select>
          </div>

          <div className="grades-table-container">
            <table className="grades-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Calificación</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={student.calificacion}
                        onChange={(e) => handleCalificacionChange(student.id, e.target.value)}
                        className="grade-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={student.descripcion}
                        onChange={(e) => handleDescripcionChange(student.id, e.target.value)}
                        className="description-input"
                        placeholder="Descripción"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
