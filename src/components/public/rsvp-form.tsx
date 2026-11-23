"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Attendance, AttendanceDay, Event, InvitationPhase, PersonRsvp, SiteSettings } from "@/src/db/schema";
import { companionLabel, rsvpDays, transportLabels } from "@/src/lib/invitation-party";
import type { RsvpConfirmation } from "@/src/lib/rsvp-server";
import { guestGuidePages, type GuidePage } from "@/src/lib/wedding-guide";
import { DeadlineSection } from "./deadline-section";
import { RsvpFeedback } from "./rsvp-feedback";

type RsvpFormSettings = Pick<SiteSettings, "attendancePromptLabel" | "commentLabel" | "confirmationMessage" | "confirmationTitle" | "fullNameLabel" | "submitButtonLabel" | "rsvpTitle" | "rsvpClosedMessage" | "rsvpDeadlineDate" | "deadlineSubtitle">;

const guideIcons: Record<GuidePage, string> = {
  vestimenta: "M12 7V6a2 2 0 1 0-2-2m2 3L3 13a2 2 0 0 0 1 4h16a2 2 0 0 0 1-4l-9-6Z",
  actividades: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  regalos: "M3 8h18v4H3z M5 12v9h14v-9 M12 21V8 M12 8H8a2.5 2.5 0 1 1 2.4-3.2L12 8Zm0 0h4a2.5 2.5 0 1 0-2.4-3.2L12 8Z",
  faq: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.5-4A8.5 8.5 0 1 1 21 11.5Z M10 9a2.5 2.5 0 1 1 4 2l-1.5 1v1 M12.5 16h.01",
};

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

function toConfirmation(values: FormValues): RsvpConfirmation {
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
  const panelId = `rsvp-${event.slug}`;
  const buttonId = `${panelId}-toggle`;
  const pending = people.some((person) => !person.attendance);
  const transportPending = people.some(needsTransportAnswer);
  const attendees = people.filter((person) => person.attendance === "yes");
  const attending = attendees.length;
  const transportAnswer = groupAnswer(attendees.map((person) => person.transport));
  const attendanceAnswer = groupAnswer(people.map((person) => person.attendance));
  const showIndividuals = customAttendance || attendanceAnswer === "some";
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
  const answerTransport = (answer: "yes" | "no") => {
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
          ? <AttendanceOptions fieldId={`${panelId}-attendance`} value={showIndividuals ? "some" : attendanceAnswer}
              onChange={answerAttendance} labels={groupAttendanceLabels} choices={["yes", "no", "some"]} />
          : <AttendanceOptions fieldId={`${panelId}-attendance`} value={people[0]?.attendance ?? ""}
              onChange={answerAttendance} labels={personAttendanceLabels} choices={["yes", "no"]} />}
      </div>
      {incomplete && pending && <p className="field-error rsvp-day__error" role="alert">Completa la asistencia antes de enviar.</p>}
      {hasGroup && showIndividuals && people.map((person, index) => {
        const personId = `${panelId}-person-${index}`;
        return <div className="rsvp-person" role="group" aria-labelledby={`${personId}-name`} key={index}>
          <span id={`${personId}-name`}>{names[index]}</span>
          <AttendanceOptions fieldId={personId} value={person.attendance} onChange={(attendance) => updatePerson(index, { attendance, transport: attendance === "yes" ? person.transport : undefined })}
            labels={personAttendanceLabels} choices={["yes", "no"]} />
        </div>;
      })}
      <div className="rsvp-transport" role="group" aria-labelledby={`${panelId}-transport-title`}>
        <div className="rsvp-transport__heading">
          <h4 id={`${panelId}-transport-title`}>{hasGroup ? "¿Van a necesitar transporte?" : "¿Vas a necesitar transporte?"}</h4>
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
          {transportAnswer === "some" && <p className="rsvp-day__hint">Ya hay respuestas de transporte individuales guardadas.</p>}
          <AttendanceOptions fieldId={`${panelId}-transport`} value={transportAnswer === "some" ? "" : transportAnswer}
            onChange={answerTransport} labels={transportLabels} choices={["yes", "no"]} />
        </div>}
        {incomplete && !pending && transportPending && <p className="field-error rsvp-day__error" role="alert">Responde Sí o No para el transporte.</p>}
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

