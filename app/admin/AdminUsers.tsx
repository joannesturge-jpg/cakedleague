"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  isAdmin: boolean;
  isBlocked: boolean;
  _count: { leagues: number };
};

type SortKey = "name" | "email" | "leagues" | "joined" | "status";
type StatusFilter = "All" | "Active" | "Blocked";
type LeagueFilter = "Any" | "None" | "1 to 3" | "4 or more";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "NAME" },
  { key: "email", label: "EMAIL" },
  { key: "leagues", label: "LEAGUES" },
  { key: "joined", label: "JOINED" },
  { key: "status", label: "STATUS" },
];

function matchesLeagueFilter(count: number, filter: LeagueFilter) {
  if (filter === "Any") return true;
  if (filter === "None") return count === 0;
  if (filter === "1 to 3") return count >= 1 && count <= 3;
  return count >= 4;
}

export function AdminUsers({ users: initialUsers }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("Any");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [resetSentFor, setResetSentFor] = useState<Record<string, boolean>>({});
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const stats = useMemo(
    () => ({
      total: users.length,
      blocked: users.filter((u) => u.isBlocked).length,
      leaguesJoined: users.reduce((sum, u) => sum + u._count.leagues, 0),
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (statusFilter === "Active" && u.isBlocked) return false;
      if (statusFilter === "Blocked" && !u.isBlocked) return false;
      if (!matchesLeagueFilter(u._count.leagues, leagueFilter)) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "email") cmp = a.email.localeCompare(b.email);
      else if (sortKey === "leagues") cmp = a._count.leagues - b._count.leagues;
      else if (sortKey === "joined") cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else if (sortKey === "status") cmp = Number(a.isBlocked) - Number(b.isBlocked);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [users, query, statusFilter, leagueFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setLeagueFilter("Any");
  }

  function exportCsv() {
    const header = ["Name", "Email", "Joined", "Leagues", "Admin", "Status"];
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      String(u._count.leagues),
      u.isAdmin ? "Yes" : "No",
      u.isBlocked ? "Blocked" : "Active",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caked-leagues-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleResetPassword(id: string) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send reset email");
      setResetSentFor((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setResetSentFor((prev) => ({ ...prev, [id]: false })), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send reset email");
    } finally {
      setBusyId(null);
      setOpenMenuFor(null);
    }
  }

  async function handleToggleBlock(user: AdminUserRow) {
    setError("");
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !user.isBlocked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't update this account");
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !user.isBlocked } : u)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this account");
    } finally {
      setBusyId(null);
      setOpenMenuFor(null);
    }
  }

  async function handleDelete(user: AdminUserRow) {
    if (!window.confirm(`Delete ${user.name}'s account? This can't be undone.`)) return;
    setError("");
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete this account");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this account");
    } finally {
      setBusyId(null);
      setOpenMenuFor(null);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">USER ACCOUNTS</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {users.length} {users.length === 1 ? "account" : "accounts"} total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <StatCard label="TOTAL USERS" value={stats.total} />
          <StatCard label="BLOCKED" value={stats.blocked} color="#C2314E" />
          <StatCard label="LEAGUES JOINED" value={stats.leaguesJoined} color="#5B1FBF" />
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3.5 py-2.5 rounded-md bg-[#FDF2F4] border border-[#F3C6CF] text-[#C2314E] text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
          />
          <button onClick={clearFilters} className="text-[13px] font-semibold text-[#5B6270] hover:text-purple transition">
            Clear
          </button>
          <button
            onClick={exportCsv}
            className="px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[13px] font-semibold text-[#16181D] hover:border-purple hover:text-purple transition flex-none"
          >
            Export CSV
          </button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <ChipGroup label="Status" options={["All", "Active", "Blocked"]} value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} />
          <ChipGroup
            label="Leagues"
            options={["Any", "None", "1 to 3", "4 or more"]}
            value={leagueFilter}
            onChange={(v) => setLeagueFilter(v as LeagueFilter)}
          />
        </div>
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1.1fr_1.5fr_0.7fr_0.9fr_0.8fr_1.2fr] gap-3.5 px-[18px] py-3 bg-[#F8F9FB] border-b border-[#E2E4E9] text-[10.5px] tracking-widest text-[#8A909B] font-bold">
            {SORT_COLUMNS.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={`flex items-center gap-1 text-left transition ${
                  sortKey === col.key ? "text-[#5B1FBF]" : "hover:text-[#5B6270]"
                }`}
              >
                {col.label}
                {sortKey === col.key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </button>
            ))}
            <span>ACTIONS</span>
          </div>
          {filtered.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1.1fr_1.5fr_0.7fr_0.9fr_0.8fr_1.2fr] gap-3.5 items-center px-[18px] py-3.5 border-b border-[#EDEFF3] last:border-0"
            >
              <span
                className={`text-sm font-semibold truncate flex items-center gap-2 ${
                  u.isBlocked ? "text-[#8A909B]" : "text-[#16181D]"
                }`}
              >
                {u.name}
                {u.isAdmin && (
                  <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-purple/10 text-purple">
                    ADMIN
                  </span>
                )}
              </span>
              <span className="text-[13.5px] text-[#5B6270] truncate">{u.email}</span>
              <span className="text-sm">{u._count.leagues}</span>
              <span className="text-[13.5px] text-[#6B7280]">
                {u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>
                {u.isBlocked ? (
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-[#FDF2F4] text-[#C2314E]">
                    BLOCKED
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-[#EEF8F1] text-[#1E7B45]">
                    ACTIVE
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => handleResetPassword(u.id)}
                  disabled={busyId === u.id}
                  className={`px-2.5 py-1.5 rounded-md text-[12.5px] font-semibold border transition disabled:opacity-50 ${
                    resetSentFor[u.id]
                      ? "bg-[#EEF8F1] border-[#1E7B45]/30 text-[#1E7B45]"
                      : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple hover:text-purple"
                  }`}
                >
                  {resetSentFor[u.id] ? "Reset sent" : "Reset password"}
                </button>
                <button
                  onClick={() => setOpenMenuFor(openMenuFor === u.id ? null : u.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-[#D6D9E0] text-[#5B6270] hover:border-purple hover:text-purple transition"
                >
                  &#8942;
                </button>
                {openMenuFor === u.id && (
                  <div className="absolute right-0 top-9 z-10 w-48 bg-white border border-[#E2E4E9] rounded-lg shadow-lg py-1.5">
                    <button
                      onClick={() => handleToggleBlock(u)}
                      disabled={busyId === u.id}
                      className="w-full text-left px-3.5 py-2 text-[13px] text-[#16181D] hover:bg-[#F8F9FB] transition disabled:opacity-50"
                    >
                      {u.isBlocked ? "Unblock login" : "Block from login"}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={busyId === u.id}
                      className="w-full text-left px-3.5 py-2 text-[13px] text-[#C2314E] hover:bg-[#FDF2F4] transition disabled:opacity-50"
                    >
                      Delete account
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[#6B7280]">No accounts match that search or filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="min-w-[118px] px-4 py-3 rounded-lg bg-white border border-[#E2E4E9]">
      <div className="text-[10.5px] tracking-wide text-[#8A909B] font-bold mb-1">{label}</div>
      <div className="text-xl font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11.5px] font-semibold text-[#8A909B] mr-0.5">{label}</span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-md text-[13px] font-semibold border transition ${
            value === opt ? "bg-[#F1E9FE] border-purple text-[#5B1FBF]" : "bg-white border-[#D6D9E0] text-[#5B6270]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
