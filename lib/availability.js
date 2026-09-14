import { prisma } from "./prisma";
import { buildAvailableSlots } from "./slots";

export async function getAvailableSlots(days = 21, client = prisma, now = new Date()) {
  const end = new Date(now.getTime() + (days + 2) * 86400000);

  const [slots, blockedDays, appointments] = await Promise.all([
    client.availabilitySlot.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    client.blockedDay.findMany(),
    client.appointment.findMany({ where: { endsAt: { gt: now }, startsAt: { lt: end } } })
  ]);

  return buildAvailableSlots({ slots, blockedDays, appointments, now, days });
}
