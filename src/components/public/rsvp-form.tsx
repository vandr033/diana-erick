"use client";

import { useRef, useState } from "react";
import type { Attendance, Event, InvitationPhase, PartyResponse, SiteSettings } from "@/src/db/schema";
import { companionLabel } from "@/src/lib/invitation-party";

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
const groupLabels = { yes: "Sí, vamos todos", no: "No vamos", maybe: "Tal vez" };
const companionAttendanceLabels = { yes: "Sí asiste", no: "No asiste", maybe: "Tal vez" };
const attendanceFieldByDay = { viernes: "attendsFriday", sabado: "attendsSaturday", domingo: "attendsSunday" } as const;

function AttendanceField({ fieldId, title, subtitle, value, onChange, labels = attendanceLabels, allowMaybe = false, error }: {
  fieldId: string; title: string; subtitle?: string; value: Attendance | ""; onChange: (value: Attendance) => void;
  labels?: Record<Attendance, string>; allowMaybe?: boolean; error?: string;
}) {
  const choices: Attendance[] = allowMaybe ? ["yes", "maybe", "no"] : ["yes", "no"];
  return (
    <fieldset className="attendance-field">
      <legend><span>{title}</span>{subtitle && <small>{subtitle}</small>}</legend>
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

export function RsvpForm({ settings, events, endpoint = "/api/rsvp", initialFullName = "", invitationToken, phase, companions = [] }: { settings: RsvpFormSettings; events: Event[]; endpoint?: string; initialFullName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[] }) {
  const isFinal = phase === "final";
  const hasCompanions = isFinal && companions.length > 0;
  const individualSaturday = hasCompanions && endpoint === "/api/rsvp/sabado" && events.some((event) => event.slug === "sabado");
  const groupAttendance = hasCompanions && endpoint !== "/api/rsvp/sabado";
  const companionNames = companions.map(companionLabel);
  const [values, setValues] = useState(() => ({ ...initialValues, fullName: initialFullName }));
  const [saturdayAttendance, setSaturdayAttendance] = useState<(Attendance | "")[]>(() => Array(companions.length + 1).fill(""));
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
          companions: hasCompanions ? companions : undefined,
          saturdayAttendance: individualSaturday ? saturdayAttendance : undefined,
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
    const individual = confirmation.party?.saturdayAttendance;
    return (
      <div className="confirmation" aria-live="polite">
        <p className="eyebrow">Respuesta recibida</p>
        <h3 tabIndex={-1} ref={confirmationRef}>{settings.confirmationTitle}</h3>
        <p className="confirmation__message">{settings.confirmationMessage}</p>
        <dl className="confirmation__summary">
          <div><dt>Nombre</dt><dd>{confirmation.fullName}</dd></div>
          {confirmation.party && !individual && <div><dt>Acompañantes</dt><dd>{confirmation.party.companions.map(companionLabel).join(", ")}</dd></div>}
          {individual ? individual.map((choice, index) => <div key={index}>
            <dt>{index === 0 ? "Tú" : companionNames[index - 1]}</dt>
            <dd>{index === 0 ? attendanceLabels[choice] : companionAttendanceLabels[choice]}</dd>
          </div>) : events.map((event) => {
            const field = attendanceFieldByDay[event.slug as keyof typeof attendanceFieldByDay] ?? "attendsSunday";
            return <div key={event.id}><dt>{event.title}</dt><dd>{(groupAttendance ? groupLabels : attendanceLabels)[confirmation[field]]}</dd></div>;
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
      {groupAttendance && <p className="rsvp-companions">Acompañantes: {companionNames.join(", ")}</p>}
      <p className="form-instruction">{individualSaturday ? "Indica quién asistirá el sábado." : groupAttendance ? "Confirma la asistencia de todo tu grupo para cada día." : settings.attendancePromptLabel}</p>
      {individualSaturday ? ["Tú", ...companionNames].map((name, index) => (
        <AttendanceField key={index} fieldId={`saturday-person-${index}`} title={name} value={saturdayAttendance[index]}
          labels={index === 0 ? attendanceLabels : companionAttendanceLabels}
          onChange={(choice) => setSaturdayAttendance((answers) => answers.map((answer, position) => position === index ? choice : answer))} />
      )) : events.map((event) => {
        const field = attendanceFieldByDay[event.slug as keyof typeof attendanceFieldByDay] ?? "attendsSunday";
        return <AttendanceField key={event.id} fieldId={`attendance-${event.slug}`} title={event.title} subtitle={event.subtitle}
          value={values[field]} onChange={(choice) => update(field, choice)} labels={groupAttendance ? groupLabels : attendanceLabels}
          error={errors[field]} allowMaybe={!isFinal} />;
      })}
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
