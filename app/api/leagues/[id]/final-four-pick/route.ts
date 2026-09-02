import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeasonPredictionsLocked } from "@/lib/leagues";

// One-time "final four" prediction for WEEKLY_TOP3 leagues — 4 contestants
// picked before week one, +5 points each if they're right. Locked once set,
// same rule as the season-winner pick.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  if (isSeasonPredictionsLocked()) {
    return NextResponse.json({ error: "Season predictions are closed" }, { status: 400 });
  }

  const body = await request.json();
  const picks: string[] = Array.isArray(body.picks)
    ? body.picks.filter((c: unknown): c is string => typeof c === "string" && c.trim().length > 0).map((c: string) => c.trim())
    : [];
  const unique = Array.from(new Set(picks));
  if (unique.length !== 4) {
    return NextResponse.json({ error: "Pick exactly 4 different contestants" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id: params.id }, include: { template: true } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });
  if (membership.finalFourPicks.length > 0) {
    return NextResponse.json({ error: "Your final four picks are already locked in" }, { status: 400 });
  }

  if (!league.template) return NextResponse.json({ error: "This league has no contestant pool" }, { status: 400 });
  for (const c of unique) {
    if (!league.template.contestants.includes(c)) {
      return NextResponse.json({ error: `${c} isn't in this league's pool` }, { status: 400 });
    }
    if (league.template.eliminatedContestants.includes(c)) {
      return NextResponse.json({ error: `${c} has already been eliminated` }, { status: 400 });
    }
  }

  await prisma.leagueMember.update({ where: { id: membership.id }, data: { finalFourPicks: unique } });
  return NextResponse.json({ finalFourPicks: unique });
}
