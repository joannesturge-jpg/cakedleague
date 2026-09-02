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

// Small edit-distance check so a typo in the admin-entered contestant list
// (e.g. "Harry Shun Jr." vs. the cast list's "Harry Shum Jr.") doesn't
// silently break the pairing between a photo and a real pick.
function levenshtein(a: string, b: string) {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function nameWords(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && w !== "jr");
}

// Every word in the cast member's name needs a close match somewhere in
// the contestant string — close meaning exact, or within 1-2 typo'd
// characters depending on word length.
function fuzzyIncludes(contestant: string, personName: string) {
  const contestantWords = nameWords(contestant);
  const target = nameWords(personName);
  return (
    target.length > 0 &&
    target.every((w) =>
      contestantWords.some((cw) => cw === w || levenshtein(cw, w) <= (w.length <= 4 ? 1 : 2))
    )
  );
}

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

  // Pair each cast photo with (at most) one contestant string, once, so
  // every lookup below agrees with every other one. Built greedily in
  // DWTS_CAST order and each contestant is claimed by only the first photo
  // that matches it — without that exclusivity, two photos whose names
  // both happen to substring-match the same contestant string could steal
  // each other's pick and leave one selection with no badge at all.
  const castToContestant = new Map<string, string>();
  const claimedContestants = new Set<string>();
  for (const person of DWTS_CAST) {
    const found = contestants.find(
      (c) => !claimedContestants.has(c) && fuzzyIncludes(c, person.name)
    );
    if (found) {
      castToContestant.set(person.name, found);
      claimedContestants.add(found);
    }
  }
  function matchFor(name: string) {
    return castToContestant.get(name) ?? null;
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

  function personFor(contestant: string) {
    return DWTS_CAST.find((p) => matchFor(p.name) === contestant) ?? null;
  }

  // Selected picks float to the top, in rank order, with a divider before
  // the rest of the cast — so once you've picked, reopening the modal
  // shows your top three first instead of making you scroll to find them.
  const pickedPeople = draft
    .filter(Boolean)
    .map((c) => personFor(c))
    .filter((p): p is (typeof DWTS_CAST)[number] => !!p);
  const pickedNames = new Set(pickedPeople.map((p) => p.name));
  const restPeople = DWTS_CAST.filter((p) => !pickedNames.has(p.name));

  function renderCard(person: (typeof DWTS_CAST)[number]) {
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
          {isOut && (
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/70">
              <span className="text-[10px] font-bold tracking-widest text-cream/70">ELIMINATED</span>
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-cream/85">{match ?? person.name}</p>
      </button>
    );
  }

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
            {pickedPeople.map((person) => renderCard(person))}
            {pickedPeople.length > 0 && (
              <div className="col-span-full h-px bg-cream/15 -my-1.5" />
            )}
            {restPeople.map((person) => renderCard(person))}
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
