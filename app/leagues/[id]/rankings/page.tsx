import { notFound, redirect } from "next/navigation";
import { loadLeaguePage } from "../loadLeaguePage";
import { NotALeagueMember } from "../NotALeagueMember";
import { LeaguePageClient } from "../LeaguePageClient";

export const dynamic = "force-dynamic";

export default async function LeagueRankingsPage({ params }: { params: { id: string } }) {
  const result = await loadLeaguePage(params.id);

  if (result.kind === "login") redirect(`/login?next=/leagues/${params.id}/rankings`);
  if (result.kind === "not-found") notFound();
  if (result.kind === "forbidden") return <NotALeagueMember />;

  return (
    <LeaguePageClient
      league={result.league}
      isOwner={result.isOwner}
      currentUserId={result.currentUserId}
      isAdminPreview={result.isAdminPreview}
      initialTab="rankings"
    />
  );
}
