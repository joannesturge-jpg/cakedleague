import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWeekOpen, weekOpenInstant, isWeekDuePassed, weekDueInstant, formatOpenDate } from "@/lib/leagues";

// Weekly ranked top-three prediction (+ optional song prediction) for
// WEEKLY_TOP3 leagues. Upserts — a member can resubmit for the same week
// to change their pick, no hard cutoff enforced yet.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();
  const week = Math.round(Number(body.week));
  const topThree = Array.isArray(body.topThree)
    ? body.topThree.filter((c: unknown): c is string => typeof c === "string" && c.trim().length > 0).map((c: string) => c.trim())
    : [];
  const songPrediction =
    typeof body.songPrediction === "string" && body.songPrediction.trim() ? body.songPrediction.trim() : null;

  if (!Number.isFinite(week) || week < 1) {
    return NextResponse.json({ error: "Missing week" }, { status: 400 });
  }
  if (topThree.length !== 3 || new Set(topThree).size !== 3) {
    return NextResponse.json({ error: "Pick exactly 3 different couples, ranked in order" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id: params.id }, include: { template: true } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });

  if (!isWeekOpen(week, league.templateId, league.dueDay, league.dueTime, league.timezone, league.startDate)) {
    const openAt = weekOpenInstant(week, league.templateId, league.dueDay, league.dueTime, league.timezone, league.startDate);
    const when = openAt ? formatOpenDate(openAt, league.timezone) : "soon";
    return NextResponse.json({ error: `Picks for week ${week} aren't open yet — they open ${when}` }, { status: 400 });
  }
  if (isWeekDuePassed(week, league.dueDay, league.dueTime, league.timezone, league.startDate)) {
    const dueAt = weekDueInstant(week, league.dueDay, league.dueTime, league.timezone, league.startDate);
    const when = dueAt ? formatOpenDate(dueAt, league.timezone) : "the deadline";
    return NextResponse.json({ error: `Picks for week ${week} were due ${when} and can't be changed now` }, { status: 400 });
  }

  const pool = league.template?.contestants ?? [];
  const eliminated = league.template?.eliminatedContestants ?? [];
  for (const c of topThree) {
    if (!pool.includes(c)) return NextResponse.json({ error: `${c} isn't in this league's pool` }, { status: 400 });
    if (eliminated.includes(c)) return NextResponse.json({ error: `${c} has been eliminated` }, { status: 400 });
  }

  const pick = await prisma.leagueMemberWeeklyPick.upsert({
    where: { memberId_week: { memberId: membership.id, week } },
    update: { topThree, songPrediction },
    create: { memberId: membership.id, week, topThree, songPrediction },
  });

  return NextResponse.json(pick);
}
