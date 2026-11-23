"use client";

import { useState, type FormEvent } from "react";
import type { FaqEntry } from "@/src/lib/wedding-guide";

export function FaqForm({ initialEntries }: { initialEntries: FaqEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function update(id: string, change: Partial<FaqEntry>) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...change } : entry));
  }

  function move(index: number, offset: number) {
    const next = [...entries];
    const [entry] = next.splice(index, 1);
    next.splice(index + offset, 0, entry);
    setEntries(next);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });
      const result = await response.json() as { entries?: FaqEntry[]; message?: string };
      if (!response.ok || !result.entries) {
        setError(result.message || "No se pudieron guardar las preguntas.");
        return;
      }
      setEntries(result.entries);
      setStatus("Preguntas guardadas.");
    } catch {
      setError("No se pudieron guardar las preguntas.");
    } finally {
      setSending(false);
    }
  }

  return <form className="admin-form" onSubmit={save}>
    <fieldset className="admin-form" disabled={sending}>
      {entries.map((entry, index) => <section className="admin-form-section" aria-label={entry.question || "Nueva pregunta"} key={entry.id}>
        <div className="admin-field">
          <label htmlFor={`question-${entry.id}`}>Pregunta</label>
          <input id={`question-${entry.id}`} value={entry.question} onChange={(event) => update(entry.id, { question: event.target.value })} required maxLength={160} />
        </div>
        <div className="admin-field">
          <label htmlFor={`answer-${entry.id}`}>Respuesta</label>
          <textarea id={`answer-${entry.id}`} rows={3} value={entry.answer} onChange={(event) => update(entry.id, { answer: event.target.value })} required maxLength={1500} />
        </div>
        <label className="admin-toggle">
          <input type="checkbox" checked={entry.published} onChange={(event) => update(entry.id, { published: event.target.checked })} /> Publicada
        </label>
        <div className="admin-actions">
          <button className="admin-button admin-button--secondary" type="button" disabled={index === 0} onClick={() => move(index, -1)}>Subir</button>
          <button className="admin-button admin-button--secondary" type="button" disabled={index === entries.length - 1} onClick={() => move(index, 1)}>Bajar</button>
          <button className="admin-button admin-button--secondary" type="button" onClick={() => setEntries((current) => current.filter(({ id }) => id !== entry.id))}>Quitar</button>
        </div>
      </section>)}
      <div className="admin-actions">
        <button className="admin-button admin-button--secondary" type="button" disabled={entries.length >= 50} onClick={() =>
          setEntries((current) => [...current, { id: crypto.randomUUID(), question: "", answer: "", published: false }])}>Agregar pregunta</button>
        <button className="admin-button admin-button--primary" type="submit">{sending ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </fieldset>
    {status && <p className="admin-note" role="status">{status}</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </form>;
}
