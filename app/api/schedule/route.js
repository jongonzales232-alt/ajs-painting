import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createIcsInvite } from "../../../lib/ics";
import { ownerEmail, sendEmail } from "../../../lib/email";
import { getAvailableSlots } from "../../../lib/availability";
import { escapeHtml } from "../../../lib/html";
import { checkRateLimit } from "../../../lib/rate-limit";
import { clean, requireEmail, requirePhone, requireText } from "../../../lib/validation";
import { formatBusinessDateTime } from "../../../lib/time";
import { getBusinessDetails } from "../../../lib/business";

export const runtime = "nodejs";

export async function POST(request) {
  let appointment;
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

    try {
      // Recheck and reserve inside the same SQLite transaction. This also
      // prevents two different, overlapping start times being booked together.
      appointment = await prisma.$transaction(async (tx) => {
        const availableSlots = await getAvailableSlots(21, tx);
        if (!availableSlots.some((slot) => slot.startsAt === startsAt.toISOString() && slot.endsAt === endsAt.toISOString())) {
          const conflict = new Error("That appointment time is no longer available. Please choose another time.");
          conflict.code = "SLOT_UNAVAILABLE";
          throw conflict;
        }
        return tx.appointment.create({ data: { fullName, phone, email, address, notes, startsAt, endsAt } });
      });
    } catch (error) {
      if (["P2002", "P2034", "P1008", "SLOT_UNAVAILABLE"].includes(error.code)) {
        return NextResponse.json({ error: "That time is no longer available, including the travel time needed between visits. Please choose another time." }, { status: 409 });
      }
      throw error;
    }

    const invite = createIcsInvite(appointment);
    const when = formatBusinessDateTime(startsAt, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
    const business = getBusinessDetails();
    const attachments = [{ filename: "ajs-painting-estimate.ics", content: invite, contentType: "text/calendar" }];

    const ownerEmailResult = await sendEmail({
      to: ownerEmail(),
      replyTo: appointment.email,
      subject: `New estimate appointment: ${appointment.fullName}`,
      text: `${when}\n${appointment.fullName}\n${appointment.phone}\n${appointment.email}\n${appointment.address}\n${appointment.notes}`,
      html: `<h2>New estimate appointment</h2><p><strong>${escapeHtml(when)}</strong></p><p>${escapeHtml(appointment.fullName)}<br>${escapeHtml(appointment.phone)}<br>${escapeHtml(appointment.email)}<br>${escapeHtml(appointment.address)}</p><p>${escapeHtml(appointment.notes)}</p>`,
      attachments
    });

    const customerEmailResult = await sendEmail({
      to: appointment.email,
      replyTo: business.email,
      subject: "Your AJ's Painting estimate appointment",
      text: `Your estimate appointment is booked for ${when}.\nAddress: ${appointment.address}\nReference: ${appointment.id}\n${appointment.notes ? `Notes: ${appointment.notes}\n` : ""}Need to change or cancel? Reply to this email or call ${business.phone}.`,
      html: `<p>Your estimate appointment with AJ&apos;s Painting is booked for <strong>${escapeHtml(when)}</strong>.</p><p>Address: ${escapeHtml(appointment.address)}<br>Reference: ${escapeHtml(appointment.id)}</p><p>Need to change or cancel? Reply to this email or call ${escapeHtml(business.phone)}.</p>`,
      attachments
    });

    return NextResponse.json({ ok: true, id: appointment.id, when, email: { owner: ownerEmailResult, customer: customerEmailResult } });
  } catch (error) {
    if (appointment) {
      console.error("Appointment saved but confirmation failed", { id: appointment.id, error: error.message });
      return NextResponse.json({ ok: true, id: appointment.id, email: { owner: { sent: false }, customer: { sent: false } } });
    }
    return NextResponse.json({ error: error.message || "Unable to schedule appointment." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ slots: await getAvailableSlots() }, { headers: { "Cache-Control": "no-store" } });
}
