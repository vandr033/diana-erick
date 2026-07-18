"use client";

import { useRef, useState } from "react";
import type { Event, SiteSettings } from "@/src/db/schema";

type Confirmation = {
  fullName: string;
  attendsFriday: boolean;
  attendsSaturday: boolean;
  attendsSunday: boolean;
  comment: string | null;
};

type FormValues = {
  fullName: string;
  attendsFriday: string;
  attendsSaturday: string;
  attendsSunday: string;
  comment: string;
};

const initialValues: FormValues = { fullName: "", attendsFriday: "", attendsSaturday: "", attendsSunday: "", comment: "" };

function AttendanceField({ event, value, onChange, error }: { event: Event; value: string; onChange: (value: string) => void; error?: string }) {
  const fieldId = `attendance-${event.slug}`;
  return (
    <fieldset className="attendance-field">
      <legend><span>{event.title}</span><small>{event.subtitle}</small></legend>
      <div className="attendance-options">
        <label className={`attendance-option ${value === "yes" ? "is-selected" : ""}`}>
          <input type="radio" name={fieldId} value="yes" checked={value === "yes"} onChange={() => onChange("yes")} />
          <span>Sí asistiré</span>
        </label>
        <label className={`attendance-option ${value === "no" ? "is-selected" : ""}`}>
          <input type="radio" name={fieldId} value="no" checked={value === "no"} onChange={() => onChange("no")} />
          <span>No asistiré</span>
        </label>
      </div>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function toConfirmation(values: FormValues): Confirmation {
  return {
    fullName: values.fullName.trim(),
    attendsFriday: values.attendsFriday === "yes",
    attendsSaturday: values.attendsSaturday === "yes",
    attendsSunday: values.attendsSunday === "yes",
    comment: values.comment.trim() || null,
  };
}

export function RsvpForm({ settings, events, endpoint = "/api/rsvp" }: { settings: SiteSettings; events: Event[]; endpoint?: string }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  const update = (key: keyof FormValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setIsSending(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, attendsFriday: values.attendsFriday === "yes", attendsSaturday: values.attendsSaturday === "yes", attendsSunday: values.attendsSunday === "yes", honeypot: "" }),
      });
      const payload = await response.json() as { confirmation?: Confirmation; errors?: Record<string, string>; message?: string };
      if (!response.ok) {
        setErrors(payload.errors || {});
        setStatus(payload.message || "No fue posible guardar la respuesta. Intenta nuevamente.");
        return;
      }
      setConfirmation(payload.confirmation || toConfirmation(values));
      window.setTimeout(() => confirmationRef.current?.focus(), 0);
    } catch {
      setStatus("No fue posible guardar la respuesta. Intenta nuevamente.");
    } finally {
      setIsSending(false);
    }
  };

  if (confirmation) {
    const attendanceBySlug = { viernes: confirmation.attendsFriday, sabado: confirmation.attendsSaturday, domingo: confirmation.attendsSunday } as const;
    return (
      <div className="confirmation" aria-live="polite">
        <p className="eyebrow">Respuesta recibida</p>
        <h3 tabIndex={-1} ref={confirmationRef}>{settings.confirmationTitle}</h3>
        <p className="confirmation__message">{settings.confirmationMessage}</p>
        <dl className="confirmation__summary">
          <div><dt>Nombre</dt><dd>{confirmation.fullName}</dd></div>
          {events.map((event) => <div key={event.id}><dt>{event.title}</dt><dd>{attendanceBySlug[event.slug as keyof typeof attendanceBySlug] ? "Sí asistiré" : "No asistiré"}</dd></div>)}
          {confirmation.comment && <div><dt>Comentario</dt><dd>{confirmation.comment}</dd></div>}
        </dl>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={submit} noValidate>
      <div className="form-field">
        <label htmlFor="fullName">{settings.fullNameLabel} <span aria-hidden="true">*</span></label>
        <input id="fullName" name="fullName" value={values.fullName} onChange={(event) => update("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "fullName-error" : undefined} autoComplete="name" />
        {errors.fullName && <p id="fullName-error" className="field-error">{errors.fullName}</p>}
      </div>
      <p className="form-instruction">{settings.attendancePromptLabel}</p>
      {events.map((event) => <AttendanceField key={event.id} event={event} value={values[event.slug === "viernes" ? "attendsFriday" : event.slug === "sabado" ? "attendsSaturday" : "attendsSunday"]} onChange={(value) => update(event.slug === "viernes" ? "attendsFriday" : event.slug === "sabado" ? "attendsSaturday" : "attendsSunday", value)} error={errors[event.slug === "viernes" ? "attendsFriday" : event.slug === "sabado" ? "attendsSaturday" : "attendsSunday"]} />)}
      <div className="form-field">
        <label htmlFor="comment">{settings.commentLabel}</label>
        <textarea id="comment" name="comment" value={values.comment} onChange={(event) => update("comment", event.target.value)} maxLength={1000} rows={4} aria-invalid={Boolean(errors.comment)} />
        {errors.comment && <p className="field-error">{errors.comment}</p>}
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      {status && <p className="form-status" role="alert">{status}</p>}
      <button className="button button--olive form-submit" type="submit" disabled={isSending}>{isSending ? "ENVIANDO…" : settings.submitButtonLabel}</button>
    </form>
  );
}