export function RsvpForm({ settings, events, endpoint = "/api/rsvp", initialFullName = "", invitationToken, phase, companions = [], savedConfirmation, canEdit = true, countdownEvent }: { settings: RsvpFormSettings; events: Event[]; endpoint?: string; initialFullName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[]; savedConfirmation?: RsvpConfirmation; canEdit?: boolean; countdownEvent?: Event }) {
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
  const [confirmation, setConfirmation] = useState(savedConfirmation);
  const [editingConfirmation, setEditingConfirmation] = useState(false);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const guideRef = useRef<HTMLHeadingElement>(null);
  const scrollToGuide = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scrollToGuide.current || !guideRef.current) return;
    scrollToGuide.current = false;
    guideRef.current.focus({ preventScroll: true });
    guideRef.current.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [confirmation]);

  const startEditing = () => {
    if (!confirmation?.editReceipt) return;
    const { fullName, attendsFriday, attendsSaturday, attendsSunday, comment, party } = confirmation;
    setValues({ fullName, attendsFriday, attendsSaturday, attendsSunday, comment: comment ?? "" });
    const sameCompanions = companions.length === (party?.companions.length ?? 0) &&
      companions.every((name, index) => name === party?.companions[index]);
    setAttendanceByDay(Object.fromEntries(days.map(({ field }) => {
      const people = Array.from({ length: names.length }, (_, index): PersonDraft => {
        if (index > 0 && !sameCompanions) return { attendance: "" };
        if (party?.attendanceByDay) return party.attendanceByDay[field]?.[index] ?? { attendance: "" };
        const attendance = (field === "attendsSaturday" ? party?.saturdayAttendance?.[index] : undefined) ?? confirmation[field];
        return { attendance: attendance === "maybe" ? "" : attendance };
      });
      return [field, people];
    })));
    setEditingName(false);
    setOpenDay(days[0]?.field);
    setEditingConfirmation(true);
    requestAnimationFrame(() => formRef.current?.focus());
  };

  const showConfirmation = () => {
    setEditingConfirmation(false);
    requestAnimationFrame(() => confirmationRef.current?.focus());
  };

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
          editReceipt: editingConfirmation ? confirmation?.editReceipt : undefined,
          companions: isFinal && companions.length ? companions : undefined,
          attendanceByDay: isFinal ? attendanceByDay : undefined,
        }),
      });
      const payload = await response.json() as { confirmation?: RsvpConfirmation; errors?: Record<string, string>; message?: string };
      if (!response.ok) {
        setErrors(payload.errors || {});
        setStatus(payload.message || "No fue posible guardar la respuesta. Intenta nuevamente.");
        if (isFinal && payload.errors?.fullName) editName();
        return;
      }
      scrollToGuide.current = isFinal;
      setConfirmation(payload.confirmation || toConfirmation(values));
      if (isFinal) setEditingConfirmation(false);
      else showConfirmation();
    } catch {
      setStatus("No fue posible guardar la respuesta. Intenta nuevamente.");
    } finally {
      setIsSending(false);
    }
  };

  const confirmedNames = [confirmation?.fullName, ...(confirmation?.party?.companions.map(companionLabel) ?? [])];
  const confirmationContent = confirmation && !editingConfirmation ? (
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
        {canEdit && confirmation.editReceipt && <button className="button button--outline form-submit" type="button" onClick={startEditing}>Editar confirmación</button>}
      </div>
  ) : null;

  const formContent = (
    <form className="rsvp-form" ref={formRef} tabIndex={-1} onSubmit={submit} noValidate>
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
      {editingConfirmation ? <div className="rsvp-edit-actions">
        <button className="button button--olive" type="submit" disabled={isSending}>{isSending ? "GUARDANDO…" : "Guardar cambios"}</button>
        <button className="button button--outline" type="button" disabled={isSending} onClick={() => {
          setErrors({});
          setStatus(null);
          setIncompleteDay(undefined);
          showConfirmation();
        }}>Cancelar</button>
      </div> : <button className="button button--olive form-submit" type="submit" disabled={isSending}>{isSending ? "ENVIANDO…" : settings.submitButtonLabel}</button>}
    </form>
  );
  const invitationPath = invitationToken ? `/boda/${encodeURIComponent(invitationToken)}` : endpoint.endsWith("/sabado") ? "/boda/sabado" : "/boda";

  return <>
    <section id="confirmar" className="rsvp-section" aria-labelledby="rsvp-title">
      <div className="rsvp-shell">
        <p className="eyebrow">Una pequeña confirmación</p>
        <h2 id="rsvp-title">{settings.rsvpTitle}</h2>
        <div className="rsvp-rule" />
        {confirmationContent ?? (canEdit ? formContent : <div className="rsvp-closed" role="status">{settings.rsvpClosedMessage}</div>)}
      </div>
    </section>
    {countdownEvent && <DeadlineSection settings={settings} targetEvent={countdownEvent} headingRef={isFinal ? guideRef : undefined}
      actions={isFinal && <div className="guest-guide">
        <nav className="guest-guide__links" aria-label="Información para invitados">
          {(Object.keys(guestGuidePages) as GuidePage[]).map((slug) => (
            <Link className="button guest-guide__button" href={`${invitationPath}/${slug}`} key={slug}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={guideIcons[slug]} />
              </svg>
              {guestGuidePages[slug].label}
            </Link>
          ))}
        </nav>
        {confirmation?.feedbackReceipt && <div className="guest-guide__feedback">
          <RsvpFeedback receipt={confirmation.feedbackReceipt} food={confirmation.foodFeedback}
            music={confirmation.musicFeedback} flight={confirmation.flightFeedback} />
        </div>}
        <a className="button guest-guide__button guest-guide__button--rsvp" href="#confirmar">
          {confirmation ? "Ver confirmación" : "Confirmar asistencia"}
        </a>
      </div>} />}
  </>;
}
