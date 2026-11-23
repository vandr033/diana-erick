"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Attendance, AttendanceDay, Event, InvitationPhase, PartyResponse, PersonRsvp, SiteSettings } from "@/src/db/schema";
import { companionLabel, rsvpDays, transportLabels } from "@/src/lib/invitation-party";

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
const personAttendanceLabels = { yes: "Va", no: "No va" };
const groupAttendanceLabels = { yes: "Todos vamos", no: "Nadie va", some: "Algunos" };
const groupTransportLabels = { yes: "Todos", no: "Nadie", some: "Algunos" };
type PersonDraft = Omit<PersonRsvp, "attendance"> & { attendance: PersonRsvp["attendance"] | "" };

const needsTransportAnswer = (person: PersonDraft) => person.attendance === "yes" && !person.transport;

function groupAnswer(answers: (PersonDraft["attendance"] | undefined)[]) {
  const [first] = answers;
  if (!first || answers.some((answer) => !answer)) return "";
  return answers.every((answer) => answer === first) ? first : "some";
}

function AttendanceOptions<Choice extends string>({ fieldId, value, onChange, labels, choices }: {
  fieldId: string; value: Choice | ""; onChange: (value: Choice) => void;
  labels: Record<Choice, string>; choices: readonly Choice[];
}) {
  return (
    <div className={`attendance-options${choices.length === 2 ? " attendance-options--binary" : ""}`}>
      {choices.map((choice) => (
        <label className={`attendance-option ${value === choice ? "is-selected" : ""}`} key={choice}>
          <input type="radio" name={fieldId} value={choice} checked={value === choice} onChange={() => onChange(choice)} />
          <span>{labels[choice]}</span>
        </label>
      ))}
    </div>
  );
}

