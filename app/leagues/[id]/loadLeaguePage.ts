import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Shared by every tab's route file (page.tsx, submissions/page.tsx,
// rankings/page.tsx, scoring/page.tsx) so the query and access checks
// live in one place instead of four.
export async function loadLeaguePage(id: string) {
  const user = await getCurrentUser();
  if (!user) return { kind: "login" as const };

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      rules: { orderBy: { order: "asc" } },
      members: {
        include: { user: { select: { name: true } }, weeklyPicks: true, categoryPicks: true },
        orderBy: { joinedAt: "asc" },
      },
      template: { include: { weeklyScores: true, ruleAwards: { include: { rule: true } } } },
      picks: true,
    },
  });

  if (!league || league.deletedAt) return { kind: "not-found" as const };

  const isMember = league.members.some((m) => m.userId === user.id);
  const isOwner = league.ownerId === user.id;

  // Admins can preview any league to see what a member/commissioner sees
  // — not the same as being a member, so isOwner stays accurate and
  // owner-only controls stay hidden unless they actually own it too.
  if (!isMember && !isOwner && !user.isAdmin) return { kind: "forbidden" as const };

  return {
    kind: "ok" as const,
    league,
    isOwner,
    currentUserId: user.id,
    isAdminPreview: !isMember && !isOwner && user.isAdmin,
  };
}
