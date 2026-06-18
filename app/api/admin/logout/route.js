import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-request";
import { clearAdminCookie } from "../../../../lib/auth";

export async function POST(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
