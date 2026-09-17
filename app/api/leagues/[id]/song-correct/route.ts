import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Only the league's own commissioner can mark a member's song prediction
// correct — there's no stored "actual song" to check picks against like
// there is for the weekly top three, so this is their call to make.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const week = Math.round(Number(body.week));
  const correct = !!body.correct;

  if (!memberId || !Number.isFinite(week) || week < 1) {
    return NextResponse.json({ error: "Missing memberId or week" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the commissioner can score song predictions" }, { status: 403 });
  }

  const member = await prisma.leagueMember.findUnique({ where: { id: memberId } });
  if (!member || member.leagueId !== league.id) {
    return NextResponse.json({ error: "That member isn't in this league" }, { status: 400 });
  }

  const pick = await prisma.leagueMemberWeeklyPick.update({
    where: { memberId_week: { memberId, week } },
    data: { songCorrect: correct },
  });

  return NextResponse.json(pick);
}
