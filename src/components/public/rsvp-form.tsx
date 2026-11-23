"use client";

import { useRef, useState } from "react";
import type { Attendance, AttendanceDay, Event, InvitationPhase, PartyResponse, PersonRsvp, SiteSettings } from "@/src/db/schema";
import { companionLabel, rsvpDays } from "@/src/lib/invitation-party";

type Confirmation = {
  fullName: string;
  attendsFriday: Attendance;
  attendsSaturday: Attendance;
  attendsSunday: Attendance;
  comment: string | null;
  party?: PartyResponse | null;
};

type RsvpFormSettings = Pick<SiteSettings, "attendancePromptLabel" | "commentLabel" | "confirmationMessage" | "confirmationTitle" | "fullNameLabel" | "submitButtonLabel">;

type FormValues = {
  fullName: string;
  attendsFriday: Attendance | "";
  attendsSaturday: Attendance | "";
  attendsSunday: Attendance | "";
  comment: string;
};

const initialValues: FormValues = { fullName: "", attendsFriday: "", attendsSaturday: "", attendsSunday: "", comment: "" };

const attendanceLabels: Record<Attendance, string> = {
  yes: "Sí asistiré",
  maybe: "Tal vez",
  no: "No asistiré",
};
const personAttendanceLabels = { yes: "Va", no: "No va", maybe: "Tal vez" };
type PersonDraft = Omit<PersonRsvp, "attendance"> & { attendance: PersonRsvp["attendance"] | "" };

