import { businessDateKey, businessDateTime, businessTimeZone, isValidTimeRange } from "./time";

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
      const start = businessDateTime(key, slot.startTime, timeZone);
      const end = businessDateTime(key, slot.endTime, timeZone);
      if (!start || !end || start <= now || end <= start) continue;
      if (appointments.some((appointment) => new Date(appointment.startsAt) < end && new Date(appointment.endsAt) > start)) continue;
      const startsAt = start.toISOString();
      results.set(startsAt, {
        startsAt, endsAt: end.toISOString(), date: key,
        dateLabel: start.toLocaleDateString("en-US", { timeZone, weekday: "long", month: "short", day: "numeric" }),
        timeLabel: `${start.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" })}–${end.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`,
        label: start.toLocaleString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })
      });
    }
  }
  return [...results.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
