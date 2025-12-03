import AsignaturasPanel from "../components/AsignaturasPanel";
import TareasPanel from "../components/TareasPanel";
import EntregasPanel from "../components/EntregasPanel";
import { useAuth } from "../context/AuthContext";

export default function AcademicPage() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="grid">
      <AsignaturasPanel />
      <TareasPanel />
      <EntregasPanel />
      {!isAuthenticated && (
        <div className="card">
          <p className="eyebrow">Recordatorio</p>
          <h2>Necesitas un token</h2>
          <p>Los endpoints académicos requieren autenticación JWT. Inicia sesión o crea una cuenta desde la pestaña de Acceso.</p>
        </div>
      )}
    </section>
  );
}