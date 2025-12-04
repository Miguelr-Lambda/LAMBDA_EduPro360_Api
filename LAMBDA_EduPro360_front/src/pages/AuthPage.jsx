import { useState } from "react";
import { LoginForm, RegistroForm, RecuperacionForm } from "../components/AuthForms";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { id: "login", label: "Iniciar sesión", component: <LoginForm /> },
  { id: "registro", label: "Crear cuenta", component: <RegistroForm /> },
  { id: "recuperar", label: "Recuperar acceso", component: <RecuperacionForm /> },
];

export default function AuthPage() {
  const [active, setActive] = useState("login");
  const { isAuthenticated } = useAuth();

  return (
    <section className="card">
      <p className="eyebrow">Acceso</p>
      <h1>Autenticación JWT</h1>
      <p className="hint">
        Las credenciales se envían a <code>/api/auth/login/</code> y reciben <code>access</code> y <code>refresh</code> tokens.
        El registro crea una cuenta y regresa los tokens listos para consumir endpoints protegidos.
      </p>
      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={tab.id === active ? "active" : "ghost"} onClick={() => setActive(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>
      <div className="panel">{tabs.find((t) => t.id === active)?.component}</div>
      {isAuthenticated && <p className="feedback success">Sesión activa: ya puedes ir al módulo académico.</p>}
    </section>
  );
}