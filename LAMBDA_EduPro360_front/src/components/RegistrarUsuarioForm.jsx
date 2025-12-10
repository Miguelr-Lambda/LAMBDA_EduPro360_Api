import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegistrarUsuarioForm({ onUsuarioCreado }) {
  const { tokens } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errores, setErrores] = useState({});

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    rol: "",
    activo: true,
  });

  // Cargar roles disponibles
  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const response = await apiFetch("/usuarios/roles/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        });
        // Si la respuesta es paginada
        const rolesData = response.results || response;
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (error) {
        console.error("Error cargando roles:", error);
        setRoles([]);
      }
    };

    if (tokens?.access) {
      cargarRoles();
    }
  }, [tokens]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores((prev) => {
        const newErrores = { ...prev };
        delete newErrores[name];
        return newErrores;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setErrores({});

    try {
      const response = await apiFetch("/usuarios/usuarios/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
        body: formData,
      });

      setMensaje({
        tipo: "success",
        texto: response.mensaje || "Usuario creado exitosamente. Se han enviado las credenciales por correo.",
      });

      // Limpiar formulario
      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        telefono: "",
        rol: "",
        activo: true,
      });

      // Notificar al componente padre
      if (onUsuarioCreado) {
        onUsuarioCreado(response.user);
      }
    } catch (error) {
      console.error("Error creando usuario:", error);
      if (error.response?.data) {
        // Errores de validación del backend
        setErrores(error.response.data);
        setMensaje({
          tipo: "error",
          texto: "Por favor corrige los errores en el formulario.",
        });
      } else {
        setMensaje({
          tipo: "error",
          texto: error.message || "Error al crear el usuario. Por favor intenta de nuevo.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registrar-usuario-form">
      <h3>Registrar Nuevo Usuario</h3>
      <p className="hint">
        Se generará automáticamente una contraseña segura y se enviará al correo del usuario.
      </p>

      {mensaje && (
        <div className={`feedback ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-row">
          <div className="field">
            <label htmlFor="first_name">
              Nombre <span className="required">*</span>
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
            {errores.first_name && (
              <span className="error-text">{errores.first_name[0]}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="last_name">
              Apellido <span className="required">*</span>
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
            {errores.last_name && (
              <span className="error-text">{errores.last_name[0]}</span>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="username">
            Nombre de usuario <span className="required">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          {errores.username && (
            <span className="error-text">{errores.username[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="email">
            Correo electrónico <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <small>Las credenciales se enviarán a este correo</small>
          {errores.email && (
            <span className="error-text">{errores.email[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
          />
          {errores.telefono && (
            <span className="error-text">{errores.telefono[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="rol">
            Rol <span className="required">*</span>
          </label>
          <select
            id="rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar rol...</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
          {errores.rol && (
            <span className="error-text">{errores.rol[0]}</span>
          )}
        </div>

        <div className="field checkbox-field">
          <label>
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
            />
            <span>Usuario activo</span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creando usuario..." : "Crear Usuario y Enviar Credenciales"}
        </button>
      </form>
    </div>
  );
}
