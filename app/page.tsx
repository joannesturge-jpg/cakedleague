import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { AdminDashboard } from "@/app/admin/AdminDashboard";
import { FaqAccordion } from "@/app/components/FaqAccordion";

export const dynamic = "force-dynamic";

const STANDINGS = [
  { rank: 1, name: "Proving Ground", pts: 148, delta: "+12", deltaColor: "#7CE8B0", color: "#E85BAE" },
  { rank: 2, name: "Bake My Day", pts: 141, delta: "+6", deltaColor: "#7CE8B0", color: "#7B2CF5" },
  { rank: 3, name: "Rise & Proof", pts: 129, delta: "−3", deltaColor: "#FF8FA8", color: "#FBF7F4" },
  { rank: 4, name: "Hollywood Handshake", pts: 117, delta: "+1", deltaColor: "#7CE8B0", color: "#C8A6FF" },
];

const MARQUEE_ITEMS = [
  "BRITISH BAKE OFF",
  "SURVIVOR",
  "DANCING WITH THE STARS",
  "LOVE IS BLIND",
  "REALITY TV",
  "LOCAL SPORTING EVENTS",
  "AND MORE!",
];

export default async function HomePage() {
  const host = headers().get("host") || "";
  if (host.startsWith("admin.")) {
    return <AdminDashboard />;
  }

  const user = await getCurrentUser();

  return (
    <div>
      <section className="relative px-5 sm:px-10 pt-12 sm:pt-24 pb-11 sm:pb-20 overflow-hidden">
        <div
          className="absolute -top-40 -left-32 w-[540px] h-[540px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(123,44,245,.45), transparent 68%)" }}
        />
        <div
          className="absolute -bottom-56 -right-28 w-[580px] h-[580px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,91,174,.3), transparent 68%)" }}
        />

        <div className="relative max-w-6xl mx-auto grid gap-10 lg:gap-16 items-center" style={{ gridTemplateColumns: "1.05fr 0.95fr" }}>
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple/20 border border-purple/50 text-[12.5px] font-semibold text-lilac mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-pink inline-block" />
              First leagues opening this season
            </div>

            <h1 className="font-display text-6xl sm:text-8xl leading-[0.9] tracking-wide">
              DRAFT
              <br />
              ANYTHING
            </h1>
            <p className="font-script text-3xl sm:text-5xl text-pink mt-2 mb-6 leading-none">even the weird stuff</p>

            <p className="text-lg text-cream/70 max-w-lg mb-8 leading-relaxed">
              Bake Off. Dancing with the Stars. Survivor. Your cousin&apos;s bowling league. If nobody built the app
              for it, build the league yourself. Your show, your rules, your points.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="px-8 py-4 rounded-full bg-purple text-cream font-bold text-base hover:bg-[#8f47ff] transition shadow-[0_12px_34px_rgba(123,44,245,.42)]"
              >
                {user ? "Go to my leagues" : "Start a league"}
              </Link>
            </div>
          </div>

          <div className="relative" style={{ animation: "cwfloat 7s ease-in-out infinite" }}>
            <div className="bg-card border border-cream/12 rounded-3xl p-5 shadow-[0_34px_74px_rgba(0,0,0,.48)]">
              <div className="flex items-start justify-between mb-[18px]">
                <div>
                  <div className="font-script text-2xl text-pink leading-none">week six</div>
                  <div className="font-display text-2xl tracking-wide mt-0.5">PASTRY WEEK</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-pink/15 text-pink text-[11px] font-extrabold tracking-widest">
                  LIVE
                </div>
              </div>
              {STANDINGS.map((row) => (
                <div key={row.rank} className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-cream/[0.045] mb-1.5">
                  <span className="font-display text-sm text-cream/42 w-4">{row.rank}</span>
                  <span className="w-7 h-7 rounded-full flex-none" style={{ background: row.color }} />
                  <span className="flex-1 text-[14.5px] font-medium">{row.name}</span>
                  <span className="font-display text-lg">{row.pts}</span>
                  <span className="text-xs font-bold w-9 text-right" style={{ color: row.deltaColor }}>
                    {row.delta}
                  </span>
                </div>
              ))}
              <div className="mt-3.5 pt-3.5 border-t border-cream/10 text-[12.5px] text-cream/45">
                Commissioner rule: soggy bottom = −5
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-cream/[0.09] py-3.5 overflow-hidden bg-purple/[0.08]">
        <div className="flex w-max" style={{ animation: "cwmarq 40s linear infinite" }}>
          {[0, 1].map((rep) => (
            <div
              key={rep}
              className="flex gap-8 pr-8 font-display text-[17px] tracking-widest text-cream/42 whitespace-nowrap"
            >
              {MARQUEE_ITEMS.map((item) => (
                <span key={item} className="flex items-center gap-8">
                  {item}
                  <span className="text-pink">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="px-5 sm:px-10 pt-12 sm:pt-20">
        <div className="max-w-5xl mx-auto rounded-[28px] p-8 sm:p-16 text-center relative overflow-hidden bg-gradient-to-br from-purple to-pink">
          <h2 className="font-display text-3xl sm:text-5xl text-cream leading-none">
            YOUR GROUP CHAT IS ALREADY DOING THIS
          </h2>
          <p className="font-script text-4xl text-ink mt-2 mb-7">give it a scoreboard</p>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="inline-block px-9 py-4 rounded-full bg-ink text-cream font-bold text-base hover:bg-cream hover:text-ink transition"
          >
            Create your free account
          </Link>
          <p className="text-[13.5px] text-ink/70 font-semibold mt-4">Free forever for leagues under 20 people</p>
        </div>
      </section>

      <section className="px-5 sm:px-10 py-12 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="font-script text-3xl sm:text-4xl text-pink leading-none mb-0.5">the fine print</p>
          <h2 className="font-display text-3xl sm:text-5xl tracking-wide mb-8">QUESTIONS, ANSWERED</h2>
          <FaqAccordion />
        </div>
      </section>
    </div>
  );
}
