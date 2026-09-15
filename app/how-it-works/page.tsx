import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "You create the league",
    body: "Set the rules, the rewards, and who's allowed in.",
  },
  {
    num: "02",
    title: "You pick a show",
    body: "Right now that's Dancing with the Stars or The Great British Bake Off. Leagues for any show you want are coming soon.",
  },
  {
    num: "03",
    title: "We score the show for you",
    body: "Once results come in, your league updates on its own. Wrote your own custom rules? You'll score those yourself from the Scoring tab on your league page.",
  },
  {
    num: "04",
    title: "Picks reset every week",
    body: "Submissions open back up within 24 hours of the episode ending, so everyone has time to lock in picks for the next round.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="px-5 sm:px-10 py-14 sm:py-20 pb-24">
      <div className="max-w-3xl mx-auto">
        <p className="font-script text-3xl text-pink leading-none mb-1">the rundown</p>
        <h1 className="font-display text-4xl sm:text-6xl tracking-wide leading-[0.95] mb-4">HOW OUR LEAGUES WORK</h1>
        <p className="text-cream/60 max-w-md mb-12 leading-relaxed">
          All the nitty gritty on creating and running a league on Caked.
        </p>

        <div className="grid gap-3.5 sm:grid-cols-2 mb-14">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-card border border-cream/10 rounded-3xl p-6 flex flex-col gap-2.5">
              <span className="font-display text-2xl text-lilac leading-none">{step.num}</span>
              <h3 className="font-bold text-base">{step.title}</h3>
              <p className="text-cream/60 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl sm:text-3xl tracking-wide mb-2">WHEN PICKS ARE DUE</h2>
        <p className="text-cream/60 text-sm leading-relaxed mb-6">
          Every show runs on its own schedule. Here&apos;s the default for each. Commissioners can change the day,
          time, and time zone anytime from their league settings.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="rounded-3xl border border-cream/10 p-6"
            style={{ background: "linear-gradient(160deg, rgba(232,91,174,.16), #2A1743 55%)" }}
          >
            <span className="text-2xl mb-1.5 block">💃</span>
            <h3 className="font-display text-lg tracking-wide mb-2.5">DANCING WITH THE STARS</h3>
            <p className="text-cream/60 text-sm leading-relaxed">
              Picks are due <strong className="text-cream">Tuesdays at 5:00 PM PT</strong> by default. Results post
              as soon as the episode wraps, Pacific time, so you can start picking for the next week{" "}
              <strong className="text-cream">Wednesday morning</strong>.
            </p>
          </div>
          <div
            className="rounded-3xl border border-cream/10 p-6"
            style={{ background: "linear-gradient(160deg, rgba(123,44,245,.2), #2A1743 55%)" }}
          >
            <span className="text-2xl mb-1.5 block">🧁</span>
            <h3 className="font-display text-lg tracking-wide mb-2.5">THE GREAT BRITISH BAKE OFF</h3>
            <p className="text-cream/60 text-sm leading-relaxed">
              We go by the US air schedule. Picks are due <strong className="text-cream">Thursdays at midnight PT</strong> by
              default. Results post within 24 hours of the episode airing, Pacific time, so you can start picking
              for the next week <strong className="text-cream">Saturday morning</strong>.
            </p>
          </div>
        </div>

        <div className="mt-14 bg-card border border-cream/10 rounded-3xl p-6 sm:p-7 flex items-center justify-between gap-4 flex-wrap">
          <p className="font-semibold">Have a question about how it works?</p>
          <Link
            href="/feedback"
            className="flex-none px-6 py-2.5 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition"
          >
            Share feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
