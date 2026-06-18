import { prisma } from "./prisma";

function clientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("cf-connecting-ip") || "unknown";
  return ip;
}

export async function checkRateLimit(request, name, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const key = `${name}:${clientKey(request)}`;
  const resetAt = new Date(now + windowMs);
  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });
  const bucket = !existing || existing.resetAt.getTime() <= now
    ? await prisma.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt }
      })
    : await prisma.rateLimitBucket.update({
        where: { key },
        data: { count: { increment: 1 } }
      });

  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt.getTime() - now) / 1000));
    return {
      limited: true,
      retryAfter,
      message: "Too many requests. Please wait a minute and try again."
    };
  }

  return { limited: false };
}
