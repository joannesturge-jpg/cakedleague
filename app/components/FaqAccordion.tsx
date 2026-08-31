"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "What counts as a league?",
    a: "Anything with participants and repeating outcomes. A TV season, a tournament, a neighborhood bowling night. If you can list who is competing, you can draft them.",
  },
  {
    q: "Who decides the scoring?",
    a: "You do. The commissioner writes the point rules in plain language and assigns values to whatever matters. Soggy bottom minus five, immunity idol plus twenty, whatever your group agrees on.",
  },
  {
    q: "Do I have to enter results manually?",
    a: "For most leagues, yes. The commissioner logs what happened after each episode or event and standings recalculate instantly.",
  },
  {
    q: "Can I keep my league private?",
    a: "Yes. Private leagues are invite link only and never appear on the public Leagues page.",
  },
  {
    q: "Is it free?",
    a: "Free forever for leagues under 20 people. Larger leagues and custom seasons are on a paid tier. If the beta saved your group chat, you can buy us a coffee and keep the servers awake.",
    link: { label: "Buy me a coffee ☕", href: "https://buymeacoffee.com/cakedfantasy" },
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number>(-1);

  return (
    <div className="flex flex-col gap-2.5">
      {FAQS.map((f, i) => (
        <div
          key={f.q}
          onClick={() => setOpen((o) => (o === i ? -1 : i))}
          className="bg-card border border-cream/10 rounded-2xl px-6 py-5 cursor-pointer hover:border-pink/45 transition"
        >
          <div className="flex items-center justify-between gap-5">
            <h3 className="font-display text-lg tracking-wide leading-tight">{f.q}</h3>
            <span className="font-display text-2xl text-pink leading-none flex-none">{open === i ? "–" : "+"}</span>
          </div>
          {open === i && (
            <>
              <p className="text-[15.5px] leading-relaxed text-cream/62 mt-3.5 max-w-2xl">{f.a}</p>
              {f.link && (
                <a
                  href={f.link.href}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block mt-3.5 px-5 py-2.5 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition"
                >
                  {f.link.label}
                </a>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