function AttendanceField({ fieldId, title, subtitle, value, onChange, labels = attendanceLabels, allowMaybe = false, error }: {
  fieldId: string; title: string; subtitle?: string; value: Attendance | ""; onChange: (value: Attendance) => void;
  labels?: Record<Attendance, string>; allowMaybe?: boolean; error?: string;
}) {
  const choices: Attendance[] = allowMaybe ? ["yes", "maybe", "no"] : ["yes", "no"];
  return (
    <fieldset className="attendance-field">
      <legend><span id={`${fieldId}-name`}>{title}</span>{subtitle && <small>{subtitle}</small>}</legend>
      <div className={`attendance-options${allowMaybe ? "" : " attendance-options--binary"}`}>
        {choices.map((choice) => (
          <label className={`attendance-option ${value === choice ? "is-selected" : ""}`} key={choice}>
            <input type="radio" name={fieldId} value={choice} checked={value === choice} onChange={() => onChange(choice)} />
            <span>{labels[choice]}</span>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function toConfirmation(values: FormValues): Confirmation {
  return {
    fullName: values.fullName.trim(),
    attendsFriday: values.attendsFriday || "no",
    attendsSaturday: values.attendsSaturday || "no",
    attendsSunday: values.attendsSunday || "no",
    comment: values.comment.trim() || null,
  };
}

function DayAttendance({ event, names, people, onChange }: {
  event: Event;
  names: string[];
  people: PersonDraft[];
  onChange: (people: PersonDraft[]) => void;
}) {
  const updatePerson = (index: number, change: Partial<PersonDraft>) => {
    onChange(people.map((person, position) => position === index ? { ...person, ...change } : person));
  };

  return <fieldset className="attendance-field rsvp-day">
    <legend><span>{event.title}</span><small>{event.subtitle}</small></legend>
    {names.length > 1 && <div className="attendance-options attendance-options--binary">
      <button className="attendance-option" type="button" onClick={() => onChange(people.map((person) => ({ ...person, attendance: "yes" })))}>Todos vamos</button>
      <button className="attendance-option" type="button" onClick={() => onChange(people.map((person) => ({ ...person, attendance: "no" })))}>Nadie va</button>
    </div>}
    {people.map((person, index) => {
      const personId = `${event.slug}-person-${index}`;
      const commentId = `${personId}-comment`;
      return <div className="rsvp-person" key={index}>
        <AttendanceField fieldId={personId} title={names[index]} labels={personAttendanceLabels} value={person.attendance} onChange={(choice) => {
          if (choice !== "maybe") updatePerson(index, { attendance: choice });
        }} />
        <label className="rsvp-comment-toggle">
          <input type="checkbox" aria-describedby={`${personId}-name`} checked={person.comment !== undefined} onChange={(change) => updatePerson(index, { comment: change.target.checked ? "" : undefined })} />
          Agregar comentario
        </label>
        {person.comment !== undefined && <div className="form-field">
          <label className="sr-only" htmlFor={commentId}>Comentario de {names[index]} · {event.title}</label>
          <textarea id={commentId} rows={3} maxLength={1000} value={person.comment} onChange={(change) => updatePerson(index, { comment: change.target.value })} />
        </div>}
      </div>;
    })}
  </fieldset>;
}

export function RsvpForm({ settings, events, endpoint = "/api/rsvp", initialFullName = "", invitationToken, phase, companions = [] }: { settings: RsvpFormSettings; events: Event[]; endpoint?: string; initialFullName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[] }) {
  const isFinal = phase === "final";
  const days = rsvpDays.flatMap(({ slug, field }) => {
    const event = events.find((item) => item.slug === slug);
    return event ? [{ event, field }] : [];
  });
  const [values, setValues] = useState(() => ({ ...initialValues, fullName: initialFullName }));
  const names = [values.fullName.trim() || "Tú", ...companions.map(companionLabel)];
  const [attendanceByDay, setAttendanceByDay] = useState<Partial<Record<AttendanceDay, PersonDraft[]>>>(() =>
    isFinal ? Object.fromEntries(days.map(({ field }) => [field, Array.from({ length: companions.length + 1 }, () => ({ attendance: "" }))])) : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  const update = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    const unansweredDay = isFinal && days.find(({ field }) => attendanceByDay[field]?.some((person) => !person.attendance));
    if (unansweredDay) {
      setStatus(`Indica si asistirá cada persona a ${unansweredDay.event.title}.`);
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          honeypot: "",
          invitationToken,
          phase,
          companions: isFinal && companions.length ? companions : undefined,
          attendanceByDay: isFinal ? attendanceByDay : undefined,
        }),
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
    const confirmedNames = [confirmation.fullName, ...(confirmation.party?.companions.map(companionLabel) ?? [])];
    return (
      <div className="confirmation" aria-live="polite">
        <p className="eyebrow">Respuesta recibida</p>
        <h3 tabIndex={-1} ref={confirmationRef}>{settings.confirmationTitle}</h3>
        <p className="confirmation__message">{settings.confirmationMessage}</p>
        <dl className="confirmation__summary">
          <div><dt>Nombre</dt><dd>{confirmation.fullName}</dd></div>
          {days.map(({ event, field }) => {
            const people = confirmation.party?.attendanceByDay?.[field];
            return <div key={event.id}><dt>{event.title}</dt><dd>{people
              ? <ul>{people.map((person, index) => <li key={index}>{confirmedNames[index]} · {personAttendanceLabels[person.attendance]}{person.comment && <p>{person.comment}</p>}</li>)}</ul>
              : attendanceLabels[confirmation[field]]}</dd></div>;
          })}
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
      <p className="form-instruction">{isFinal ? "Confirma la asistencia de cada persona por día." : settings.attendancePromptLabel}</p>
      {days.map(({ event, field }) => isFinal
        ? <DayAttendance key={event.id} event={event} names={names} people={attendanceByDay[field] ?? []}
            onChange={(people) => setAttendanceByDay((current) => ({ ...current, [field]: people }))} />
        : <AttendanceField key={event.id} fieldId={`attendance-${event.slug}`} title={event.title} subtitle={event.subtitle}
            value={values[field]} onChange={(choice) => update(field, choice)} error={errors[field]} allowMaybe />)}
      {!isFinal && <div className="form-field">
        <label htmlFor="comment">{settings.commentLabel}</label>
        <textarea id="comment" name="comment" value={values.comment} onChange={(event) => update("comment", event.target.value)} maxLength={1000} rows={4} aria-invalid={Boolean(errors.comment)} />
        {errors.comment && <p className="field-error">{errors.comment}</p>}
      </div>}
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      {status && <p className="form-status" role="alert">{status}</p>}
      <button className="button button--olive form-submit" type="submit" disabled={isSending}>{isSending ? "ENVIANDO…" : settings.submitButtonLabel}</button>
    </form>
  );
}
