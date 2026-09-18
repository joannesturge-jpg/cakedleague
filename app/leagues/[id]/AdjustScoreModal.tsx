"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export type AdjustMode = "ADD" | "SUBTRACT" | "SET";

const MODE_COPY: Record<AdjustMode, { title: string; inputLabel: string }> = {
  ADD: { title: "add points", inputLabel: "Points to add" },
  SUBTRACT: { title: "subtract points", inputLabel: "Points to subtract" },
  SET: { title: "set total score", inputLabel: "New total score" },
};

export function AdjustScoreModal({
  leagueId,
  memberId,
  memberName,
  mode,
  currentTotal,
  onClose,
}: {
  leagueId: string;
  memberId: string;
  memberName: string;
  mode: AdjustMode;
  currentTotal: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const copy = MODE_COPY[mode];
  const amountNum = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountNum);
  const valid = amountValid && note.trim().length > 0;

  const points = mode === "ADD" ? amountNum : mode === "SUBTRACT" ? -amountNum : amountNum - currentTotal;
  const resultingTotal = currentTotal + (amountValid ? points : 0);

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${leagueId}/members/${memberId}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, amount: amountNum, points, note: note.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save that adjustment");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that adjustment");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-cream/12 rounded-3xl max-w-sm w-full p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/60 hover:text-cream hover:bg-cream/10 transition text-xl"
        >
          ×
        </button>
        <p className="font-script text-2xl text-pink leading-none mb-1">{copy.title}</p>
        <h2 className="font-display text-xl tracking-wide mb-5 truncate pr-8">{memberName.toUpperCase()}</h2>

        <label className="block text-xs font-semibold text-cream/55 mb-1.5">{copy.inputLabel}</label>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full px-3.5 py-2.5 rounded-xl bg-ink/50 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition mb-4"
        />

        <label className="block text-xs font-semibold text-cream/55 mb-1.5">
          Why? (shows up in their score breakdown)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. Bonus for best costume theme participation"
          className="w-full px-3.5 py-2.5 rounded-xl bg-ink/50 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition mb-2 resize-y"
        />

        {amountValid && (
          <p className="text-xs text-cream/45 mb-4">
            {memberName} goes from {currentTotal} to <span className="text-pink font-semibold">{resultingTotal}</span>
          </p>
        )}

        {error && <p className="text-sm text-[#ff8fa8] mb-3">{error}</p>}

        <button
          onClick={save}
          disabled={!valid || saving}
          className="w-full py-2.5 rounded-full bg-pink text-ink text-sm font-bold disabled:opacity-40 transition"
        >
          {saving ? "Saving…" : "Save adjustment"}
        </button>
      </div>
    </div>,
    document.body
  );
}
