import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeagueJoinedEmail } from "@/lib/email";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "This league is invite-only" }, { status: 403 });
  }

  const existingMembership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
  });

  if (!existingMembership) {
    await prisma.leagueMember.create({ data: { leagueId: league.id, userId: user.id, role: "MEMBER" } });
    await sendLeagueJoinedEmail(user.email, user.id, league.name, league.id);
  }

  return NextResponse.json({ id: league.id });
}
