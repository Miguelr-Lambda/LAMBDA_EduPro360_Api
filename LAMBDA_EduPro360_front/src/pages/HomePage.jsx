import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-brand">
          <span className="landing-logo">🎓</span>
          <h1 className="landing-title">EduPro360</h1>
        </div>

        <button
          className="btn-iniciar-sesion"
          onClick={() => navigate('/login')}
        >
          Iniciar Sesión
        </button>
      </div>

      <div className="landing-content">
        <div className="landing-welcome">
          <h2>Bienvenido a EduPro360:</h2>
          <h2>Tu Plataforma Educativa Integral</h2>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Gestión Académica</h3>
            <p>Gestión académica, pasar de gestión académica y realización de complejos de gestión académica.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Acceso a Calificaciones</h3>
            <p>Plataforma tu acceso a calificaciones y manage con contacto nawiltos de aludents.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Comunicación Eficiente</h3>
            <p>Comunicación eficiente, repoometos henunce autan la comunicación eficiente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
