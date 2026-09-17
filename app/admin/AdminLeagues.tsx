"use client";
import { useMemo, useState } from "react";

export type AdminLeagueRow = {
  id: string;
  name: string;
  tag: string | null;
  templateId: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  _count: { members: number };
};

type StatusFilter = "All" | "Active" | "Inactive" | "Deleted";

function statusOf(l: AdminLeagueRow): Exclude<StatusFilter, "All"> {
  if (l.deletedAt) return "Deleted";
  return l.isActive ? "Active" : "Inactive";
}

const UNTAGGED = "Untagged";

export function AdminLeagues({
  leagues,
  templateNameById,
}: {
  leagues: AdminLeagueRow[];
  templateNameById: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [tagFilter, setTagFilter] = useState<string>("All");

  // Leagues showing the same tag/template name can still point at
  // different LeagueTemplate rows if more than one was ever created for
  // the same show — which would split their scoring apart even though
  // everything looks identical in the UI. Grouping by the real
  // templateId (not just the tag) surfaces that split immediately.
  const templateGroups = useMemo(() => {
    const nonDeleted = leagues.filter((l) => !l.deletedAt);
    const counts = new Map<string, number>();
    for (const l of nonDeleted) {
      const key = l.templateId ?? "__none__";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([templateId, count]) => ({
        templateId,
        name: templateId === "__none__" ? "No template (custom league)" : templateNameById[templateId] ?? "Unknown template",
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [leagues, templateNameById]);

  // More than one templateId sharing the same resolved name is exactly
  // the split described above.
  const nameCollisions = useMemo(() => {
    const byName = new Map<string, number>();
    for (const g of templateGroups) {
      if (g.templateId === "__none__") continue;
      byName.set(g.name, (byName.get(g.name) ?? 0) + 1);
    }
    return new Set(Array.from(byName.entries()).filter(([, n]) => n > 1).map(([name]) => name));
  }, [templateGroups]);

  const tags = useMemo(() => {
    const set = new Set(leagues.map((l) => l.tag).filter((t): t is string => !!t));
    const hasUntagged = leagues.some((l) => !l.tag);
    return [...Array.from(set).sort(), ...(hasUntagged ? [UNTAGGED] : [])];
  }, [leagues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leagues.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !(l.tag ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter !== "All" && statusOf(l) !== statusFilter) return false;
      if (tagFilter !== "All") {
        if (tagFilter === UNTAGGED ? !!l.tag : l.tag !== tagFilter) return false;
      }
      return true;
    });
  }, [leagues, query, statusFilter, tagFilter]);

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

      <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px] mb-4">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-3">
          ACTIVE LEAGUES BY TEMPLATE
        </div>
        <div className="flex flex-col gap-1.5">
          {templateGroups.map((g) => (
            <div key={g.templateId} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#16181D] flex items-center gap-2">
                {g.name}
                {nameCollisions.has(g.name) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-[#FDF2F4] text-[#C2314E]">
                    SPLIT — {g.templateId}
                  </span>
                )}
              </span>
              <span className="font-semibold text-[#5B6270]">
                {g.count} league{g.count === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
        {nameCollisions.size > 0 && (
          <p className="text-xs text-[#C2314E] mt-3">
            Two or more leagues share a template name but not the same template id — scores entered against one
            won&apos;t apply to leagues built on the other. Check League Templates for a duplicate.
          </p>
        )}
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
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center pl-2.5 border-l border-[#E2E4E9]">
            <button
              onClick={() => setTagFilter("All")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                tagFilter === "All" ? "bg-[#F1E9FE] border-purple text-[#5B1FBF]" : "bg-white border-[#D6D9E0] text-[#5B6270]"
              }`}
            >
              All tags
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                  tagFilter === t ? "bg-[#F1E9FE] border-purple text-[#5B1FBF]" : "bg-white border-[#D6D9E0] text-[#5B6270]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] gap-3.5 px-[18px] py-3 bg-[#F8F9FB] border-b border-[#E2E4E9] text-[10.5px] tracking-widest text-[#8A909B] font-bold">
            <span>LEAGUE NAME</span>
            <span>TAG</span>
            <span>TEMPLATE</span>
            <span>ACTIVE MEMBERS</span>
            <span>STATUS</span>
          </div>
          {filtered.map((l) => {
            const status = statusOf(l);
            return (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] gap-3.5 items-center px-[18px] py-3.5 border-b border-[#EDEFF3] last:border-0"
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
                <span className="text-xs text-[#5B6270] truncate" title={l.templateId ?? ""}>
                  {l.templateId ? (templateNameById[l.templateId] ?? "Unknown") : "—"}
                  {l.templateId && <span className="text-[#B4B9C2]"> ({l.templateId})</span>}
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
