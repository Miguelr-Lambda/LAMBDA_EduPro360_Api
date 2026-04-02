import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { apiUrl, isAuthenticated, user } = useAuth();
  return (
    <section className="grid">
      <div className="card">
        <p className="eyebrow">Bienvenido</p>
        <h1>EduPro360, tu panel académico</h1>
        <p>
          Este frontend en React + Vite consume el backend Django expuesto en <strong>{apiUrl}</strong>.
          Incluye formularios para autenticación, gestión académica y consulta de notas.
        </p>
        <ul>
          <li>Autenticación JWT con correo y contraseña.</li>
          <li>CRUD básico de asignaturas y tareas.</li>
          <li>Envío de entregas y calificaciones rápidas.</li>
          <li>Consulta de notas por asignatura o periodo.</li>
        </ul>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Estado de sesión</p>
        <h2>{isAuthenticated ? "Sesión activa" : "Invitado"}</h2>
        {isAuthenticated ? (
          <>
            <p>Ya puedes consumir los endpoints protegidos con el token guardado en memoria.</p>
            {user && (
              <div className="pill">{user.email || user.username}</div>
            )}
          </>
        ) : (
          <p>Dirígete a la pestaña de Acceso para obtener tus tokens JWT.</p>
        )}
        <div className="hint">Configura <code>VITE_API_URL</code> en un archivo <code>.env</code> para apuntar a otro host.</div>
      </div>
    </section>
  );
}