"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { foodOptions, musicStyles, type FlightFeedback, type FoodFeedback, type MusicFeedback } from "@/src/lib/rsvp-feedback";

type Feedback = ({ kind: "food" } & FoodFeedback) | ({ kind: "music" } & MusicFeedback) | ({ kind: "flight" } & FlightFeedback);

function FeedbackDialog({ receipt, label, title, submitLabel, success, feedback, children }: {
  receipt: string;
  label: string;
  title: string;
  submitLabel: string;
  success: string;
  feedback: (data: FormData) => Feedback;
  children: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setStatus("");
    const saveError = "No pudimos guardar tu respuesta. Intenta nuevamente.";
    try {
      const response = await fetch("/api/rsvp/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt, feedback: feedback(new FormData(event.currentTarget)) }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        setError(result?.message || saveError);
        return;
      }
      dialogRef.current?.close();
      setStatus(success);
    } catch {
      setError(saveError);
    } finally {
      setSending(false);
    }
  }

  return <div className="rsvp-feedback__action">
    <button type="button" className="button button--outline" onClick={() => {
      setError("");
      dialogRef.current?.showModal();
    }}>{label}</button>
    <p className="rsvp-feedback__status" role="status">{status}</p>
    <dialog ref={dialogRef} className="event-dialog rsvp-feedback__dialog" aria-labelledby={titleId}>
      <div className="event-dialog__inner">
        <button type="button" className="dialog-close" autoFocus onClick={() => dialogRef.current?.close()}>Cerrar</button>
        <h2 id={titleId}>{title}</h2>
        <form className="rsvp-feedback__form" onSubmit={submit}>
          {children}
          {error && <p className="field-error" role="alert">{error}</p>}
          <button type="submit" className="button button--olive" disabled={sending}>{sending ? "Enviando…" : submitLabel}</button>
        </form>
      </div>
    </dialog>
  </div>;
}

export function RsvpFeedback({ receipt }: { receipt: string }) {
  return <div className="rsvp-feedback">
    <FeedbackDialog receipt={receipt} label="¿Alguna restricción alimentaria?" title="Restricciones alimentarias"
      submitLabel="Enviar restricciones" success="Restricciones guardadas."
      feedback={(data) => {
        const selected = data.getAll("option");
        return { kind: "food", options: foodOptions.filter((option) => selected.includes(option)), details: String(data.get("details") ?? "") };
      }}>
      <fieldset className="rsvp-feedback__presets">
        <legend>Selecciona las opciones que apliquen</legend>
        <div>{foodOptions.map((option) => <label key={option}><input type="checkbox" name="option" value={option} /><span>{option}</span></label>)}</div>
      </fieldset>
      <label className="form-field">
        <span>Detalles</span>
        <textarea name="details" rows={3} maxLength={500} placeholder="Ej. Ana tiene alergia al maní." />
      </label>
      <p className="rsvp-feedback__hint">Si eliges «Otra» o «Alergia alimentaria», cuéntanos qué debemos tener en cuenta y para quién.</p>
    </FeedbackDialog>
    <FeedbackDialog receipt={receipt} label="¿Sugerencias de canciones?" title="Sugerencias de canciones"
      submitLabel="Enviar sugerencia" success="Sugerencia guardada."
      feedback={(data) => ({
        kind: "music",
        song: String(data.get("song") ?? ""),
        style: musicStyles.find((style) => style === data.get("style")),
      })}>
      <label className="form-field">
        <span>Canción y artista</span>
        <textarea name="song" rows={2} maxLength={500} placeholder="Ej. September · Earth, Wind & Fire" required />
      </label>
      <label className="form-field">
        <span>Estilo o momento</span>
        <select name="style" defaultValue="">
          <option value="">Sin preferencia</option>
          {musicStyles.map((style) => <option key={style}>{style}</option>)}
        </select>
      </label>
    </FeedbackDialog>
    <FeedbackDialog receipt={receipt} label="¿Llegas en avión?" title="Vuelos a Santa Cruz"
      submitLabel="Enviar datos de vuelo" success="Datos de vuelo guardados."
      feedback={(data) => ({
        kind: "flight",
        arrival: String(data.get("arrival") ?? ""),
        departure: String(data.get("departure") ?? "") || undefined,
        notes: String(data.get("notes") ?? ""),
      })}>
      <label className="form-field">
        <span>Llegada a Santa Cruz (SCZ)</span>
        <input type="datetime-local" name="arrival" required />
      </label>
      <label className="form-field">
        <span>Salida de Santa Cruz (opcional)</span>
        <input type="datetime-local" name="departure" />
      </label>
      <p className="rsvp-feedback__hint">Usa la fecha y hora local de Santa Cruz.</p>
      <label className="form-field">
        <span>Comentarios (opcional)</span>
        <textarea name="notes" rows={3} maxLength={500} placeholder="Ciudad de origen, escalas, número de vuelo…" />
      </label>
    </FeedbackDialog>
  </div>;
}
