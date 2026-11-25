import { z } from "zod";
import { attendanceValues } from "@/src/db/schema";
import { maxCompanions } from "@/src/lib/invitation-party";

const requiredText = (message: string, max = 500) =>
  z.string().trim().min(1, message).max(max, `No puede superar los ${max} caracteres.`);

const parentNames = z.string().trim().max(201).refine((value) => {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length <= 2 && lines.every((line) => line.length <= 100);
}, "Ingresa hasta dos nombres, uno por línea, de máximo 100 caracteres cada uno.").optional();

export const companionNames = z.array(z.string().trim().max(150, "El nombre de un acompañante no puede superar los 150 caracteres."))
  .max(maxCompanions, `Puedes agregar hasta ${maxCompanions} acompañantes.`);
export const saturdayAttendanceSchema = z.array(z.enum(["yes", "no"])).max(maxCompanions + 1);
const personRsvpsSchema = z.array(z.object({
  attendance: z.enum(["yes", "no"]),
  comment: z.string().trim().max(1000).optional(),
  transport: z.enum(["yes", "no"]).optional(),
}).refine(({ attendance, transport }) => attendance === "yes" || transport === undefined,
  "Solo las personas que asisten pueden solicitar transporte.")).max(maxCompanions + 1);
export const attendanceByDaySchema = z.strictObject({
  attendsFriday: personRsvpsSchema.optional(),
  attendsSaturday: personRsvpsSchema.optional(),
  attendsSunday: personRsvpsSchema.optional(),
});

export const rsvpSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(150, "El nombre no puede superar los 150 caracteres."),
  attendsFriday: z.enum(attendanceValues, { message: "Selecciona una respuesta para el viernes." }),
  attendsSaturday: z.enum(attendanceValues, { message: "Selecciona una respuesta para el sábado." }),
  attendsSunday: z.enum(attendanceValues, { message: "Selecciona una respuesta para el domingo." }),
  comment: z.string().trim().max(1000, "El comentario no puede superar los 1.000 caracteres.").nullable().optional(),
  honeypot: z.string().optional(),
});

export const responseAdminSchema = rsvpSchema.omit({ honeypot: true }).extend({
  source: z.enum(["public", "admin"]).optional(),
  saturdayAttendance: saturdayAttendanceSchema.optional(),
  attendanceByDay: attendanceByDaySchema.optional(),
});

export const manualInvitationGuestSchema = z.object({
  name: requiredText("Ingresa el nombre de la persona.", 150),
  prefix: z.string().trim().max(8, "El prefijo no es válido.").optional().default(""),
  phoneNumber: z.string().trim().max(24, "El número no es válido.").optional().default(""),
  saturdayOnly: z.coerce.boolean().default(false),
  transportIncluded: z.coerce.boolean().default(true),
  sourceResponseId: z.string().uuid().optional(),
  companions: companionNames.optional(),
}).superRefine((value, context) => {
  const prefix = value.prefix.replace(/\D/g, "");
  const phone = value.phoneNumber.replace(/\D/g, "");
  if (!prefix && !phone) return;
  if (!prefix) context.addIssue({ code: "custom", path: ["prefix"], message: "Ingresa el código de país, por ejemplo +591." });
  if (!phone) context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Ingresa el número de teléfono." });
  if (prefix && !/^\d{1,3}$/.test(prefix)) context.addIssue({ code: "custom", path: ["prefix"], message: "El prefijo debe tener entre 1 y 3 dígitos." });
  if (prefix && phone && !/^\d{8,15}$/.test(`${prefix}${phone}`)) context.addIssue({ code: "custom", path: ["phoneNumber"], message: "El teléfono debe tener entre 8 y 15 dígitos con el prefijo." });
});

