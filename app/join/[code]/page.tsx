import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: { code: string } }) {
  const league = await prisma.league.findUnique({ where: { inviteCode: params.code } });
  if (!league) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/join/${params.code}`);

  await prisma.leagueMember.upsert({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
    update: {},
    create: { leagueId: league.id, userId: user.id, role: "MEMBER" },
  });

  redirect(`/leagues/${league.id}`);
}
