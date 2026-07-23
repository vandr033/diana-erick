export type GuestImportRecord = {
  name: string;
  prefix: string;
  phoneNumber: string;
  soloInvitadoSabado: boolean;
  customMessage: string | null;
};

export type GuestImportError = { row: number; message: string };

const requiredColumns = ["name", "prefix", "phone_number", "solo_invitado_sabado"] as const;

function keyFor(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function normalizePrefix(value: unknown) {
  const digits = text(value).replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function normalizePhone(prefix: string, value: unknown) {
  const digits = text(value).replace(/\D/g, "");
  return `${prefix}${digits}`;
}

function parseSaturday(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const normalized = text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["true", "1", "si", "yes", "x"].includes(normalized)) return true;
  if (["false", "0", "no", ""].includes(normalized)) return false;
  return null;
}

export function validateGuestImportRows(rows: unknown[]): { records: GuestImportRecord[]; errors: GuestImportError[] } {
  const records: GuestImportRecord[] = [];
  const errors: GuestImportError[] = [];
  const seenPhones = new Set<string>();

  rows.forEach((raw, index) => {
    const row = index + 2;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      errors.push({ row, message: "La fila no contiene datos válidos." });
      return;
    }
    const source = Object.fromEntries(Object.entries(raw as Record<string, unknown>).map(([key, value]) => [keyFor(key), value]));
    const name = text(source.name);
    const prefix = normalizePrefix(source.prefix);
    const phoneNumber = normalizePhone(prefix, source.phone_number);
    const saturdayOnly = parseSaturday(source.solo_invitado_sabado);
    const custom = text(source.custom_message);

    if (!name || name.length > 150) errors.push({ row, message: "name es obligatorio y debe tener hasta 150 caracteres." });
    if (!prefix || !/^\+\d{1,3}$/.test(prefix)) errors.push({ row, message: "prefix debe contener un código de país, por ejemplo +591." });
    if (!/^\+\d{8,15}$/.test(phoneNumber)) errors.push({ row, message: "phone_number no es válido para el prefijo indicado." });
    if (saturdayOnly === null) errors.push({ row, message: "solo_invitado_sabado debe ser true/false, sí/no, 1/0 o x." });
    if (custom.length > 2000) errors.push({ row, message: "custom_message no puede superar los 2.000 caracteres." });
    if (phoneNumber && seenPhones.has(phoneNumber)) errors.push({ row, message: "El teléfono está repetido en el archivo." });
    seenPhones.add(phoneNumber);
    if (name && name.length <= 150 && /^\+\d{1,3}$/.test(prefix) && /^\+\d{8,15}$/.test(phoneNumber) && saturdayOnly !== null && custom.length <= 2000) {
      records.push({ name, prefix, phoneNumber, soloInvitadoSabado: saturdayOnly, customMessage: custom || null });
    }
  });
  return { records, errors };
}

export function missingGuestImportColumns(headers: unknown[]) {
  const available = new Set(headers.map(keyFor));
  return requiredColumns.filter((column) => !available.has(column));
}

export const guestImportColumns = requiredColumns;
