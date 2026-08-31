import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaguePageClient } from "./LeaguePageClient";

export const dynamic = "force-dynamic";

export default async function LeaguePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/leagues/${params.id}`);

  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: {
      rules: { orderBy: { order: "asc" } },
      members: { include: { user: { select: { name: true } } }, orderBy: { joinedAt: "asc" } },
      template: true,
    },
  });

  if (!league || league.deletedAt) notFound();

  const isMember = league.members.some((m) => m.userId === user.id);
  const isOwner = league.ownerId === user.id;

  if (!isMember && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center">
        <h1 className="font-display text-3xl tracking-wide">NOT A MEMBER</h1>
        <p className="text-cream/60 max-w-sm">
          You need an invite link to see this league. Ask the commissioner for one.
        </p>
      </div>
    );
  }

  return <LeaguePageClient league={league} isOwner={isOwner} currentUserId={user.id} />;
}
