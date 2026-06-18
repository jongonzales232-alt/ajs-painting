import { NextResponse } from "next/server";
import { ownerEmail, sendEmail } from "../../../lib/email";
import { escapeHtml, nl2br } from "../../../lib/html";
import { checkRateLimit } from "../../../lib/rate-limit";
import { requireEmail, requirePhone, requireText } from "../../../lib/validation";

export async function POST(request) {
  try {
    const rateLimit = await checkRateLimit(request, "contact", { limit: 5, windowMs: 60_000 });
    if (rateLimit.limited) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    }

    const body = await request.json();
    const name = requireText(body.name, "Name", 120);
    const phone = requirePhone(body.phone);
    const email = requireEmail(body.email);
    const message = requireText(body.message, "Message", 2000);

    const emailResult = await sendEmail({
      to: ownerEmail(),
      subject: `Website message from ${name}`,
      text: `${name}\n${phone}\n${email}\n\n${message}`,
      html: `<h2>Website message</h2><p>${escapeHtml(name)}<br>${escapeHtml(phone)}<br>${escapeHtml(email)}</p><p>${nl2br(message)}</p>`
    });

    return NextResponse.json({ ok: true, email: emailResult });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Message could not be sent." }, { status: 400 });
  }
}
