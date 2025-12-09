import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usuariosAPI, clasesAPI } from "../services/api";

export default function AdministradorDashboard() {
  const { logout } = useAuth();

  // Estados para formularios
  const [profesorForm, setProfesorForm] = useState({
    nombreCompleto: "",
    email: "",
    usuario: "",
    contraseña: "",
    documentoIdentidad: ""
  });

  const [estudianteForm, setEstudianteForm] = useState({
    nombreCompleto: "",
    email: "",
    usuario: "",
    contraseña: "",
    documentoIdentidad: "",
    grado: "Primer Grado",
    contactoEmergencia: "",
    observacionesMedicas: ""
  });

  const [claseForm, setClaseForm] = useState({
    nombreClase: "",
    profesor: "",
    dia: "Lunes",
    hora: "08:00 AM",
    descripcion: ""
  });

  // Estados de UI
  const [showProfesorForm, setShowProfesorForm] = useState(false);
  const [showEstudianteForm, setShowEstudianteForm] = useState(false);
  const [showClaseForm, setShowClaseForm] = useState(false);

  // Estados de datos
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar profesores al montar
  useEffect(() => {
    cargarProfesores();
  }, []);

  const cargarProfesores = async () => {
    try {
      const response = await usuariosAPI.obtenerProfesores();
      if (response.success) {
        setProfesores(response.profesores);
      }
    } catch (error) {
      console.error('Error al cargar profesores:', error);
    }
  };

  const handleRegistrarProfesor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await usuariosAPI.registrarProfesor(profesorForm);

      if (response.success) {
        setMessage({ type: 'success', text: 'Profesor registrado exitosamente' });
        setProfesorForm({
          nombreCompleto: "",
          email: "",
          usuario: "",
          contraseña: "",
          documentoIdentidad: ""
        });
        setShowProfesorForm(false);
        cargarProfesores(); // Recargar lista
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al registrar profesor' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarEstudiante = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await usuariosAPI.registrarEstudiante(estudianteForm);

      if (response.success) {
        setMessage({ type: 'success', text: 'Estudiante registrado exitosamente' });
        setEstudianteForm({
          nombreCompleto: "",
          email: "",
          usuario: "",
          contraseña: "",
          documentoIdentidad: "",
          grado: "Primer Grado",
          contactoEmergencia: "",
          observacionesMedicas: ""
        });
        setShowEstudianteForm(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al registrar estudiante' });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearClase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await clasesAPI.crear({
        nombreClase: claseForm.nombreClase,
        profesor: claseForm.profesor,
        descripcion: claseForm.descripcion,
        horario: {
          dia: claseForm.dia,
          hora: claseForm.hora
        }
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Clase creada exitosamente' });
        setClaseForm({
          nombreClase: "",
          profesor: "",
          dia: "Lunes",
          hora: "08:00 AM",
          descripcion: ""
        });
        setShowClaseForm(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al crear clase' });
    } finally {
      setLoading(false);
    }
  };

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
        {/* Mensajes de feedback */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="admin-dashboard">
          {/* Manage Users Section */}
          <div className="admin-card">
            <h2 className="admin-title">Manage Users</h2>

            <div className="admin-buttons">
              <button
                className="btn-admin-primary"
                onClick={() => {
                  setShowProfesorForm(!showProfesorForm);
                  setShowEstudianteForm(false);
                  setMessage({ type: '', text: '' });
                }}
              >
                Registrar Profesor
              </button>
              <button
                className="btn-admin-primary"
                onClick={() => {
                  setShowEstudianteForm(!showEstudianteForm);
                  setShowProfesorForm(false);
                  setMessage({ type: '', text: '' });
                }}
              >
                Registrar Estudiante
              </button>
            </div>

            {/* Formulario Profesor */}
            {showProfesorForm && (
              <div className="admin-form-container">
                <h3>Registrar Profesor</h3>
                <form className="admin-form" onSubmit={handleRegistrarProfesor}>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={profesorForm.nombreCompleto}
                    onChange={(e) => setProfesorForm({...profesorForm, nombreCompleto: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={profesorForm.email}
                    onChange={(e) => setProfesorForm({...profesorForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={profesorForm.usuario}
                    onChange={(e) => setProfesorForm({...profesorForm, usuario: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={profesorForm.contraseña}
                    onChange={(e) => setProfesorForm({...profesorForm, contraseña: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Documento de Identidad"
                    value={profesorForm.documentoIdentidad}
                    onChange={(e) => setProfesorForm({...profesorForm, documentoIdentidad: e.target.value})}
                    required
                  />

                  <div className="form-buttons">
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'Registrando...' : 'Registrar Profesor'}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowProfesorForm(false)}
                      disabled={loading}
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
                <form className="admin-form" onSubmit={handleRegistrarEstudiante}>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={estudianteForm.nombreCompleto}
                    onChange={(e) => setEstudianteForm({...estudianteForm, nombreCompleto: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={estudianteForm.email}
                    onChange={(e) => setEstudianteForm({...estudianteForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={estudianteForm.usuario}
                    onChange={(e) => setEstudianteForm({...estudianteForm, usuario: e.target.value})}
                    required
                  />

                  <div className="form-row">
                    <div className="form-group-inline">
                      <label>Contraseña</label>
                      <input
                        type="password"
                        placeholder="Crear Contraseña"
                        value={estudianteForm.contraseña}
                        onChange={(e) => setEstudianteForm({...estudianteForm, contraseña: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group-inline">
                      <label>Documento Identidad</label>
                      <input
                        type="text"
                        placeholder="Documento"
                        value={estudianteForm.documentoIdentidad}
                        onChange={(e) => setEstudianteForm({...estudianteForm, documentoIdentidad: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group-inline">
                    <label>Grado</label>
                    <select
                      value={estudianteForm.grado}
                      onChange={(e) => setEstudianteForm({...estudianteForm, grado: e.target.value})}
                      required
                    >
                      <option>Primer Grado</option>
                      <option>Segundo Grado</option>
                      <option>Tercer Grado</option>
                      <option>Cuarto Grado</option>
                      <option>Quinto Grado</option>
                      <option>Sexto Grado</option>
                    </select>
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
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'Registrando...' : 'Registrar Estudiante'}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowEstudianteForm(false)}
                      disabled={loading}
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
              onClick={() => {
                setShowClaseForm(!showClaseForm);
                setMessage({ type: '', text: '' });
              }}
            >
              Crear Clase
            </button>

            {/* Formulario Clase */}
            {showClaseForm && (
              <div className="admin-form-container">
                <h3>Registrar Clase</h3>
                <form className="admin-form" onSubmit={handleCrearClase}>
                  <input
                    type="text"
                    placeholder="Nombre de la Clase"
                    value={claseForm.nombreClase}
                    onChange={(e) => setClaseForm({...claseForm, nombreClase: e.target.value})}
                    required
                  />

                  <div className="form-section">
                    <label className="form-label">Asignar Profesor</label>
                    <select
                      value={claseForm.profesor}
                      onChange={(e) => setClaseForm({...claseForm, profesor: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar profesor...</option>
                      {profesores.map((prof) => (
                        <option key={prof._id} value={prof._id}>
                          {prof.nombreCompleto}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Horario</label>
                    <div className="form-row">
                      <select
                        value={claseForm.dia}
                        onChange={(e) => setClaseForm({...claseForm, dia: e.target.value})}
                        required
                      >
                        <option>Lunes</option>
                        <option>Martes</option>
                        <option>Miércoles</option>
                        <option>Jueves</option>
                        <option>Viernes</option>
                        <option>Sábado</option>
                      </select>
                      <select
                        value={claseForm.hora}
                        onChange={(e) => setClaseForm({...claseForm, hora: e.target.value})}
                        required
                      >
                        <option>08:00 AM</option>
                        <option>10:00 AM</option>
                        <option>12:00 PM</option>
                        <option>02:00 PM</option>
                        <option>04:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <label className="form-label">Descripción</label>
                  <textarea
                    placeholder="Descripción de la clase"
                    value={claseForm.descripcion}
                    onChange={(e) => setClaseForm({...claseForm, descripcion: e.target.value})}
                  />

                  <div className="form-buttons">
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'Creando...' : 'Registrar Clase'}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowClaseForm(false)}
                      disabled={loading}
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
