"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Season-specific cast photos — update this list (and the files under
// public/dwts-cast/) when a new DWTS season's cast is announced.
const DWTS_CAST = [
  { name: "Jackson Olson", photo: "/dwts-cast/jackson-olson.avif" },
  { name: "Ciara Miller", photo: "/dwts-cast/ciara-miller.avif" },
  { name: "Maura Higgins", photo: "/dwts-cast/maura-higgins.avif" },
  { name: "Guillermo Rodriguez", photo: "/dwts-cast/guillermo-rodriguez.avif" },
  { name: "Conner Leavitt", photo: "/dwts-cast/conner-leavitt.avif" },
  { name: "Harry Shum Jr.", photo: "/dwts-cast/harry-shum-jr.avif" },
  { name: "Giada DeLaurentiis", photo: "/dwts-cast/giada-delaurentiis.avif" },
  { name: "Tyler Cameron", photo: "/dwts-cast/tyler-cameron.avif" },
  { name: "Sarah Jane Nader", photo: "/dwts-cast/sarah-jane-nader.avif" },
  { name: "Connor Wood", photo: "/dwts-cast/connor-wood.avif" },
  { name: "Amber Glenn", photo: "/dwts-cast/amber-glenn.avif" },
  { name: "Ezra Frech", photo: "/dwts-cast/ezra-frech.avif" },
  { name: "Taylor Hanson", photo: "/dwts-cast/taylor-hanson.avif" },
  { name: "Tatyana Ali", photo: "/dwts-cast/tatyana-ali.avif" },
  { name: "Jenna Dewan", photo: "/dwts-cast/jennadewan.avif" },
  { name: "Julia Stiles", photo: "/dwts-cast/julia-stiles.avif" },
];

export function ContestantsModal({
  contestants,
  eliminatedContestants,
  initialSelected,
  onSave,
  onClose,
}: {
  contestants: string[];
  eliminatedContestants: string[];
  initialSelected: string[];
  onSave: (selected: string[]) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // A working copy — closing via the X or the backdrop discards it, only
  // the Save button pushes it back up. Seeded on first paint from
  // initialSelected, then re-synced any time that prop's value actually
  // changes — so this can never show a stale pick, even if a future change
  // keeps this component mounted across opens instead of remounting it.
  function seedDraft(source: string[]) {
    const seeded = [...source];
    while (seeded.length < 3) seeded.push("");
    return seeded.slice(0, 3);
  }
  const [draft, setDraft] = useState<string[]>(() => seedDraft(initialSelected));
  const selectedKey = initialSelected.join("|");
  const [syncedKey, setSyncedKey] = useState(selectedKey);
  if (selectedKey !== syncedKey) {
    setSyncedKey(selectedKey);
    setDraft(seedDraft(initialSelected));
  }

  if (!mounted) return null;

  // Prefer the actual contestant entry (which may read "Name with Pro
  // Partner") if it matches this cast member; otherwise just their name.
  function matchFor(name: string) {
    return contestants.find((c) => c.toLowerCase().includes(name.toLowerCase())) ?? null;
  }

  function toggle(contestant: string) {
    setDraft((prev) => {
      if (prev.includes(contestant)) {
        const remaining = prev.filter((c) => c !== contestant);
        while (remaining.length < 3) remaining.push("");
        return remaining;
      }
      const emptyIndex = prev.findIndex((c) => !c);
      if (emptyIndex === -1) return prev;
      const next = [...prev];
      next[emptyIndex] = contestant;
      return next;
    });
  }

  const filledSlots = draft.filter(Boolean).length;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-cream/12 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close without saving"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/60 hover:text-cream hover:bg-cream/10 transition text-xl z-10"
        >
          ×
        </button>
        <div className="flex-none px-6 sm:px-8 pt-6 sm:pt-8 pb-1">
          <p className="font-script text-3xl text-pink leading-none mb-1">meet the cast</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide">THE PAIRINGS</h2>
          <p className="text-sm text-cream/55 mt-1.5">
            Tap a photo to rank your top three — {filledSlots}/3 picked.
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 pt-4 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {DWTS_CAST.map((person) => {
              const match = matchFor(person.name);
              const isOut = match ? eliminatedContestants.includes(match) : false;
              const pickable = !!match && !isOut;
              const rank = match ? draft.indexOf(match) : -1;
              const isPicked = rank !== -1;

              return (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => pickable && match && toggle(match)}
                  disabled={!pickable}
                  className={`relative flex flex-col items-center text-center gap-2.5 rounded-2xl p-1.5 transition ${
                    pickable ? "cursor-pointer hover:bg-cream/5" : "cursor-not-allowed opacity-40"
                  }`}
                >
                  <div className="relative w-full">
                    <img
                      src={person.photo}
                      alt={person.name}
                      className={`w-full aspect-square object-cover rounded-2xl border-2 transition ${
                        isPicked ? "border-pink" : "border-cream/10"
                      }`}
                    />
                    {isPicked && (
                      <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-pink text-ink font-display text-sm flex items-center justify-center shadow">
                        {rank + 1}
                      </span>
                    )}
                    {!isPicked && pickable && filledSlots < 3 && (
                      <span className="absolute top-2 left-2 w-7 h-7 rounded-full border-2 border-cream/80 bg-ink/25" />
                    )}
                    {!isPicked && pickable && filledSlots >= 3 && (
                      <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-cream/85 text-ink font-bold text-sm flex items-center justify-center shadow">
                        ×
                      </span>
                    )}
                    {isOut && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/70">
                        <span className="text-[10px] font-bold tracking-widest text-cream/70">ELIMINATED</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-cream/85">{match ?? person.name}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-none flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-cream/10">
          <p className="text-xs text-cream/45">Closing with × won&apos;t save changes.</p>
          <button
            onClick={() => onSave(draft)}
            className="px-6 py-2.5 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition"
          >
            Save picks
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