function AttendanceField({ fieldId, title, subtitle, value, onChange, error }: {
  fieldId: string; title: string; subtitle: string; value: Attendance | ""; onChange: (value: Attendance) => void; error?: string;
}) {
  return (
    <fieldset className="attendance-field">
      <legend><span>{title}</span>{subtitle && <small>{subtitle}</small>}</legend>
      <AttendanceOptions fieldId={fieldId} value={value} onChange={onChange} labels={attendanceLabels} choices={["yes", "maybe", "no"]} />
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

function DayAttendance({ event, names, people, open, onToggle, incomplete, onChange }: {
  event: Event;
  names: string[];
  people: PersonDraft[];
  open: boolean;
  onToggle: () => void;
  incomplete: boolean;
  onChange: (people: PersonDraft[]) => void;
}) {
  const [customAttendance, setCustomAttendance] = useState(false);
  const [customTransport, setCustomTransport] = useState(false);
  const panelId = `rsvp-${event.slug}`;
  const buttonId = `${panelId}-toggle`;
  const pending = people.some((person) => !person.attendance);
  const transportPending = people.some(needsTransportAnswer);
  const attendees = people.filter((person) => person.attendance === "yes");
  const attending = attendees.length;
  const hasGroup = people.length > 1;
  const summary = pending || transportPending ? "Pendiente" : people.length === 1
    ? (attending ? "Va" : "No va")
    : (attending ? `${attending} de ${people.length} asisten` : "Nadie va");
  const hasComments = people.some((person) => person.comment?.trim());
  const updatePerson = (index: number, change: Partial<PersonDraft>) => {
    onChange(people.map((person, position) => position === index ? { ...person, ...change } : person));
  };
  const answerAttendance = (answer: "yes" | "no" | "some") => {
    setCustomAttendance(answer === "some");
    if (answer === "some") return;
    onChange(people.map((person) => ({ ...person, attendance: answer, transport: answer === "yes" ? person.transport : undefined })));
  };
  const answerTransport = (answer: "yes" | "no" | "some") => {
    setCustomTransport(answer === "some");
    if (answer === "some") return;
    onChange(people.map((person) => person.attendance === "yes" ? { ...person, transport: answer } : person));
  };

  return <div className="rsvp-day">
    <h3>
      <button className="rsvp-day__toggle" id={buttonId} type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span><span className="rsvp-day__title">{event.title}</span><small>{event.subtitle}</small></span>
        <span className="rsvp-day__status" aria-live="polite">{summary}</span>
      </button>
    </h3>
    <div id={panelId} role="group" aria-labelledby={buttonId} hidden={!open}>
      <div className="rsvp-day__choices" role="group" aria-label="Asistencia">
        {hasGroup
          ? <AttendanceOptions fieldId={`${panelId}-attendance`} value={customAttendance ? "some" : groupAnswer(people.map((person) => person.attendance))}
              onChange={answerAttendance} labels={groupAttendanceLabels} choices={["yes", "no", "some"]} />
          : <AttendanceOptions fieldId={`${panelId}-attendance`} value={people[0]?.attendance ?? ""}
              onChange={answerAttendance} labels={personAttendanceLabels} choices={["yes", "no"]} />}
      </div>
      {incomplete && pending && <p className="field-error rsvp-day__error" role="alert">Completa la asistencia antes de enviar.</p>}
      {hasGroup && customAttendance && people.map((person, index) => {
        const personId = `${panelId}-person-${index}`;
        return <div className="rsvp-person" role="group" aria-labelledby={`${personId}-name`} key={index}>
          <span id={`${personId}-name`}>{names[index]}</span>
          <AttendanceOptions fieldId={personId} value={person.attendance} onChange={(attendance) => updatePerson(index, { attendance, transport: attendance === "yes" ? person.transport : undefined })}
            labels={personAttendanceLabels} choices={["yes", "no"]} />
        </div>;
      })}
      <div className="rsvp-transport" role="group" aria-labelledby={`${panelId}-transport-title`}>
        <div className="rsvp-transport__heading">
          <h4 id={`${panelId}-transport-title`}>¿Van a necesitar transporte?</h4>
          <Link id={`transporte-${event.slug}`} href={`?transporte=${event.slug}`} prefetch={false}
            aria-label={`Información de transporte para ${event.title}`}
            onNavigate={(navigation) => {
              navigation.preventDefault();
              const url = new URL(window.location.href);
              url.searchParams.set("transporte", event.slug);
              url.hash = "";
              window.history.pushState({ fromInvitationRsvp: true }, "", url);
            }}>Info</Link>
        </div>
        {!pending && attending > 0 && <div className="rsvp-day__choices">
          {attending > 1
            ? <AttendanceOptions fieldId={`${panelId}-transport`} value={customTransport ? "some" : groupAnswer(attendees.map((person) => person.transport))}
                onChange={answerTransport} labels={groupTransportLabels} choices={["yes", "no", "some"]} />
            : <AttendanceOptions fieldId={`${panelId}-transport`} value={attendees[0].transport ?? ""}
                onChange={answerTransport} labels={transportLabels} choices={["yes", "no"]} />}
        </div>}
        {incomplete && !pending && transportPending && <p className="field-error rsvp-day__error" role="alert">Indica quién necesita transporte antes de enviar.</p>}
        {!pending && attending > 1 && customTransport && people.map((person, index) => {
          if (person.attendance !== "yes") return null;
          const id = `${panelId}-transport-${index}`;
          return <div className="rsvp-person" role="group" aria-labelledby={`${id}-name`} key={id}>
            <span id={`${id}-name`}>{names[index]}</span>
            <AttendanceOptions fieldId={id} value={person.transport ?? ""} onChange={(transport) => updatePerson(index, { transport })}
              labels={transportLabels} choices={["yes", "no"]} />
          </div>;
        })}
      </div>
      <details className="rsvp-comments">
        <summary>{hasComments ? "Editar comentarios" : "Agregar comentarios (opcional)"}</summary>
        <div className="rsvp-comments__fields">
          {people.map((person, index) => {
            const commentId = `${panelId}-comment-${index}`;
            return <div className="form-field" key={index}>
              <label htmlFor={commentId}>Comentario de {names[index]}</label>
              <textarea id={commentId} rows={2} maxLength={1000} value={person.comment ?? ""} onChange={(change) => updatePerson(index, { comment: change.target.value || undefined })} />
            </div>;
          })}
        </div>
      </details>
    </div>
  </div>;
}

export function RsvpForm({ settings, events, endpoint = "/api/rsvp", initialFullName = "", invitationToken, phase, companions = [] }: { settings: RsvpFormSettings; events: Event[]; endpoint?: string; initialFullName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[] }) {
  const isFinal = phase === "final";
  const days = rsvpDays.flatMap(({ slug, field }) => {
    const event = events.find((item) => item.slug === slug);
    return event ? [{ event, field }] : [];
  });
  const [values, setValues] = useState(() => ({ ...initialValues, fullName: initialFullName }));
  const [editingName, setEditingName] = useState(!initialFullName);
  const [openDay, setOpenDay] = useState<AttendanceDay | undefined>(days[0]?.field);
  const [incompleteDay, setIncompleteDay] = useState<AttendanceDay>();
  const names = [values.fullName.trim() || "Tú", ...companions.map(companionLabel)];
  const [attendanceByDay, setAttendanceByDay] = useState<Partial<Record<AttendanceDay, PersonDraft[]>>>(() =>
    isFinal ? Object.fromEntries(days.map(({ field }) => [field, Array.from({ length: companions.length + 1 }, () => ({ attendance: "" }))])) : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);

  const editName = () => {
    setEditingName(true);
    requestAnimationFrame(() => fullNameRef.current?.focus());
  };

  const update = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setIncompleteDay(undefined);
    const unansweredDay = isFinal && days.find(({ field }) => attendanceByDay[field]?.some((person) => !person.attendance || needsTransportAnswer(person)));
    if (unansweredDay) {
      setOpenDay(unansweredDay.field);
      setIncompleteDay(unansweredDay.field);
      document.getElementById(`rsvp-${unansweredDay.event.slug}-toggle`)?.focus();
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
        if (isFinal && payload.errors?.fullName) editName();
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
              ? <ul>{people.map((person, index) => <li key={index}>{confirmedNames[index]} · {personAttendanceLabels[person.attendance]}{person.transport && <> · Transporte {transportLabels[person.transport]}</>}{person.comment && <p>{person.comment}</p>}</li>)}</ul>
              : attendanceLabels[confirmation[field]]}</dd></div>;
          })}
          {confirmation.comment && <div><dt>Comentario</dt><dd>{confirmation.comment}</dd></div>}
        </dl>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={submit} noValidate>
      {isFinal && !editingName ? <div className="rsvp-recipient">
        <p>Confirmación de <strong>{values.fullName}</strong></p>
        <button type="button" onClick={editName}>Editar nombre</button>
      </div> : <div className="form-field">
        <label htmlFor="fullName">{settings.fullNameLabel} <span aria-hidden="true">*</span></label>
        <input id="fullName" name="fullName" ref={fullNameRef} value={values.fullName} onChange={(event) => update("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "fullName-error" : undefined} autoComplete="name" />
        {errors.fullName && <p id="fullName-error" className="field-error">{errors.fullName}</p>}
      </div>}
      {isFinal ? <div className="rsvp-days">
        {days.map(({ event, field }) => <DayAttendance key={event.id} event={event} names={names} people={attendanceByDay[field] ?? []}
          open={openDay === field} onToggle={() => setOpenDay((current) => current === field ? undefined : field)}
          incomplete={incompleteDay === field}
          onChange={(people) => setAttendanceByDay((current) => ({ ...current, [field]: people }))} />)}
      </div> : <>
        <p className="form-instruction">{settings.attendancePromptLabel}</p>
        {days.map(({ event, field }) => <AttendanceField key={event.id} fieldId={`attendance-${event.slug}`} title={event.title} subtitle={event.subtitle}
          value={values[field]} onChange={(choice) => update(field, choice)} error={errors[field]} />)}
        <div className="form-field">
          <label htmlFor="comment">{settings.commentLabel}</label>
          <textarea id="comment" name="comment" value={values.comment} onChange={(event) => update("comment", event.target.value)} maxLength={1000} rows={4} aria-invalid={Boolean(errors.comment)} />
          {errors.comment && <p className="field-error">{errors.comment}</p>}
        </div>
      </>}
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      {status && <p className="form-status" role="alert">{status}</p>}
      <button className="button button--olive form-submit" type="submit" disabled={isSending}>{isSending ? "ENVIANDO…" : settings.submitButtonLabel}</button>
    </form>
  );
}
