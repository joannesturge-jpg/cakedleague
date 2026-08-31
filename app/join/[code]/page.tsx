import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeagueJoinedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: { code: string } }) {
  const league = await prisma.league.findUnique({ where: { inviteCode: params.code } });
  if (!league || league.deletedAt) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/join/${params.code}`);

  const existingMembership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
  });

  if (!existingMembership) {
    await prisma.leagueMember.create({ data: { leagueId: league.id, userId: user.id, role: "MEMBER" } });
    await sendLeagueJoinedEmail(user.email, league.name, league.id);
  }

  redirect(`/leagues/${league.id}`);
}
