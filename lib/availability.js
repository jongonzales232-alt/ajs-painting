import { prisma } from "./prisma";
import { buildAvailableSlots, TRAVEL_BUFFER_MS } from "./slots";

export async function getAvailableSlots(days = 21, client = prisma, now = new Date()) {
  const end = new Date(now.getTime() + (days + 2) * 86400000);
  // A finished visit can still have travel time remaining.
  const travelLookback = new Date(now.getTime() - TRAVEL_BUFFER_MS);

  const [slots, blockedDays, appointments] = await Promise.all([
    client.availabilitySlot.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    client.blockedDay.findMany(),
    client.appointment.findMany({ where: { endsAt: { gt: travelLookback }, startsAt: { lt: end } } })
  ]);

  return buildAvailableSlots({ slots, blockedDays, appointments, now, days });
}
