import { businessDateKey, businessDateTime, businessTimeZone, isValidTimeRange } from "./time";

const ESTIMATE_MINUTES = 60;
export const TRAVEL_BUFFER_MS = 60 * 60_000;
const minutesOfDay = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const wallTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

function estimateWindows(day, slot, timeZone) {
  const windows = [];
  const closing = minutesOfDay(slot.endTime);
  // Saved ranges describe working hours. Only offer complete one-hour visits;
  // never extend beyond closing or move an existing customer's appointment.
  for (let minute = minutesOfDay(slot.startTime); minute + ESTIMATE_MINUTES <= closing; minute += ESTIMATE_MINUTES) {
    const start = businessDateTime(day, wallTime(minute), timeZone);
    const end = businessDateTime(day, wallTime(minute + ESTIMATE_MINUTES), timeZone);
    // DST boundaries must not produce nonexistent or two-hour appointments.
    if (start && end && end - start === ESTIMATE_MINUTES * 60_000) windows.push({ start, end });
  }
  return windows;
}

export function buildAvailableSlots({ slots, blockedDays, appointments, now = new Date(), days = 21, timeZone = businessTimeZone() }) {
  // Blocked days are date-only values persisted at UTC midnight.
  const blocked = new Set(blockedDays.map((day) => new Date(day.date).toISOString().slice(0, 10)));
  const firstDay = Date.parse(`${businessDateKey(now, timeZone)}T00:00:00Z`);
  const results = new Map();
  for (let index = 0; index <= days; index++) {
    const day = new Date(firstDay + index * 86400000);
    const key = day.toISOString().slice(0, 10);
    if (blocked.has(key)) continue;
    for (const slot of slots) {
      if (slot.active === false || slot.weekday !== day.getUTCDay() || !isValidTimeRange(slot.startTime, slot.endTime)) continue;
      for (const { start, end } of estimateWindows(key, slot, timeZone)) {
        if (start <= now) continue;
        // Extend both reservations with travel time so the rule works regardless
        // of which visit was booked first. Customer-facing end times stay intact.
        if (appointments.some((appointment) =>
          new Date(appointment.startsAt).getTime() < end.getTime() + TRAVEL_BUFFER_MS &&
          new Date(appointment.endsAt).getTime() + TRAVEL_BUFFER_MS > start.getTime()
        )) continue;
        const startsAt = start.toISOString();
        results.set(startsAt, {
          startsAt, endsAt: end.toISOString(), date: key,
          dateLabel: start.toLocaleDateString("en-US", { timeZone, weekday: "long", month: "short", day: "numeric" }),
          timeLabel: `${start.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" })}–${end.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`,
          label: start.toLocaleString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })
        });
      }
    }
  }
  return [...results.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
