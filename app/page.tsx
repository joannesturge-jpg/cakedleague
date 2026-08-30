import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import AdminPage from "@/app/admin/page";

export default async function HomePage() {
  const host = headers().get("host") || "";
  if (host.startsWith("admin.")) {
    return <AdminPage />;
  }

  const user = await getCurrentUser();

  return (
    <div>
      <section className="relative px-10 pt-24 pb-20 overflow-hidden">
        <div
          className="absolute -top-40 -left-32 w-[540px] h-[540px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(123,44,245,.45), transparent 68%)" }}
        />
        <div
          className="absolute -bottom-56 -right-28 w-[580px] h-[580px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,91,174,.3), transparent 68%)" }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple/20 border border-purple/50 text-[12.5px] font-semibold text-lilac mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-pink inline-block" />
            First leagues opening this season
          </div>

          <h1 className="font-display text-7xl md:text-8xl leading-[0.9] tracking-wide">
            DRAFT
            <br />
            ANYTHING
          </h1>
          <p className="font-script text-4xl md:text-5xl text-pink mt-2 mb-6 leading-none">even the weird stuff</p>

          <p className="text-lg text-cream/70 max-w-xl mx-auto mb-9 leading-relaxed">
            Bake Off. Dancing with the Stars. Survivor. Your cousin&apos;s bowling league. If nobody built the app for
            it, build the league yourself. Your show, your rules, your points.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="px-8 py-4 rounded-full bg-purple text-cream font-bold text-base hover:bg-[#8f47ff] transition shadow-[0_12px_34px_rgba(123,44,245,.42)]"
            >
              {user ? "Go to my leagues" : "Start a league"}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-10 pb-24">
        <div className="max-w-4xl mx-auto rounded-[28px] p-14 text-center relative overflow-hidden bg-gradient-to-br from-purple to-pink">
          <h2 className="font-display text-4xl md:text-5xl text-cream leading-none">
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
    </div>
  );
}
