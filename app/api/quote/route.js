import fs from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getPrivateUploadPath, saveUpload } from "../../../lib/upload";
import { ownerEmail, sendEmail } from "../../../lib/email";
import { getBusinessDetails } from "../../../lib/business";
import { escapeHtml } from "../../../lib/html";
import { checkRateLimit } from "../../../lib/rate-limit";
import { optionalDate, requireEmail, requireEnum, requirePhone, requireText } from "../../../lib/validation";
import { MAX_QUOTE_TOTAL_BYTES, validateQuotePhotos } from "../../../lib/quote-photos";
import { quoteSummary } from "../../../lib/quote-email";

export const runtime = "nodejs";

function quoteText(value, label, maxLength) {
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`${label} must be text with no more than ${maxLength.toLocaleString()} characters.`);
  }
  return requireText(value, label, maxLength);
}

export async function POST(request) {
  const uploads = [];
  let lead;
  let validated = false;
  try {
    const rateLimit = await checkRateLimit(request, "quote", { limit: 5, windowMs: 60_000 });
    if (rateLimit.limited) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    }
    if (Number(request.headers.get("content-length")) > MAX_QUOTE_TOTAL_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: "These photos are too large to send together. Refresh the quote page so they can be resized, or select fewer photos." }, { status: 413 });
    }
    const formData = await request.formData();
    if (formData.get("consent") !== "on") throw new Error("Consent is required before submitting.");
    const startDate = formData.get("preferredStartDate");
    const preferredStartDate = optionalDate(startDate, "Preferred start date");
    if (startDate && (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || preferredStartDate.toISOString().slice(0, 10) !== startDate)) {
      throw new Error("Please enter a valid preferred start date.");
    }
    const data = {
      fullName: quoteText(formData.get("fullName"), "Full name", 120),
      phone: requirePhone(quoteText(formData.get("phone"), "Phone number", 25)),
      email: requireEmail(quoteText(formData.get("email"), "Email", 254)),
      address: quoteText(formData.get("address"), "Job address", 220),
      projectType: requireEnum(formData.get("projectType"), ["Interior painting", "Exterior painting", "Cabinet painting", "Fence or deck", "Commercial painting", "Drywall patching and prep"], "Project type"),
      surface: requireEnum(formData.get("surface"), ["INTERIOR", "EXTERIOR", "BOTH"], "Project area"),
      projectSize: quoteText(formData.get("projectSize"), "Room count or project size", 120),
      preferredStartDate,
      description: quoteText(formData.get("description"), "Description", 10000)
    };
    const files = formData.getAll("photos").filter((file) => !(typeof file === "object" && file.size === 0 && !file.name));
    validateQuotePhotos(files);
    const attachments = [];
    // Store every image before atomically creating the lead and photo records.
    for (const [index, file] of files.entries()) {
      const upload = await saveUpload(file, "lead-photos", { private: true });
      uploads.push(upload);
      const content = await fs.readFile(getPrivateUploadPath("lead-photos", upload.filename));
      const extension = upload.filename.slice(upload.filename.lastIndexOf("."));
      attachments.push({ filename: `project-photo-${index + 1}${extension}`, content });
    }
    validated = true;
    lead = await prisma.lead.create({ data: { ...data, photos: { create: uploads } } });
    const summary = quoteSummary(lead, attachments.length);
    const ownerEmailResult = await sendEmail({
      to: ownerEmail(),
      replyTo: lead.email,
      subject: `New quote request from ${lead.fullName}`,
      text: `New quote request\n\n${summary.text}\n\n${attachments.length} project photos attached. Photos are also saved in Admin > Quote Requests.`,
      html: `<h2>New quote request</h2>${summary.html}<p>${attachments.length} project photos attached. Photos are also saved in Admin &gt; Quote Requests.</p>`,
      attachments
    });
    const business = getBusinessDetails();
    const customerEmailResult = await sendEmail({
      to: lead.email,
      replyTo: business.email,
      subject: "We received your AJ's Painting quote request",
      text: `Hi ${lead.fullName},\n\nThank you for contacting AJ's Painting. Your request and ${attachments.length} photos have been saved. We will review your project before following up.\n\n${summary.text}\n\nIf you need to add anything, call ${business.phone} or reply to this email.\n\nYour Project. Our Priority.`,
      html: `<h2>Thank you for contacting AJ&apos;s Painting</h2><p>Hi ${escapeHtml(lead.fullName)},</p><p>Your request and ${attachments.length} photos have been saved. We will review your project before following up.</p>${summary.html}<p>If you need to add anything, call ${escapeHtml(business.phone)} or reply to this email.</p><p><strong>Your Project. Our Priority.</strong></p>`
    });
    if (!ownerEmailResult.sent || !customerEmailResult.sent) {
      await prisma.followUpNote.create({ data: {
        leadId: lead.id,
        note: `Email notification needs attention: owner ${ownerEmailResult.sent ? "sent" : "not sent"}; customer ${customerEmailResult.sent ? "sent" : "not sent"}. Quote details and ${uploads.length} photos are saved here.`
      } }).catch((error) => console.error("Could not record quote email status", error));
    }
    return NextResponse.json({ ok: true, id: lead.id, email: { owner: ownerEmailResult, customer: customerEmailResult } });
  } catch (error) {
    if (lead) {
      // Once saved, do not invite a repeat submission or remove its photos.
      console.error("Quote saved but notification failed", { leadId: lead.id, error: error.message });
      return NextResponse.json({ ok: true, id: lead.id, email: { owner: { sent: false }, customer: { sent: false } } });
    }
    await Promise.allSettled(uploads.map((upload) => fs.unlink(getPrivateUploadPath("lead-photos", upload.filename))));
    if (validated) {
      console.error("Quote could not be saved", error);
      return NextResponse.json({ error: "We could not save your request. Your form is still filled in; please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || "Unable to submit quote request." }, { status: 400 });
  }
}
