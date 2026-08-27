import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { saveUpload } from "../../../lib/upload";
import { ownerEmail, sendEmail } from "../../../lib/email";
import { getBusinessDetails } from "../../../lib/business";
import { escapeHtml, nl2br } from "../../../lib/html";
import { checkRateLimit } from "../../../lib/rate-limit";
import { optionalDate, requireEmail, requireEnum, requirePhone, requireText } from "../../../lib/validation";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const rateLimit = await checkRateLimit(request, "quote", { limit: 5, windowMs: 60_000 });
    if (rateLimit.limited) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    }

    const formData = await request.formData();
    if (formData.get("consent") !== "on") {
      return NextResponse.json({ error: "Consent is required before submitting." }, { status: 400 });
    }

    const projectType = requireEnum(formData.get("projectType"), [
      "Interior painting",
      "Exterior painting",
      "Cabinet painting",
      "Fence or deck",
      "Commercial painting",
      "Drywall patching and prep"
    ], "Project type");

    const lead = await prisma.lead.create({
      data: {
        fullName: requireText(formData.get("fullName"), "Full name", 120),
        phone: requirePhone(formData.get("phone")),
        email: requireEmail(formData.get("email")),
        address: requireText(formData.get("address"), "Job address", 220),
        projectType,
        surface: requireEnum(formData.get("surface"), ["INTERIOR", "EXTERIOR", "BOTH"], "Project area"),
        projectSize: requireText(formData.get("projectSize"), "Room count or project size", 120),
        preferredStartDate: optionalDate(formData.get("preferredStartDate"), "Preferred start date"),
        description: requireText(formData.get("description"), "Description", 2000)
      }
    });

    const files = formData.getAll("photos").filter((file) => file && file.size > 0);
    for (const file of files) {
      const upload = await saveUpload(file, "lead-photos", { private: true });
      if (upload) {
        await prisma.leadPhoto.create({ data: { leadId: lead.id, ...upload } });
      }
    }

    const ownerEmailResult = await sendEmail({
      to: ownerEmail(),
      subject: `New quote request from ${lead.fullName}`,
      text: `${lead.fullName}\n${lead.phone}\n${lead.email}\n${lead.address}\n${lead.projectType}\n\n${lead.description}`,
      html: `<h2>New quote request</h2><p><strong>${escapeHtml(lead.fullName)}</strong></p><p>${escapeHtml(lead.phone)}<br>${escapeHtml(lead.email)}<br>${escapeHtml(lead.address)}</p><p><strong>Project:</strong> ${escapeHtml(lead.projectType)}</p><p>${nl2br(lead.description)}</p>`
    });

    const business = getBusinessDetails();
    const customerEmailResult = await sendEmail({
      to: lead.email,
      subject: "We received your AJ's Painting quote request",
      text: `Hi ${lead.fullName},\n\nThank you for contacting AJ's Painting. We received your ${lead.projectType.toLowerCase()} request and will review the project details before following up.\n\nIf you need to add anything, call ${business.phone} or reply to this email.\n\nYour Project. Our Priority.`,
      html: `<h2>Thank you for contacting AJ&apos;s Painting</h2><p>Hi ${escapeHtml(lead.fullName)},</p><p>We received your ${escapeHtml(lead.projectType.toLowerCase())} request and will review the project details before following up.</p><p>If you need to add anything, call <a href="tel:${business.phone.replace(/[^+\d]/g, "")}">${escapeHtml(business.phone)}</a> or reply to this email.</p><p><strong>Your Project. Our Priority.</strong></p>`
    });

    return NextResponse.json({
      ok: true,
      id: lead.id,
      email: { owner: ownerEmailResult, customer: customerEmailResult }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to submit quote request." }, { status: 400 });
  }
}
