export function businessTimeZone() {
  return process.env.BUSINESS_TIME_ZONE || "America/Chicago";
}

export function formatBusinessDateTime(date, options = {}) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: businessTimeZone(),
    ...options
  });
}

export function businessDateKey(date, timeZone = businessTimeZone()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isValidTimeRange(start, end) {
  const valid = (time) => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  return valid(start) && valid(end) && start < end;
}

// Interpret wall-clock time in the business timezone, not the server timezone.
// A nonexistent time during the spring DST transition is rejected.
export function businessDateTime(day, time, timeZone = businessTimeZone()) {
  const target = Date.parse(`${day}T${time}:00Z`);
  if (!Number.isFinite(target)) return null;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(({ type, value }) => [type, value]));
    const represented = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    if (represented === target) return new Date(candidate);
    candidate += target - represented;
  }
  return null;
}
