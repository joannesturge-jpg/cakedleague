"use client";
import { useMemo, useState } from "react";

export type NotifySignupRow = {
  id: string;
  email: string;
  createdAt: Date;
  template: { name: string; glyph: string };
};

export function AdminMarketing({ signups }: { signups: NotifySignupRow[] }) {
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState("All");

  const shows = useMemo(() => Array.from(new Set(signups.map((s) => s.template.name))), [signups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signups.filter(
      (s) => (!q || s.email.toLowerCase().includes(q)) && (showFilter === "All" || s.template.name === showFilter)
    );
  }, [signups, query, showFilter]);

  const byShow = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of signups) counts[s.template.name] = (counts[s.template.name] ?? 0) + 1;
    return counts;
  }, [signups]);

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">MARKETING</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {signups.length} {signups.length === 1 ? "person" : "people"} waiting to be notified when drafting opens
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(byShow).map(([name, count]) => (
            <div key={name} className="min-w-[118px] px-4 py-3 rounded-lg bg-white border border-[#E2E4E9]">
              <div className="text-[10.5px] tracking-wide text-[#8A909B] font-bold mb-1">{name.toUpperCase()}</div>
              <div className="text-xl font-bold">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap items-center p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        />
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...shows].map((s) => (
            <button
              key={s}
              onClick={() => setShowFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                showFilter === s ? "bg-[#F1E9FE] border-purple text-[#5B1FBF]" : "bg-white border-[#D6D9E0] text-[#5B6270]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[2fr_1.3fr_1fr] gap-3.5 px-[18px] py-3 bg-[#F8F9FB] border-b border-[#E2E4E9] text-[10.5px] tracking-widest text-[#8A909B] font-bold">
            <span>EMAIL</span>
            <span>WANTS TO DRAFT</span>
            <span>REQUESTED</span>
          </div>
          {filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[2fr_1.3fr_1fr] gap-3.5 items-center px-[18px] py-3.5 border-b border-[#EDEFF3] last:border-0"
            >
              <span className="text-sm text-[#16181D] truncate">{s.email}</span>
              <span className="text-sm text-[#5B6270] flex items-center gap-1.5">
                <span>{s.template.glyph}</span>
                {s.template.name}
              </span>
              <span className="text-[13.5px] text-[#6B7280]">
                {s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[#6B7280]">
              {signups.length === 0 ? "No signups yet." : "No signups match that search or filter."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
