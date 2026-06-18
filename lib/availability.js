import { prisma } from "./prisma";
import { formatBusinessDateTime } from "./time";

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function mergeDateAndTime(date, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export async function getAvailableSlots(days = 21) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  const [slots, blockedDays, appointments] = await Promise.all([
    prisma.availabilitySlot.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    prisma.blockedDay.findMany({ where: { date: { gte: now, lte: end } } }),
    prisma.appointment.findMany({ where: { startsAt: { gte: now, lte: end } } })
  ]);

  const blocked = new Set(blockedDays.map((day) => dateKey(day.date)));
  const booked = new Set(appointments.map((appointment) => appointment.startsAt.toISOString()));
  const results = [];

  for (let i = 0; i <= days; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    day.setHours(0, 0, 0, 0);
    if (blocked.has(dateKey(day))) continue;

    const weekday = day.getDay();
    for (const slot of slots.filter((item) => item.weekday === weekday)) {
      const startsAt = mergeDateAndTime(day, slot.startTime);
      const endsAt = mergeDateAndTime(day, slot.endTime);
      if (startsAt <= now || booked.has(startsAt.toISOString())) continue;
      results.push({
        label: formatBusinessDateTime(startsAt, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString()
      });
    }
  }

  return results;
}
