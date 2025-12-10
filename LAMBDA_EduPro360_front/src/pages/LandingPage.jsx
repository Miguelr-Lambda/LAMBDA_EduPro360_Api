import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Bienvenido a <span className="brand-highlight">EduPro360</span>
            </h1>
            <p className="hero-subtitle">
              La plataforma integral de gestión académica diseñada para instituciones educativas modernas
            </p>
            <p className="hero-description">
              Optimiza la administración de tu institución, facilita la comunicación entre docentes y estudiantes,
              y mejora el seguimiento del progreso académico con nuestra solución todo en uno.
            </p>
            <div className="hero-actions">
              {!isAuthenticated ? (
                <Link to="/auth" className="btn btn-primary btn-large">
                  Iniciar Sesión
                </Link>
              ) : (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Ir al Panel
                </Link>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <span className="hero-icon">🎓</span>
              <h3>Gestión Académica</h3>
              <p>Control total de asignaturas, tareas y calificaciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-header">
          <h2 className="section-title">Funcionalidades Principales</h2>
          <p className="section-subtitle">
            Todo lo que necesitas para gestionar tu institución educativa
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon admin">👨‍💼</div>
            <h3>Panel de Administración</h3>
            <p>
              Gestiona usuarios, roles y permisos. Supervisa todas las actividades académicas
              desde un panel centralizado e intuitivo.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon teacher">👨‍🏫</div>
            <h3>Espacio Docente</h3>
            <p>
              Crea y gestiona asignaturas, asigna tareas, califica entregas y mantén
              comunicación constante con tus estudiantes.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon student">👨‍🎓</div>
            <h3>Portal Estudiantil</h3>
            <p>
              Accede a tus asignaturas, consulta tareas pendientes, envía entregas
              y revisa tus calificaciones en tiempo real.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon reports">📊</div>
            <h3>Reportes y Estadísticas</h3>
            <p>
              Genera reportes detallados sobre el rendimiento académico, asistencia
              y progreso de estudiantes.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon notifications">🔔</div>
            <h3>Notificaciones en Tiempo Real</h3>
            <p>
              Mantén a todos informados con notificaciones automáticas sobre tareas,
              calificaciones y eventos importantes.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon security">🔒</div>
            <h3>Seguridad y Privacidad</h3>
            <p>
              Sistema de autenticación robusto con roles y permisos personalizables
              para proteger la información académica.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-content">
          <h2 className="section-title">¿Por qué elegir EduPro360?</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <div>
                <h4>Interfaz Intuitiva</h4>
                <p>Diseñada pensando en la facilidad de uso para todos los usuarios</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <div>
                <h4>Acceso Multiplataforma</h4>
                <p>Funciona en cualquier dispositivo: computadora, tablet o móvil</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <div>
                <h4>Actualización en Tiempo Real</h4>
                <p>Información sincronizada instantáneamente en toda la plataforma</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <div>
                <h4>Soporte Técnico</h4>
                <p>Equipo dedicado para resolver cualquier duda o inconveniente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>¿Listo para transformar tu gestión académica?</h2>
          <p>Únete a las instituciones que ya confían en EduPro360</p>
          {!isAuthenticated && (
            <Link to="/auth" className="btn btn-primary btn-large">
              Comenzar Ahora
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
