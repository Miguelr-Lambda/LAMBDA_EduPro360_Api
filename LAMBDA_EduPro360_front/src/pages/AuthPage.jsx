import { useState } from "react";
import { LoginForm, RecuperacionForm } from "../components/AuthForms";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { id: "login", label: "Iniciar sesión", component: <LoginForm /> },
  { id: "recuperar", label: "Recuperar acceso", component: <RecuperacionForm /> },
];

export default function AuthPage() {
  const [active, setActive] = useState("login");
  const { isAuthenticated } = useAuth();

  return (
    <section className="card auth-page">
      <p className="eyebrow">Acceso al Sistema</p>
      <h1>Iniciar Sesión en EduPro360</h1>
      <p className="hint">
        Ingresa con las credenciales proporcionadas por el administrador del sistema.
        Si olvidaste tu contraseña, puedes recuperar el acceso a tu cuenta.
      </p>
      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={tab.id === active ? "active" : "ghost"} onClick={() => setActive(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>
      <div className="panel">{tabs.find((t) => t.id === active)?.component}</div>
      {isAuthenticated && <p className="feedback success">Sesión activa: ya puedes acceder al panel.</p>}

      <div className="auth-info">
        <p className="info-text">
          <strong>Nota:</strong> Si eres un nuevo usuario y aún no tienes credenciales,
          contacta al administrador del sistema para que cree tu cuenta.
        </p>
      </div>
    </section>
  );
}