import { randomUUID } from "node:crypto";

export const newId = () => randomUUID();
export const optionalText = (value: unknown) => {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean || null;
};
