import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NotifyForm } from "./NotifyForm";

export default async function PublicLeaguesPage() {
  const shows = await prisma.leagueTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, glyph: true },
  });

  return (
    <div className="px-5 sm:px-10 py-8 sm:py-14 pb-24">
      <div className="max-w-6xl mx-auto">
        <p className="font-script text-3xl sm:text-4xl text-pink leading-none mb-0.5">find your people</p>
        <h1 className="font-display text-4xl sm:text-6xl tracking-wide mb-2">PUBLIC LEAGUES</h1>
        <p className="text-[17px] text-cream/60 mb-8 max-w-xl">
          Open leagues anyone can join, opening soon. Private leagues are live today.
        </p>

        <div className="grid gap-5 mb-10" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple to-pink p-8 flex flex-col">
            <p className="font-script text-3xl text-ink leading-none">jump straight in</p>
            <h2 className="font-display text-2xl sm:text-3xl tracking-wide mt-1.5 mb-2.5 text-cream">
              JOIN A PUBLIC LEAGUE
            </h2>
            <p className="text-[15px] leading-relaxed text-ink/78 font-medium mb-5 max-w-xs">
              Claim a spot in an open league and draft with strangers who care way too much. No invite needed.
              Opening soon.
            </p>
            <a
              href="#coming-soon"
              className="mt-auto self-start px-6 py-3 rounded-full bg-ink text-cream font-bold text-sm hover:bg-cream hover:text-ink transition"
            >
              See what is coming
            </a>
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-card border border-cream/14 p-8 flex flex-col">
            <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-purple/20 pointer-events-none" />
            <div className="relative flex flex-col flex-1">
              <p className="font-script text-3xl text-pink leading-none">your rules only</p>
              <h2 className="font-display text-2xl sm:text-3xl tracking-wide mt-1.5 mb-2.5">CREATE A PRIVATE LEAGUE</h2>
              <p className="text-[15px] leading-relaxed text-cream/62 mb-5 max-w-xs">
                Invite link only, never listed publicly. Write your own point rules and run the whole season for
                your group chat.
              </p>
              <Link
                href="/leagues/new"
                className="mt-auto self-start px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition shadow-[0_10px_28px_rgba(123,44,245,.34)]"
              >
                Create a league
              </Link>
            </div>
          </div>
        </div>

        <div
          id="coming-soon"
          className="relative border border-dashed border-cream/20 rounded-3xl px-6 sm:px-10 py-16 text-center overflow-hidden scroll-mt-24"
        >
          <div
            className="absolute -top-32 left-1/2 -ml-56 w-[440px] h-[340px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(123,44,245,.28), transparent 68%)" }}
          />
          <div className="relative">
            <p className="font-script text-3xl sm:text-4xl text-pink leading-none">hold tight</p>
            <h2 className="font-display text-3xl sm:text-4xl tracking-wide mt-2 mb-3">PUBLIC LEAGUES COMING SOON</h2>
            <p className="text-base leading-relaxed text-cream/60 max-w-md mx-auto mb-6">
              We are lining up the first season of open leagues. Start a private one now, or get a note the day
              this page fills up.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/leagues/new"
                className="px-7 py-3.5 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition shadow-[0_10px_28px_rgba(123,44,245,.34)]"
              >
                Create a private league
              </Link>
              {shows.length > 0 && <NotifyForm shows={shows} />}
            </div>
            <div className="flex gap-2.5 justify-center mt-8">
              <span className="w-3 h-3 rounded-full bg-purple block" />
              <span className="w-3 h-3 rounded-full bg-pink block" />
              <span className="w-3 h-3 rounded-full bg-cream block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
