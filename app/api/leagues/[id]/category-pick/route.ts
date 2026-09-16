import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// WEEKLY_CATEGORIES leagues (Bake Off): a member's three weekly
// predictions — Star Baker, technical winner, voted off. Upserts, same as
// the DWTS weekly-pick route — no hard cutoff enforced yet.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();
  const week = Math.round(Number(body.week));
  const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const starBakerPick = clean(body.starBakerPick);
  const technicalPick = clean(body.technicalPick);
  const votedOffPick = clean(body.votedOffPick);

  if (!Number.isFinite(week) || week < 1) {
    return NextResponse.json({ error: "Missing week" }, { status: 400 });
  }
  if (week === 1) {
    return NextResponse.json(
      { error: "Drafting begins week 2, once we've met the contestants" },
      { status: 400 }
    );
  }
  if (!starBakerPick && !technicalPick && !votedOffPick) {
    return NextResponse.json({ error: "Pick at least one category" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id: params.id }, include: { template: true } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });

  const pool = league.template?.contestants ?? [];
  const eliminated = league.template?.eliminatedContestants ?? [];
  for (const c of [starBakerPick, technicalPick, votedOffPick]) {
    if (!c) continue;
    if (!pool.includes(c)) return NextResponse.json({ error: `${c} isn't in this league's pool` }, { status: 400 });
    if (eliminated.includes(c)) return NextResponse.json({ error: `${c} has been eliminated` }, { status: 400 });
  }

  const pick = await prisma.leagueMemberCategoryPick.upsert({
    where: { memberId_week: { memberId: membership.id, week } },
    update: { starBakerPick, technicalPick, votedOffPick },
    create: { memberId: membership.id, week, starBakerPick, technicalPick, votedOffPick },
  });

  return NextResponse.json(pick);
}
