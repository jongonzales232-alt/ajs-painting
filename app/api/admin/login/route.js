import { NextResponse } from "next/server";
import { setAdminCookie } from "../../../../lib/auth";
import { checkRateLimit } from "../../../../lib/rate-limit";

export async function POST(request) {
  const rateLimit = await checkRateLimit(request, "admin-login", { limit: 6, windowMs: 5 * 60_000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: rateLimit.message }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  }

  const body = await request.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 500 });
  }

  if (!body.password || body.password !== (expected || "admin")) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