export const invitationGuestUpdateSchema = z.object({
  name: requiredText("Ingresa el nombre de la persona.", 150),
  phoneNumber: z.string().trim().max(24, "El número no es válido.").nullable().optional(),
  saturdayOnly: z.coerce.boolean().default(false),
  transportIncluded: z.coerce.boolean().default(true),
  customMessage: z.string().trim().max(2000, "El mensaje no puede superar los 2.000 caracteres.").nullable().optional(),
  companions: companionNames.optional(),
}).superRefine((value, context) => {
  if (value.phoneNumber && !/^\+\d{8,15}$/.test(value.phoneNumber.replace(/\D/g, "").replace(/^/, "+"))) {
    context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Usa un teléfono internacional válido, por ejemplo +59170000000." });
  }
});

export const contentSchema = z.object({
  coupleNames: requiredText("Ingresa los nombres de la pareja.", 120),
  heroDateLabel: requiredText("Ingresa la fecha del encabezado.", 80),
  heroYearLabel: requiredText("Ingresa el año.", 20),
  invitationText: requiredText("Ingresa el texto de invitación.", 300),
  heroButtonLabel: requiredText("Ingresa el texto del botón.", 50),
  rsvpTitle: requiredText("Ingresa el título de RSVP.", 80),
  fullNameLabel: requiredText("Ingresa la etiqueta del nombre.", 80),
  attendancePromptLabel: requiredText("Ingresa la indicación de asistencia.", 120),
  commentLabel: requiredText("Ingresa la etiqueta del comentario.", 80),
  submitButtonLabel: requiredText("Ingresa el texto de envío.", 80),
  confirmationTitle: requiredText("Ingresa el título de confirmación.", 120),
  confirmationMessage: requiredText("Ingresa el mensaje de confirmación.", 300),
  submitAnotherLabel: requiredText("Ingresa el texto del segundo envío.", 80),
  rsvpDeadlineDate: z.string().date("La fecha límite no es válida."),
  deadlinePrefix: requiredText("Ingresa el encabezado de la fecha límite.", 120),
  deadlineSubtitle: requiredText("Ingresa el subtítulo de la fecha límite.", 120),
  footerText: requiredText("Ingresa el texto del pie de página.", 120),
  hotelName: requiredText("Ingresa el nombre del hotel recomendado.", 160),
  hotelLocationUrl: z.string().url("La URL de ubicación no es válida.").refine((value) => value.startsWith("http://") || value.startsWith("https://"), "La URL debe comenzar con http o https."),
  hotelWebsiteUrl: z.string().url("La URL del sitio web no es válida.").refine((value) => value.startsWith("http://") || value.startsWith("https://"), "La URL debe comenzar con http o https."),
  transportMessage: requiredText("Ingresa el mensaje de transporte.", 600),
  defaultWhatsappMessage: requiredText("Ingresa el mensaje predeterminado de WhatsApp.", 2000),
  finalInvitationDetails: z.string().trim().max(5000, "Los detalles no pueden superar los 5.000 caracteres.").optional(),
  dianaParents: parentNames,
  erickParents: parentNames,
});

export const settingsSchema = z.object({
  siteTitle: requiredText("Ingresa el título del sitio.", 160),
  metaDescription: requiredText("Ingresa la descripción del sitio.", 300),
  rsvpEnabled: z.coerce.boolean(),
  rsvpClosedMessage: requiredText("Ingresa el mensaje de cierre.", 300),
});

export const eventSchema = z.object({
  title: requiredText("Ingresa el título del evento.", 80),
  subtitle: requiredText("Ingresa el subtítulo del evento.", 120),
  date: z.string().date("La fecha del evento no es válida."),
  startTime: z.string().max(20).nullable().optional(),
  endTime: z.string().max(20).nullable().optional(),
  venueName: z.string().trim().max(160).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  mapsUrl: z.union([z.literal(""), z.string().url("La URL de ubicación no es válida.").refine((value) => value.startsWith("http://") || value.startsWith("https://"), "La URL debe comenzar con http o https.")]).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  dressCodeTitle: z.string().trim().max(80).nullable().optional(),
  dressCodeDescription: z.string().trim().max(300).nullable().optional(),
  additionalNote: z.string().trim().max(300).nullable().optional(),
  iconPath: z.string().regex(/^\/images\/[a-zA-Z0-9._-]+$/, "La ruta de imagen no es válida.").nullable().optional(),
  isActive: z.coerce.boolean(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
