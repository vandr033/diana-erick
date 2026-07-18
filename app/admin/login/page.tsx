"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSending(true);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) { setError(payload.message || "El correo o la contraseña no son correctos."); return; }
      window.location.href = "/admin";
    } catch { setError("No fue posible iniciar sesión. Intenta nuevamente."); }
    finally { setIsSending(false); }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <p className="admin-eyebrow">Diana & Erick · 2027</p>
        <h1>Bienvenida, administración</h1>
        <p className="admin-login-copy">Ingresa para gestionar confirmaciones y contenido de la invitación.</p>
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-field"><label htmlFor="email">Correo electrónico</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
          <div className="admin-field"><label htmlFor="password">Contraseña</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-button admin-button--primary" type="submit" disabled={isSending}>{isSending ? "Ingresando…" : "Ingresar"}</button>
        </form>
        <Link className="admin-back-link" href={"/" as never}>← Volver a la invitación</Link>
      </div>
    </main>
  );
}
