import { useAuth } from "../context/AuthContext";
import AdminDashboard from "../pages/AdminDashboard";
import DocenteDashboard from "../pages/DocenteDashboard";
import EstudianteDashboard from "../pages/EstudianteDashboard";
import { Navigate } from "react-router-dom";

export default function RoleBasedDashboard() {
  const { user, isAuthenticated } = useAuth();

  // Si no está autenticado, redirigir a auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Si no hay usuario o rol, mostrar mensaje
  if (!user || !user.rol_detalle) {
    return (
      <div className="card">
        <h2>Cargando información del usuario...</h2>
        <p>Por favor espera un momento.</p>
      </div>
    );
  }

  const rolNombre = user.rol_detalle.nombre.toLowerCase();

  // Determinar qué dashboard mostrar según el rol
  if (rolNombre.includes("admin") || rolNombre.includes("administrador") || user.is_superuser) {
    return <AdminDashboard />;
  }

  if (rolNombre.includes("docent") || rolNombre.includes("profesor") || rolNombre.includes("maestro")) {
    return <DocenteDashboard />;
  }

  if (rolNombre.includes("estudiant") || rolNombre.includes("alumno")) {
    return <EstudianteDashboard />;
  }

  // Dashboard por defecto si no coincide con ningún rol conocido
  return (
    <div className="card">
      <h2>Panel de Usuario</h2>
      <p>Bienvenido, {user.first_name || user.username}</p>
      <p>Tu rol: <strong>{user.rol_detalle.nombre}</strong></p>
      <p className="hint">
        No se ha configurado un dashboard específico para tu rol.
        Por favor contacta al administrador.
      </p>
    </div>
  );
}
