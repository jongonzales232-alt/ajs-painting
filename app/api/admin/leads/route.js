import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-request";
import { prisma } from "../../../../lib/prisma";

const allowedStatuses = new Set(["NEW", "CONTACTED", "SCHEDULED", "QUOTED", "WON", "LOST", "COMPLETED"]);

export async function PATCH(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;

  const body = await request.json();
  if (!body.leadId) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const data = {};
  if (body.status) {
    if (!allowedStatuses.has(body.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    data.status = body.status;
  }
  if (typeof body.adminNotes === "string") {
    data.adminNotes = body.adminNotes;
  }
  if (typeof body.followUpNote === "string" && body.followUpNote.trim()) {
    await prisma.followUpNote.create({ data: { leadId: body.leadId, note: body.followUpNote.trim().slice(0, 1000) } });
  }

  const lead = await prisma.lead.update({
    where: { id: body.leadId },
    data,
    include: { photos: true, followUpNotes: { orderBy: { createdAt: "asc" } } }
  });

  return NextResponse.json({ lead });
}
