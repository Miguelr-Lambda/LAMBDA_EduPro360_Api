import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();

  // Si no está autenticado, redirigir a la página de login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Si se requiere un rol específico
  if (requiredRole) {
    const rolNombre = user?.rol_detalle?.nombre?.toLowerCase() || "";
    const isAdmin = rolNombre.includes("admin") || rolNombre.includes("administrador") || user?.is_superuser;

    // Verificar si el usuario tiene el rol requerido
    if (requiredRole === "admin" && !isAdmin) {
      return (
        <div className="card">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
          <p className="hint">Esta sección es solo para administradores.</p>
        </div>
      );
    }

    if (requiredRole === "docente") {
      const isDocente = rolNombre.includes("docent") || rolNombre.includes("profesor") || rolNombre.includes("maestro");
      if (!isDocente && !isAdmin) {
        return (
          <div className="card">
            <h2>Acceso Denegado</h2>
            <p>No tienes permisos para acceder a esta sección.</p>
            <p className="hint">Esta sección es solo para docentes.</p>
          </div>
        );
      }
    }

    if (requiredRole === "estudiante") {
      const isEstudiante = rolNombre.includes("estudiant") || rolNombre.includes("alumno");
      if (!isEstudiante && !isAdmin) {
        return (
          <div className="card">
            <h2>Acceso Denegado</h2>
            <p>No tienes permisos para acceder a esta sección.</p>
            <p className="hint">Esta sección es solo para estudiantes.</p>
          </div>
        );
      }
    }
  }

  // Si pasa todas las verificaciones, renderizar el contenido
  return children;
}
