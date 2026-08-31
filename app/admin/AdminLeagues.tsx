"use client";
import { useMemo, useState } from "react";

export type AdminLeagueRow = {
  id: string;
  name: string;
  tag: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  _count: { members: number };
};

type StatusFilter = "All" | "Active" | "Inactive" | "Deleted";

function statusOf(l: AdminLeagueRow): Exclude<StatusFilter, "All"> {
  if (l.deletedAt) return "Deleted";
  return l.isActive ? "Active" : "Inactive";
}

export function AdminLeagues({ leagues }: { leagues: AdminLeagueRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leagues.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !(l.tag ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter !== "All" && statusOf(l) !== statusFilter) return false;
      return true;
    });
  }, [leagues, query, statusFilter]);

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">LEAGUES</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {leagues.length} {leagues.length === 1 ? "league" : "leagues"} ever created
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or tag"
          className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        />
        <div className="flex gap-1.5 flex-wrap">
          {(["All", "Active", "Inactive", "Deleted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                statusFilter === s ? "bg-[#F1E9FE] border-purple text-[#5B1FBF]" : "bg-white border-[#D6D9E0] text-[#5B6270]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3.5 px-[18px] py-3 bg-[#F8F9FB] border-b border-[#E2E4E9] text-[10.5px] tracking-widest text-[#8A909B] font-bold">
            <span>LEAGUE NAME</span>
            <span>TAG</span>
            <span>ACTIVE MEMBERS</span>
            <span>STATUS</span>
          </div>
          {filtered.map((l) => {
            const status = statusOf(l);
            return (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3.5 items-center px-[18px] py-3.5 border-b border-[#EDEFF3] last:border-0"
              >
                <span className={`text-sm font-semibold truncate ${status === "Deleted" ? "text-[#8A909B]" : "text-[#16181D]"}`}>
                  {l.name}
                </span>
                <span>
                  {l.tag ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-[#F1E9FE] text-[#5B1FBF]">
                      {l.tag}
                    </span>
                  ) : (
                    <span className="text-[13px] text-[#B4B9C2]">—</span>
                  )}
                </span>
                <span className="text-sm">{l._count.members}</span>
                <span>
                  <StatusBadge status={status} />
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[#6B7280]">
              {leagues.length === 0 ? "No leagues created yet." : "No leagues match that search or filter."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Exclude<StatusFilter, "All"> }) {
  const styles: Record<typeof status, string> = {
    Active: "bg-[#EEF8F1] text-[#1E7B45]",
    Inactive: "bg-[#F1F2F5] text-[#8A909B]",
    Deleted: "bg-[#FDF2F4] text-[#C2314E]",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
