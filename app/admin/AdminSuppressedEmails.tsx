"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type SuppressedEmailRow = { id: string; email: string; createdAt: Date };

export function AdminSuppressedEmails({ emails }: { emails: SuppressedEmailRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function addEmails() {
    if (!draft.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/suppressed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: draft }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't add those");
      setDraft("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add those");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setRemovingId(id);
    try {
      await fetch(`/api/admin/suppressed-emails/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  const filtered = emails.filter((e) => e.email.includes(query.trim().toLowerCase()));

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">UNSUBSCRIBED</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {emails.length} {emails.length === 1 ? "address" : "addresses"} that never get emailed — signup
            confirmations, league created/joined, and picks-due reminders all skip anyone on this list, no matter
            what they do on the site. Password resets still go through, since those are requested on purpose.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px] mb-4">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2">ADD ADDRESSES</div>
        <p className="text-xs text-[#8A909B] mb-2.5">Paste one or more emails — any spaces, commas, or new lines between them work.</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="someone@example.com, another@example.com"
          className="w-full px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition resize-y mb-2.5"
        />
        {error && <p className="text-sm text-[#C2314E] font-medium mb-2.5">{error}</p>}
        <button
          onClick={addEmails}
          disabled={saving || !draft.trim()}
          className="px-5 py-2.5 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
        >
          {saving ? "Adding…" : "Add to list"}
        </button>
      </div>

      <div className="flex items-center gap-2.5 p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        />
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg overflow-x-auto">
        <div className="min-w-[420px]">
          <div className="grid grid-cols-[2fr_1fr_auto] gap-3.5 px-[18px] py-3 bg-[#F8F9FB] border-b border-[#E2E4E9] text-[10.5px] tracking-widest text-[#8A909B] font-bold">
            <span>EMAIL</span>
            <span>ADDED</span>
            <span></span>
          </div>
          {filtered.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[2fr_1fr_auto] gap-3.5 items-center px-[18px] py-3.5 border-b border-[#EDEFF3] last:border-0"
            >
              <span className="text-sm text-[#16181D] truncate">{e.email}</span>
              <span className="text-[13.5px] text-[#6B7280]">
                {e.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button
                onClick={() => remove(e.id)}
                disabled={removingId === e.id}
                className="px-3 py-1.5 rounded-md text-[13px] font-semibold border border-[#D6D9E0] text-[#5B6270] hover:border-[#C2314E] hover:text-[#C2314E] transition disabled:opacity-40"
              >
                {removingId === e.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[#6B7280]">
              {emails.length === 0 ? "No suppressed addresses yet." : "No addresses match that search."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
