import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeasonPredictionsLocked } from "@/lib/leagues";

// Season-winner pick for WEEKLY_TOP3 leagues. Freely changeable up until
// the season predictions lock date — after that isSeasonPredictionsLocked()
// refuses everything, changes included.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  if (isSeasonPredictionsLocked()) {
    return NextResponse.json({ error: "Season predictions are closed" }, { status: 400 });
  }

  const body = await request.json();
  const contestant = typeof body.contestant === "string" ? body.contestant.trim() : "";
  if (!contestant) return NextResponse.json({ error: "Missing contestant" }, { status: 400 });

  const league = await prisma.league.findUnique({ where: { id: params.id }, include: { template: true } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });

  if (!league.template || !league.template.contestants.includes(contestant)) {
    return NextResponse.json({ error: "That contestant isn't in this league's pool" }, { status: 400 });
  }
  if (league.template.eliminatedContestants.includes(contestant)) {
    return NextResponse.json({ error: "That contestant has been eliminated" }, { status: 400 });
  }

  await prisma.leagueMember.update({ where: { id: membership.id }, data: { winnerPick: contestant } });
  return NextResponse.json({ winnerPick: contestant });
}
