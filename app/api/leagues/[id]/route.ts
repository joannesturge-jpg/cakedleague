import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DUE_DAYS, TIMEZONES } from "@/lib/leagues";

// Lets the commissioner change the submission due day/time/timezone after
// the league's already been created — was previously only settable once,
// at creation.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the commissioner can change this" }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.dueDay === "string") {
    if (!DUE_DAYS.some((d) => d === body.dueDay)) {
      return NextResponse.json({ error: "That's not a valid day" }, { status: 400 });
    }
    data.dueDay = body.dueDay;
  }
  if (typeof body.dueTime === "string") {
    if (!/^\d{2}:\d{2}$/.test(body.dueTime)) {
      return NextResponse.json({ error: "That's not a valid time" }, { status: 400 });
    }
    data.dueTime = body.dueTime;
  }
  if (typeof body.timezone === "string") {
    if (!TIMEZONES.some((t) => t.id === body.timezone)) {
      return NextResponse.json({ error: "That's not a valid time zone" }, { status: 400 });
    }
    data.timezone = body.timezone;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.league.update({ where: { id: params.id }, data });
  return NextResponse.json({ dueDay: updated.dueDay, dueTime: updated.dueTime, timezone: updated.timezone });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== user.id) return NextResponse.json({ error: "Only the commissioner can delete this league" }, { status: 403 });

  // Soft delete — keeps the row (and its history) around for the admin
  // Leagues table instead of erasing it outright.
  await prisma.league.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
