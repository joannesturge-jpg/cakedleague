import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Early MVP: no pick limit per member, and no hard time gate — the
// template's draft-open day/time is shown to members as information only
// for now. First-come, first-served: a contestant can only be held by one
// member per league at a time.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

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

  try {
    const pick = await prisma.leagueMemberPick.create({
      data: { leagueId: league.id, memberId: membership.id, contestant },
    });
    return NextResponse.json({ id: pick.id, contestant: pick.contestant, memberId: pick.memberId });
  } catch {
    return NextResponse.json({ error: "Someone already drafted that contestant" }, { status: 409 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();
  const contestant = typeof body.contestant === "string" ? body.contestant.trim() : "";
  if (!contestant) return NextResponse.json({ error: "Missing contestant" }, { status: 400 });

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });

  // Members can only drop their own picks.
  await prisma.leagueMemberPick.deleteMany({
    where: { leagueId: params.id, memberId: membership.id, contestant },
  });
  return NextResponse.json({ ok: true });
}
