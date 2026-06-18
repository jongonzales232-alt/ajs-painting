import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-request";
import { prisma } from "../../../../lib/prisma";

export async function GET(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const appointments = await prisma.appointment.findMany({ orderBy: { startsAt: "asc" } });
  return NextResponse.json({ appointments });
}
