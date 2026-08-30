import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRAFT_MODE_LABELS } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: user.id },
    include: { league: true },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="px-5 sm:px-10 py-10 sm:py-14 pb-20 max-w-4xl mx-auto">
      <p className="font-script text-4xl text-pink leading-none mb-1">
        welcome back, {user.name.split(" ")[0].toLowerCase()}
      </p>
      <h1 className="font-display text-5xl tracking-wide mb-8">MY LEAGUES</h1>

      {memberships.length === 0 ? (
        <div className="bg-card border border-cream/10 rounded-2xl px-8 py-14 text-center mb-8">
          <p className="text-cream/60 mb-2">You don&apos;t have any leagues yet.</p>
          <p className="text-cream/40 text-sm">Start one, or ask a friend for their invite link.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {memberships.map(({ league, role }) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center gap-5 flex-wrap px-5 py-5 rounded-3xl bg-card border border-cream/10 hover:border-pink/55 transition"
            >
              <div
                className="w-[62px] h-[62px] rounded-2xl flex-none flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(140deg,#7B2CF5,#E85BAE)" }}
              >
                {league.glyph}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2.5 mb-0.5">
                  <h3 className="font-display text-2xl tracking-wide leading-tight">{league.name}</h3>
                  {role === "OWNER" && (
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple/25 text-lilac">
                      COMMISSIONER
                    </span>
                  )}
                </div>
                <p className="text-[13.5px] text-cream/50">
                  {DRAFT_MODE_LABELS[league.draftMode] ?? league.draftMode} · {league.visibility === "PRIVATE" ? "Private" : "Public"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link
          href="/leagues/new"
          className="px-7 py-3.5 rounded-full bg-purple text-cream font-bold text-[15px] hover:bg-[#8f47ff] transition shadow-[0_10px_28px_rgba(123,44,245,.34)]"
        >
          + New league
        </Link>
      </div>
    </div>
  );
}
