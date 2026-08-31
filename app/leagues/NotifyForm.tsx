"use client";
import { useState } from "react";

type Show = { id: string; name: string; glyph: string };

export function NotifyForm({ shows }: { shows: Show[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [templateId, setTemplateId] = useState(shows[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-7 py-3.5 rounded-full border border-cream/22 text-cream font-semibold text-sm hover:border-cream transition"
      >
        Notify me at launch
      </button>
    );
  }

  if (status === "done") {
    return (
      <div className="px-7 py-3.5 rounded-full border border-cream/22 text-cream font-semibold text-sm">
        You&apos;re on the list &mdash; we&apos;ll email you.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, templateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-card border border-cream/14 rounded-2xl sm:rounded-full p-2.5"
    >
      <select
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        className="px-4 py-2.5 rounded-full bg-ink border border-cream/14 text-cream text-sm outline-none focus:border-purple transition"
      >
        {shows.map((s) => (
          <option key={s.id} value={s.id}>
            {s.glyph} {s.name}
          </option>
        ))}
      </select>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="flex-1 min-w-[180px] px-4 py-2.5 rounded-full bg-ink border border-cream/14 text-cream text-sm outline-none focus:border-purple transition"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-2.5 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Notify me"}
      </button>
    </form>
    {error && <p className="text-pink text-xs px-2">{error}</p>}
    </div>
  );
}
