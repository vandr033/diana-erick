export function splitGuestName(value: string) {
  const [name = "", ...companions] = value.split(/\s+y\s+|\s*[&,;+]\s*/iu).map((part) => part.trim()).filter(Boolean);
  return { name, companions };
}

export function guestNameKey(name: string) {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}
