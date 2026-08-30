"use client";
import { useMemo, useState } from "react";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  isAdmin: boolean;
  _count: { leagues: number };
};

export function AdminUsers({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">USER ACCOUNTS</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {users.length} {users.length === 1 ? "account" : "accounts"} total
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        />
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1.1fr_1.5fr_0.7fr_0.9fr] gap-3.5 px-[18px] py-3 bg-[#F8F9FB] border-b border-[#E2E4E9] text-[10.5px] tracking-widest text-[#8A909B] font-bold">
            <span>NAME</span>
            <span>EMAIL</span>
            <span>LEAGUES</span>
            <span>JOINED</span>
          </div>
          {filtered.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1.1fr_1.5fr_0.7fr_0.9fr] gap-3.5 items-center px-[18px] py-3.5 border-b border-[#EDEFF3] last:border-0"
            >
              <span className="text-sm font-semibold truncate flex items-center gap-2">
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
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[#6B7280]">No accounts match that search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
