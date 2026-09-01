import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sets one couple's score for one week. The top three (ties included) get
// computed from these scores at read time — no separate "correct couple" /
// "exact order" toggling needed once scores are in.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const week = Math.round(Number(body.week));
  const contestant = typeof body.contestant === "string" ? body.contestant.trim() : "";
  const score = Math.round(Number(body.score));

  if (!Number.isFinite(week) || week < 1 || !contestant || !Number.isFinite(score)) {
    return NextResponse.json({ error: "Missing week, contestant, or score" }, { status: 400 });
  }

  const record = await prisma.leagueTemplateWeeklyScore.upsert({
    where: { templateId_week_contestant: { templateId: params.id, week, contestant } },
    update: { score },
    create: { templateId: params.id, week, contestant, score },
  });

  return NextResponse.json(record);
}
