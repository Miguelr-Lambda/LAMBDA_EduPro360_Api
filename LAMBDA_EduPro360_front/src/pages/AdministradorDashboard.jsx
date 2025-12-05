import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdministradorDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("users");

  // Estado para registrar profesor
  const [profesorForm, setProfesorForm] = useState({
    nombreCompleto: "",
    email: "",
    documentoIdentidad: "",
    clasesAsignadas: []
  });

  // Estado para registrar estudiante
  const [estudianteForm, setEstudianteForm] = useState({
    nombreCompleto: "",
    email: "",
    documentoIdentidad: "",
    grado: "Primer Grado",
    contactoEmergencia: "",
    observacionesMedicas: ""
  });

  // Estado para crear clase
  const [claseForm, setClaseForm] = useState({
    nombreClase: "",
    profesor: "",
    dia: "Lunes",
    hora: "",
    descripcion: ""
  });

  const [showProfesorForm, setShowProfesorForm] = useState(false);
  const [showEstudianteForm, setShowEstudianteForm] = useState(false);
  const [showClaseForm, setShowClaseForm] = useState(false);

  const clasesDisponibles = ["Matemáticas", "Ciencias", "Historia", "Inglés", "Educación Física"];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="logo">🎓</span>
          <h1>EduPro360 <span className="role-badge">Administrador</span></h1>
        </div>
        <button onClick={logout} className="btn-logout">
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard-content">
        <div className="admin-dashboard">
          {/* Manage Users Section */}
          <div className="admin-card">
            <h2 className="admin-title">Manage Users</h2>

            <div className="admin-buttons">
              <button
                className="btn-admin-primary"
                onClick={() => setShowProfesorForm(!showProfesorForm)}
              >
                Registrar Profesor
              </button>
              <button
                className="btn-admin-primary"
                onClick={() => setShowEstudianteForm(!showEstudianteForm)}
              >
                Registrar Estudiante
              </button>
            </div>

            {/* Formulario Profesor */}
            {showProfesorForm && (
              <div className="admin-form-container">
                <h3>Registrar Profesor</h3>
                <form className="admin-form">
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={profesorForm.nombreCompleto}
                    onChange={(e) => setProfesorForm({...profesorForm, nombreCompleto: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={profesorForm.email}
                    onChange={(e) => setProfesorForm({...profesorForm, email: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Documento de Identidad"
                    value={profesorForm.documentoIdentidad}
                    onChange={(e) => setProfesorForm({...profesorForm, documentoIdentidad: e.target.value})}
                  />

                  <div className="form-section">
                    <label className="form-label">Rol</label>
                    <select className="form-select">
                      <option>Profesor</option>
                    </select>
                    <label className="form-label-secondary">Asignar Rol</label>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Asignar Clases</label>
                    <div className="checkbox-group">
                      {clasesDisponibles.map((clase, index) => (
                        <label key={index} className="checkbox-label">
                          <input type="checkbox" />
                          <span>{clase}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-buttons">
                    <button type="submit" className="btn-submit">
                      Registrar Profesor
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowProfesorForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Formulario Estudiante */}
            {showEstudianteForm && (
              <div className="admin-form-container">
                <h3>Registro de Estudiante</h3>
                <form className="admin-form">
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={estudianteForm.nombreCompleto}
                    onChange={(e) => setEstudianteForm({...estudianteForm, nombreCompleto: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={estudianteForm.email}
                    onChange={(e) => setEstudianteForm({...estudianteForm, email: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Documento de Identidad"
                    value={estudianteForm.documentoIdentidad}
                    onChange={(e) => setEstudianteForm({...estudianteForm, documentoIdentidad: e.target.value})}
                  />

                  <div className="form-row">
                    <div className="form-group-inline">
                      <label>Contraseña</label>
                      <input type="password" placeholder="Crear Contraseña" />
                    </div>
                    <div className="form-group-inline">
                      <label>Grado</label>
                      <select
                        value={estudianteForm.grado}
                        onChange={(e) => setEstudianteForm({...estudianteForm, grado: e.target.value})}
                      >
                        <option>Primer Grado</option>
                        <option>Segundo Grado</option>
                        <option>Fister Grado</option>
                        <option>Inencer Grado</option>
                        <option>Premer Grado</option>
                      </select>
                    </div>
                  </div>

                  <label className="form-label">Información Adicional</label>
                  <textarea
                    placeholder="Contacto de Emergencia"
                    value={estudianteForm.contactoEmergencia}
                    onChange={(e) => setEstudianteForm({...estudianteForm, contactoEmergencia: e.target.value})}
                  />
                  <textarea
                    placeholder="Observaciones Médicas"
                    value={estudianteForm.observacionesMedicas}
                    onChange={(e) => setEstudianteForm({...estudianteForm, observacionesMedicas: e.target.value})}
                  />

                  <div className="form-buttons">
                    <button type="submit" className="btn-submit">
                      Registrarse
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowEstudianteForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Manage Classes Section */}
          <div className="admin-card">
            <h2 className="admin-title">Manage Classes</h2>

            <button
              className="btn-admin-primary full-width"
              onClick={() => setShowClaseForm(!showClaseForm)}
            >
              Crear Clase
            </button>

            {/* Formulario Clase */}
            {showClaseForm && (
              <div className="admin-form-container">
                <h3>Registrar Clase</h3>
                <form className="admin-form">
                  <input
                    type="text"
                    placeholder="Nombre de la Clase"
                    value={claseForm.nombreClase}
                    onChange={(e) => setClaseForm({...claseForm, nombreClase: e.target.value})}
                  />

                  <div className="form-section">
                    <label className="form-label">Asignar Profesor</label>
                    <select
                      value={claseForm.profesor}
                      onChange={(e) => setClaseForm({...claseForm, profesor: e.target.value})}
                    >
                      <option value="">Profesor A</option>
                      <option value="a">Profesor A</option>
                      <option value="b">Profesor B</option>
                    </select>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Horario</label>
                    <div className="form-row">
                      <select
                        value={claseForm.dia}
                        onChange={(e) => setClaseForm({...claseForm, dia: e.target.value})}
                      >
                        <option>Día</option>
                        <option>Lunes</option>
                        <option>Martes</option>
                        <option>Miércoles</option>
                        <option>Jueves</option>
                        <option>Viernes</option>
                      </select>
                      <select
                        value={claseForm.hora}
                        onChange={(e) => setClaseForm({...claseForm, hora: e.target.value})}
                      >
                        <option>Hora</option>
                        <option>08:00 AM</option>
                        <option>10:00 AM</option>
                        <option>01:00 PM</option>
                        <option>03:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <label className="form-label">Descripción</label>
                  <textarea
                    placeholder="Descripción"
                    value={claseForm.descripcion}
                    onChange={(e) => setClaseForm({...claseForm, descripcion: e.target.value})}
                  />

                  <div className="form-buttons">
                    <button type="submit" className="btn-submit">
                      Registrar Clase
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowClaseForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
