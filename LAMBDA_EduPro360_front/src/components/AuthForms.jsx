import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

function TextField({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

function Feedback({ message, tone = "info" }) {
  if (!message) return null;
  return <p className={`feedback ${tone}`}>{message}</p>;
}

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Verificando credenciales..." });
    try {
      await login(email, password);
      setStatus({ type: "success", message: "¡Sesión iniciada! Token JWT guardado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <TextField label="Correo institucional" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Iniciar sesión</button>
      <Feedback tone={status?.type === "error" ? "error" : "success"} message={status?.message} />
    </form>
  );
}

export function RegistroForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "", last_name: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Creando usuario..." });
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });
      setStatus({ type: "success", message: "Usuario registrado y autenticado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="grid two">
        <TextField label="Nombre" name="first_name" value={form.first_name} onChange={handleChange} />
        <TextField label="Apellido" name="last_name" value={form.last_name} onChange={handleChange} />
      </div>
      <TextField label="Usuario" name="username" value={form.username} onChange={handleChange} required />
      <TextField label="Correo" name="email" type="email" value={form.email} onChange={handleChange} required />
      <TextField label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} required />
      <button type="submit">Registrarme</button>
      <Feedback tone={status?.type === "error" ? "error" : "success"} message={status?.message} />
    </form>
  );
}

export function RecuperacionForm() {
  const { requestRecovery, confirmRecovery } = useAuth();
  const [step, setStep] = useState("solicitar");
  const [email, setEmail] = useState("");
  const [payload, setPayload] = useState({ token: "", nueva_contrasena: "" });
  const [status, setStatus] = useState(null);

  const help = useMemo(
    () =>
      step === "solicitar"
        ? "Recibirás un token de recuperación en tu correo registrado."
        : "Usa el token recibido para actualizar tu contraseña.",
    [step],
  );

  const handleSolicitar = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Enviando solicitud..." });
    try {
      await requestRecovery(email);
      setStatus({ type: "success", message: "Revisa tu bandeja. Se generó el token de recuperación." });
      setStep("confirmar");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Actualizando contraseña..." });
    try {
      await confirmRecovery(payload);
      setStatus({ type: "success", message: "Contraseña actualizada. Ya puedes iniciar sesión." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className="stack">
      <p className="hint">{help}</p>
      {step === "solicitar" ? (
        <form className="stack" onSubmit={handleSolicitar}>
          <TextField label="Correo registrado" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit">Solicitar token</button>
        </form>
      ) : (
        <form className="stack" onSubmit={handleConfirmar}>
          <TextField label="Token" value={payload.token} onChange={(e) => setPayload({ ...payload, token: e.target.value })} required />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={payload.nueva_contrasena}
            onChange={(e) => setPayload({ ...payload, nueva_contrasena: e.target.value })}
            required
          />
          <button type="submit">Guardar contraseña</button>
        </form>
      )}
      <Feedback tone={status?.type === "error" ? "error" : "success"} message={status?.message} />
    </div>
  );
}