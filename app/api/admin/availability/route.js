import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-request";
import { prisma } from "../../../../lib/prisma";
import { isValidTimeRange } from "../../../../lib/time";

function clean(value) {
  return String(value || "").trim();
}

export async function POST(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;

  const body = await request.json();
  if (body.type === "slot") {
    const weekday = Number(body.weekday);
    const startTime = clean(body.startTime);
    const endTime = clean(body.endTime);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !isValidTimeRange(startTime, endTime)) {
      return NextResponse.json({ error: "Please provide a valid day and time range." }, { status: 400 });
    }
    const slot = await prisma.availabilitySlot.create({
      data: { weekday, startTime, endTime }
    });
    return NextResponse.json({ slot });
  }

  if (body.type === "block") {
    if (!clean(body.date)) return NextResponse.json({ error: "Please choose a date." }, { status: 400 });
    const dateValue = clean(body.date);
    const date = new Date(`${dateValue}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateValue) {
      return NextResponse.json({ error: "Please choose a valid calendar date." }, { status: 400 });
    }
    const blockedDay = await prisma.blockedDay.upsert({
      where: { date },
      update: { reason: clean(body.reason) },
      create: { date, reason: clean(body.reason) }
    });
    return NextResponse.json({ blockedDay });
  }

  return NextResponse.json({ error: "Unsupported availability action." }, { status: 400 });
}

export async function DELETE(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  try {
    if (type === "slot") await prisma.availabilitySlot.delete({ where: { id } });
    else if (type === "block") await prisma.blockedDay.delete({ where: { id } });
    else return NextResponse.json({ error: "Unsupported availability type." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error.code === "P2025") return NextResponse.json({ error: "Availability record not found." }, { status: 404 });
    return NextResponse.json({ error: "Could not delete availability record." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    if (body.type === "slot") {
      const weekday = Number(body.weekday);
      const startTime = clean(body.startTime);
      const endTime = clean(body.endTime);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !isValidTimeRange(startTime, endTime)) {
        return NextResponse.json({ error: "Please provide a valid day and time range." }, { status: 400 });
      }
      const slot = await prisma.availabilitySlot.update({
        where: { id: body.id },
        data: { weekday, startTime, endTime }
      });
      return NextResponse.json({ slot });
    }

    if (body.type === "block") {
      const blockedDay = await prisma.blockedDay.update({
        where: { id: body.id },
        data: { reason: clean(body.reason).slice(0, 200) }
      });
      return NextResponse.json({ blockedDay });
    }

    return NextResponse.json({ error: "Unsupported availability action." }, { status: 400 });
  } catch (error) {
    if (error.code === "P2025") return NextResponse.json({ error: "Availability record not found." }, { status: 404 });
    return NextResponse.json({ error: "Could not update availability record." }, { status: 500 });
  }
}
