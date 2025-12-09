import { useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function ReportesPage() {
  const { tokens, role, isAuthenticated } = useAuth();
  const [periodo, setPeriodo] = useState("");
  const [status, setStatus] = useState(null);

  const roleKey = typeof role === "string" ? role.toLowerCase() : "";
  const isAdmin = roleKey.startsWith("admin");
  const disabled = !tokens?.access || !isAdmin;

  if (!isAuthenticated) {
    return (
      <section className="card">
        <p className="eyebrow">Reportes</p>
        <h1>Autenticación requerida</h1>
        <p>Inicia sesión con un rol administrativo para programar los reportes académicos mensuales.</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="card">
        <p className="eyebrow">Reportes</p>
        <h1>Solo administrativo</h1>
        <p>El rol actual "{role || "invitado"}" no puede programar reportes. Solicita a un administrador que lo haga.</p>
      </section>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) return;
    setStatus({ type: "loading", message: "Programando generación de reporte..." });
    try {
      const body = periodo ? { periodo } : undefined;
      const data = await apiFetch("/Academico/reportes/mensual/", {
        method: "POST",
        token: tokens.access,
        body,
      });
      setStatus({ type: "success", message: `Reporte programado para ${data.periodo}. Task ID: ${data.task_id}` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="card">
      <p className="eyebrow">Reportes</p>
      <h1>Resumen mensual</h1>
      <p className="hint">Lanza la tarea de Celery que genera reportes académicos acumulados. Si no defines un periodo, se usará el mes en curso.</p>
      <form className="grid two" onSubmit={handleSubmit}>
        <label className="field">
          <span>Periodo (YYYY-MM)</span>
          <input name="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="2025-01" disabled={disabled} />
        </label>
        <button className="full" type="submit" disabled={disabled}>
          Generar reporte
        </button>
      </form>
      {status && <p className={`feedback ${status.type}`}>{status.message}</p>}
    </section>
  );
}