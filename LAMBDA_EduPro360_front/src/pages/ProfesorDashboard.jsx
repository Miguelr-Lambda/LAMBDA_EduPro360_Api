import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clasesAPI, calificacionesAPI } from "../services/api";

export default function ProfesorDashboard() {
  const { user, logout } = useAuth();

  // Estados
  const [clases, setClases] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar clases del profesor al montar
  useEffect(() => {
    if (user && user._id) {
      cargarClasesProfesor();
    }
  }, [user]);

  // Cargar estudiantes cuando se selecciona una clase
  useEffect(() => {
    if (selectedClass) {
      cargarEstudiantesYCalificaciones();
    }
  }, [selectedClass]);

  const cargarClasesProfesor = async () => {
    try {
      const response = await clasesAPI.obtenerPorProfesor(user._id);
      if (response.success) {
        setClases(response.clases);
        if (response.clases.length > 0) {
          setSelectedClass(response.clases[0]._id);
        }
      }
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setMessage({ type: 'error', text: 'Error al cargar clases' });
    }
  };

  const cargarEstudiantesYCalificaciones = async () => {
    try {
      setLoading(true);

      // Obtener detalles de la clase con estudiantes
      const claseResponse = await clasesAPI.obtenerPorId(selectedClass);

      if (claseResponse.success) {
        setStudents(claseResponse.clase.estudiantes || []);

        // Cargar calificaciones existentes
        const gradesResponse = await calificacionesAPI.obtenerPorClase(selectedClass);

        if (gradesResponse.success) {
          // Mapear calificaciones por estudiante
          const gradesMap = {};
          gradesResponse.calificaciones.forEach(grade => {
            gradesMap[grade.estudiante._id] = {
              calificacion: grade.calificacion,
              descripcion: grade.descripcion || '',
              gradeId: grade._id
            };
          });
          setCalificaciones(gradesMap);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar estudiantes' });
    } finally {
      setLoading(false);
    }
  };

  const handleCalificacionChange = (estudianteId, value) => {
    setCalificaciones({
      ...calificaciones,
      [estudianteId]: {
        ...calificaciones[estudianteId],
        calificacion: parseFloat(value) || 0
      }
    });
  };

  const handleDescripcionChange = (estudianteId, value) => {
    setCalificaciones({
      ...calificaciones,
      [estudianteId]: {
        ...calificaciones[estudianteId],
        descripcion: value
      }
    });
  };

  const handleGuardarCalificacion = async (estudianteId) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const calificacionData = calificaciones[estudianteId];

      if (!calificacionData || calificacionData.calificacion === undefined) {
        setMessage({ type: 'error', text: 'Por favor ingrese una calificación' });
        return;
      }

      const response = await calificacionesAPI.crear({
        estudiante: estudianteId,
        clase: selectedClass,
        calificacion: calificacionData.calificacion,
        descripcion: calificacionData.descripcion || ''
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Calificación guardada exitosamente' });
        // Recargar calificaciones
        await cargarEstudiantesYCalificaciones();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar calificación' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarTodas = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      let errores = 0;
      let guardadas = 0;

      for (const estudiante of students) {
        const calificacionData = calificaciones[estudiante._id];

        if (calificacionData && calificacionData.calificacion !== undefined) {
          try {
            await calificacionesAPI.crear({
              estudiante: estudiante._id,
              clase: selectedClass,
              calificacion: calificacionData.calificacion,
              descripcion: calificacionData.descripcion || ''
            });
            guardadas++;
          } catch (error) {
            errores++;
            console.error(`Error guardando calificación para ${estudiante.nombreCompleto}:`, error);
          }
        }
      }

      if (guardadas > 0) {
        setMessage({
          type: errores > 0 ? 'error' : 'success',
          text: `${guardadas} calificaciones guardadas${errores > 0 ? `, ${errores} errores` : ''}`
        });
        await cargarEstudiantesYCalificaciones();
      } else {
        setMessage({ type: 'error', text: 'No hay calificaciones para guardar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar calificaciones' });
    } finally {
      setLoading(false);
    }
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
        {/* Mensajes de feedback */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="dashboard-card">
          <h2 className="dashboard-title">Calificación de los estudiantes</h2>

          <div className="class-selector">
            <label htmlFor="clase">Clase:</label>
            <select
              id="clase"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="class-dropdown"
              disabled={loading || clases.length === 0}
            >
              {clases.length === 0 ? (
                <option value="">No hay clases asignadas</option>
              ) : (
                clases.map((clase) => (
                  <option key={clase._id} value={clase._id}>
                    {clase.nombreClase}
                  </option>
                ))
              )}
            </select>
          </div>

          {loading && (
            <p className="loading-message">Cargando datos...</p>
          )}

          {!loading && students.length === 0 && selectedClass && (
            <p className="empty-message">No hay estudiantes inscritos en esta clase</p>
          )}

          {!loading && students.length > 0 && (
            <>
              <div className="grades-table-container">
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Calificación</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>{student.nombreCompleto}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={calificaciones[student._id]?.calificacion || ''}
                            onChange={(e) => handleCalificacionChange(student._id, e.target.value)}
                            className="grade-input"
                            placeholder="0-100"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={calificaciones[student._id]?.descripcion || ''}
                            onChange={(e) => handleDescripcionChange(student._id, e.target.value)}
                            className="description-input"
                            placeholder="Descripción"
                          />
                        </td>
                        <td>
                          <button
                            className="btn-save-grade"
                            onClick={() => handleGuardarCalificacion(student._id)}
                            disabled={loading}
                          >
                            Guardar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="actions-footer">
                <button
                  className="btn-save-all"
                  onClick={handleGuardarTodas}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Todas las Calificaciones'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
