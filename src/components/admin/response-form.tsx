"use client";

import { useState } from "react";
import Link from "next/link";
import type { Attendance, RsvpResponse } from "@/src/db/schema";

type Values = { fullName: string; attendsFriday: Attendance; attendsSaturday: Attendance; attendsSunday: Attendance; comment: string };
const fromResponse = (response?: RsvpResponse): Values => ({
  fullName: response?.fullName || "",
  attendsFriday: response?.attendsFriday || "yes",
  attendsSaturday: response?.attendsSaturday || "yes",
  attendsSunday: response?.attendsSunday || "yes",
  comment: response?.comment || "",
});

const choices: { value: Attendance; label: string }[] = [
  { value: "yes", label: "Sí asistiré" },
  { value: "maybe", label: "Tal vez" },
  { value: "no", label: "No asistiré" },
];

function AttendanceChoice({ label, value, onChange }: { label: string; value: Attendance; onChange: (value: Attendance) => void }) {
  return <fieldset className="admin-attendance-field"><legend>{label}</legend><div className="admin-choice-row">{choices.map((choice) => <label className={value === choice.value ? "is-selected" : ""} key={choice.value}><input type="radio" checked={value === choice.value} onChange={() => onChange(choice.value)} /> {choice.label}</label>)}</div></fieldset>;
}

export function ResponseForm({ response, mode = "edit" }: { response?: RsvpResponse; mode?: "new" | "edit" }) {
  const [values, setValues] = useState(() => fromResponse(response));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const update = <Key extends keyof Values>(key: Key, value: Values[Key]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage(""); setIsSaving(true);
    const endpoint = mode === "new" ? "/api/admin/responses" : `/api/admin/responses/${response?.id}`;
    try {
      const result = await fetch(endpoint, { method: mode === "new" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, source: "admin" }) });
      const payload = await result.json() as { message?: string; id?: string };
      if (!result.ok) { setError(payload.message || "No fue posible guardar la respuesta."); return; }
      setMessage(mode === "new" ? "La respuesta se agregó correctamente." : "La respuesta se guardó correctamente.");
      if (mode === "new" && payload.id) window.location.href = `/admin/responses/${payload.id}`;
    } catch { setError("No fue posible guardar la respuesta. Intenta nuevamente."); }
    finally { setIsSaving(false); }
  };

  return <form className="admin-form response-form" onSubmit={submit}>
    <div className="admin-field"><label htmlFor="response-full-name">Nombre completo</label><input id="response-full-name" value={values.fullName} onChange={(event) => update("fullName", event.target.value)} required minLength={2} maxLength={150} /></div>
    <div className="admin-form-grid admin-form-grid--three"><AttendanceChoice label="Viernes" value={values.attendsFriday} onChange={(value) => update("attendsFriday", value)} /><AttendanceChoice label="Sábado" value={values.attendsSaturday} onChange={(value) => update("attendsSaturday", value)} /><AttendanceChoice label="Domingo" value={values.attendsSunday} onChange={(value) => update("attendsSunday", value)} /></div>
    <div className="admin-field"><label htmlFor="response-comment">Comentario adicional</label><textarea id="response-comment" value={values.comment} onChange={(event) => update("comment", event.target.value)} maxLength={1000} rows={5} /></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    <div className="admin-form-actions"><button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>{isSaving ? "Guardando…" : "Guardar respuesta"}</button><Link className="admin-button admin-button--secondary" href={"/admin/responses" as never}>Cancelar</Link></div>
  </form>;
}
