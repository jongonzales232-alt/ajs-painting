function formatDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function createIcsInvite(appointment) {
  const uid = `${appointment.id}@ajspainting.local`;
  const description = [
    `Customer: ${appointment.fullName}`,
    `Phone: ${appointment.phone}`,
    `Email: ${appointment.email}`,
    `Address: ${appointment.address}`,
    appointment.notes ? `Notes: ${appointment.notes}` : ""
  ].filter(Boolean).join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AJs Painting//Estimate Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(appointment.startsAt)}`,
    `DTEND:${formatDate(appointment.endsAt)}`,
    `SUMMARY:${escapeText("AJ's Painting Estimate")}`,
    `LOCATION:${escapeText(appointment.address)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
