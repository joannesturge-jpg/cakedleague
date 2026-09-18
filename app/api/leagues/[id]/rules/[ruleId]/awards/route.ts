import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Owner-only — replaces the full set of members awarded this custom
// rule with whatever the commissioner just checked, in one go. Simpler
// than diffing individual toggles, and matches how the Scoring tab
// sends the whole checked list on save.
export async function POST(request: Request, { params }: { params: { id: string; ruleId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the commissioner can score custom rules" }, { status: 403 });
  }

  const rule = await prisma.leagueRule.findUnique({ where: { id: params.ruleId } });
  if (!rule || rule.leagueId !== league.id || !rule.isCustom) {
    return NextResponse.json({ error: "That rule isn't a custom rule on this league" }, { status: 400 });
  }

  const body = await request.json();
  const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds.filter((id: unknown) => typeof id === "string") : [];

  const validMembers = await prisma.leagueMember.findMany({
    where: { id: { in: memberIds }, leagueId: league.id },
    select: { id: true },
  });
  const validIds = new Set(validMembers.map((m) => m.id));
  if (validIds.size !== memberIds.length) {
    return NextResponse.json({ error: "One or more selected members aren't in this league" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.leagueMemberRuleAward.deleteMany({ where: { ruleId: rule.id, memberId: { notIn: memberIds } } }),
    ...memberIds.map((memberId) =>
      prisma.leagueMemberRuleAward.upsert({
        where: { ruleId_memberId: { ruleId: rule.id, memberId } },
        update: {},
        create: { ruleId: rule.id, memberId },
      })
    ),
  ]);

  return NextResponse.json({ memberIds });
}
