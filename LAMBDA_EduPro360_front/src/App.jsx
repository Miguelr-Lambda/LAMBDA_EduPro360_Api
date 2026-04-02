import { Route, Routes, NavLink, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import AcademicPage from "./pages/AcademicPage";
import NotasPage from "./pages/NotasPage";
import { useAuth } from "./context/AuthContext";
import ReportesPage from "./pages/ReportesPage";

function Navigation() {
  const { isAuthenticated, logout, user } = useAuth();

  // Determinar el rol del usuario
  const rolNombre = user?.rol_detalle?.nombre?.toLowerCase() || "";
  const isAdmin = rolNombre.includes("admin") || rolNombre.includes("administrador") || user?.is_superuser;
  const isDocente = rolNombre.includes("docent") || rolNombre.includes("profesor") || rolNombre.includes("maestro");
  const isEstudiante = rolNombre.includes("estudiant") || rolNombre.includes("alumno");

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <span className="logo">🎓</span>
        <div>
          <p className="brand-subtitle">EduPro360</p>
          <p className="brand-title">Gestión Académica</p>
        </div>
      </Link>

      {isAuthenticated ? (
        <>
          <nav>
            <NavLink to="/dashboard" end>
              Dashboard
            </NavLink>
            {(isAdmin || isDocente) && (
              <NavLink to="/academico">Académico</NavLink>
            )}
            {(isDocente || isEstudiante) && (
              <NavLink to="/notas">Notas</NavLink>
            )}
            {isAdmin && (
              <NavLink to="/reportes">Reportes</NavLink>
            )}
          </nav>
          <div className="header-actions">
            <span className="user-badge">
              {user?.first_name || user?.username}
            </span>
            <button className="btn-logout" onClick={logout} type="button">
              Cerrar sesión
            </button>
          </div>
        </>
      ) : (
        <>
          <nav className="nav-right">
            <Link to="/auth" className="btn-login">
              Iniciar Sesión
            </Link>
          </nav>
        </>
      )}
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Navigation />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/academico"
            element={
              <ProtectedRoute requiredRole="docente">
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notas"
            element={
              <ProtectedRoute>
                <NotasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute requiredRole="admin">
                <ReportesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 EduPro360 - Plataforma de Gestión Académica</p>
      </footer>
    </div>
  );
}