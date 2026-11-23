"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { describeFoodFeedback, type FlightFeedback, type FoodFeedback, type MusicFeedback } from "@/src/lib/rsvp-feedback";

type Feedback = ({ kind: "food" } & Extract<FoodFeedback, { hasRestrictions: string }>) | ({ kind: "music" } & MusicFeedback) | ({ kind: "flight" } & FlightFeedback);

function FeedbackDialog({ receipt, section, label, title, submitLabel, success, submitted, feedback, children }: {
  receipt: string;
  section: string;
  label: string;
  title: string;
  submitLabel: string;
  success: string;
  submitted?: boolean;
  feedback: (data: FormData) => Feedback;
  children: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState(submitted ? success : "");
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

  return <section className="guest-guide__group">
    <h3>{section}</h3>
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
  </section>;
}

export function RsvpFeedback({ receipt, food, music, flight }: { receipt: string; food?: FoodFeedback | null; music?: MusicFeedback | null; flight?: FlightFeedback | null }) {
  const previousFood = food ? describeFoodFeedback(food) : null;
  const [foodAnswer, setFoodAnswer] = useState(previousFood?.answer === "Sí" ? "yes" : previousFood ? "no" : "");
  return <>
    <FeedbackDialog receipt={receipt} section="Comida" label="¿Alguna restricción alimentaria?" title="Restricciones alimentarias"
      submitted={Boolean(food)}
      submitLabel="Enviar restricciones" success="Restricciones guardadas."
      feedback={(data) => ({
        kind: "food", hasRestrictions: data.get("hasRestrictions") === "yes" ? "yes" : "no",
        details: String(data.get("details") ?? ""),
      })}>
      <fieldset className="rsvp-feedback__options">
        <legend>¿Tienen alguna restricción alimentaria?</legend>
        <div>{(["yes", "no"] as const).map((answer) => <label key={answer}>
          <input type="radio" name="hasRestrictions" value={answer} checked={foodAnswer === answer}
            required onChange={() => setFoodAnswer(answer)} /> <span>{answer === "yes" ? "Sí" : "No"}</span>
        </label>)}</div>
      </fieldset>
      <label className="form-field">
        <span>Detalles</span>
        <textarea name="details" rows={3} maxLength={500} defaultValue={previousFood?.details} required={foodAnswer === "yes"}
          placeholder="Ej. Ana tiene alergia al maní." />
      </label>
    </FeedbackDialog>
    <FeedbackDialog receipt={receipt} section="Música" label="¿Sugerencias de canciones?" title="Sugerencias de canciones"
      submitted={Boolean(music)}
      submitLabel="Enviar sugerencia" success="Sugerencia guardada."
      feedback={(data) => ({
        kind: "music",
        song: String(data.get("song") ?? ""),
      })}>
      <label className="form-field">
        <span>Canción y artista</span>
        <textarea name="song" rows={2} maxLength={500} defaultValue={music?.song} placeholder="Ej. September · Earth, Wind & Fire" required />
      </label>
    </FeedbackDialog>
    <FeedbackDialog receipt={receipt} section="Vuelos" label="¿Llegas en avión?" title="Vuelos a Santa Cruz"
      submitted={Boolean(flight)}
      submitLabel="Enviar datos de vuelo" success="Datos de vuelo guardados."
      feedback={(data) => ({
        kind: "flight",
        arrival: String(data.get("arrival") ?? ""),
        departure: String(data.get("departure") ?? "") || undefined,
        notes: String(data.get("notes") ?? ""),
      })}>
      <label className="form-field">
        <span>Llegada a Santa Cruz (SCZ)</span>
        <input type="datetime-local" name="arrival" defaultValue={flight?.arrival} required />
      </label>
      <label className="form-field">
        <span>Salida de Santa Cruz (opcional)</span>
        <input type="datetime-local" name="departure" defaultValue={flight?.departure} />
      </label>
      <p className="rsvp-feedback__hint">Usa la fecha y hora local de Santa Cruz.</p>
      <label className="form-field">
        <span>Comentarios (opcional)</span>
        <textarea name="notes" rows={3} maxLength={500} defaultValue={flight?.notes} placeholder="Ciudad de origen, escalas, número de vuelo…" />
      </label>
    </FeedbackDialog>
  </>;
}
