import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createIcsInvite } from "../../../lib/ics";
import { ownerEmail, sendEmail } from "../../../lib/email";
import { getAvailableSlots } from "../../../lib/availability";
import { escapeHtml } from "../../../lib/html";
import { checkRateLimit } from "../../../lib/rate-limit";
import { clean, requireEmail, requirePhone, requireText } from "../../../lib/validation";
import { formatBusinessDateTime } from "../../../lib/time";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const rateLimit = await checkRateLimit(request, "schedule", { limit: 8, windowMs: 60_000 });
    if (rateLimit.limited) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    }

    const body = await request.json();
    const [startValue, endValue] = clean(body.slot).split("|");
    const startsAt = new Date(startValue);
    const endsAt = new Date(endValue);

    if (!startValue || !endValue || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt <= new Date() || endsAt <= startsAt) {
      return NextResponse.json({ error: "Please choose a valid appointment time." }, { status: 400 });
    }

    const fullName = requireText(body.fullName, "Full name", 120);
    const phone = requirePhone(body.phone);
    const email = requireEmail(body.email);
    const address = requireText(body.address, "Address", 220);
    const notes = clean(body.notes, 1000);

    const availableSlots = await getAvailableSlots();
    const requestedSlotIsAvailable = availableSlots.some(
      (slot) => slot.startsAt === startsAt.toISOString() && slot.endsAt === endsAt.toISOString()
    );

    if (!requestedSlotIsAvailable) {
      return NextResponse.json({ error: "That appointment time is no longer available. Please choose another time." }, { status: 409 });
    }

    let appointment;
    try {
      appointment = await prisma.appointment.create({
        data: {
          fullName,
          phone,
          email,
          address,
          notes,
          startsAt,
          endsAt
        }
      });
    } catch (error) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "That appointment time was just booked. Please choose another time." }, { status: 409 });
      }
      throw error;
    }

    const invite = createIcsInvite(appointment);
    const when = formatBusinessDateTime(startsAt, { dateStyle: "full", timeStyle: "short" });
    const attachments = [{ filename: "ajs-painting-estimate.ics", content: invite, contentType: "text/calendar" }];

    const ownerEmailResult = await sendEmail({
      to: ownerEmail(),
      subject: `New estimate appointment: ${appointment.fullName}`,
      text: `${when}\n${appointment.fullName}\n${appointment.phone}\n${appointment.email}\n${appointment.address}\n${appointment.notes}`,
      html: `<h2>New estimate appointment</h2><p><strong>${escapeHtml(when)}</strong></p><p>${escapeHtml(appointment.fullName)}<br>${escapeHtml(appointment.phone)}<br>${escapeHtml(appointment.email)}<br>${escapeHtml(appointment.address)}</p><p>${escapeHtml(appointment.notes)}</p>`,
      attachments
    });

    const customerEmailResult = await sendEmail({
      to: appointment.email,
      subject: "Your AJ's Painting estimate appointment",
      text: `Your estimate appointment is scheduled for ${when}.`,
      html: `<p>Your estimate appointment with AJ&apos;s Painting is scheduled for <strong>${escapeHtml(when)}</strong>.</p>`,
      attachments
    });

    return NextResponse.json({ ok: true, id: appointment.id, email: { owner: ownerEmailResult, customer: customerEmailResult } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to schedule appointment." }, { status: 400 });
  }
}
