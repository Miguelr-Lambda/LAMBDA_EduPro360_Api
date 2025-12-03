import { Route, Routes, NavLink } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import AcademicPage from "./pages/AcademicPage";
import NotasPage from "./pages/NotasPage";
import { useAuth } from "./context/AuthContext";
import ReportesPage from "./pages/ReportesPage";

function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <header className="app-header">
      <div className="brand">
        <span className="logo">🎓</span>
        <div>
          <p className="brand-subtitle">EduPro360</p>
          <p className="brand-title">Panel académico</p>
        </div>
      </div>
      <nav>
        <NavLink to="/" end>
          Inicio
        </NavLink>
        <NavLink to="/academico">Académico</NavLink>
        <NavLink to="/notas">Notas</NavLink>
        <NavLink to="/reportes">Reportes</NavLink>
        <NavLink to="/auth">Acceso</NavLink>
      </nav>
      {isAuthenticated && (
        <button className="ghost" onClick={logout} type="button">
          Cerrar sesión
        </button>
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/academico" element={<AcademicPage />} />
          <Route path="/notas" element={<NotasPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>Conecta este frontend con el backend Django en <code>/api</code> usando JWT.</p>
      </footer>
    </div>
  );
}