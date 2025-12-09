import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import EstudianteDashboard from "./pages/EstudianteDashboard";
import AdministradorDashboard from "./pages/AdministradorDashboard";

function PrivateRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RoleBasedRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.rol) {
    case 'administrador':
      return <Navigate to="/dashboard/administrador" replace />;
    case 'profesor':
      return <Navigate to="/dashboard/profesor" replace />;
    case 'estudiante':
      return <Navigate to="/dashboard/estudiante" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-shell">
      <Routes>
        {/* Ruta pública */}
        <Route
          path="/"
          element={isAuthenticated ? <RoleBasedRedirect /> : <HomePage />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />}
        />

        {/* Dashboards por rol */}
        <Route
          path="/dashboard/administrador"
          element={
            <PrivateRoute requiredRole="administrador">
              <AdministradorDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/profesor"
          element={
            <PrivateRoute requiredRole="profesor">
              <ProfesorDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/estudiante"
          element={
            <PrivateRoute requiredRole="estudiante">
              <EstudianteDashboard />
            </PrivateRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}