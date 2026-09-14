"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Cast photos for WEEKLY_CATEGORIES leagues. Keyed by first name — add a
// new show's cast here (and its images under public/<show>-cast/) the
// same way; the modal only shows itself when a template's contestants
// actually match a list below.
const CATEGORY_CASTS: { name: string; photo: string }[][] = [
  [
    { name: "Clara", photo: "/bake-off-cast/clara.webp" },
    { name: "Connie", photo: "/bake-off-cast/connie.webp" },
    { name: "Danni", photo: "/bake-off-cast/danni.webp" },
    { name: "Gabe", photo: "/bake-off-cast/gabe.webp" },
    { name: "Gary", photo: "/bake-off-cast/gary.webp" },
    { name: "Mo", photo: "/bake-off-cast/mo.webp" },
    { name: "Molly", photo: "/bake-off-cast/molly.webp" },
    { name: "Moyin", photo: "/bake-off-cast/moyin.webp" },
    { name: "Nikki", photo: "/bake-off-cast/nikki.webp" },
    { name: "Shannon", photo: "/bake-off-cast/shannon.webp" },
    { name: "Tom", photo: "/bake-off-cast/tom.webp" },
    { name: "Yannis", photo: "/bake-off-cast/yannis.webp" },
  ],
];

// Small edit-distance check so a typo in the admin-entered contestant list
// doesn't silently break the pairing between a photo and a real pick.
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
    .filter((w) => w.length > 1);
}

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

function matchCast(castList: { name: string; photo: string }[], contestants: string[]) {
  const castToContestant = new Map<string, string>();
  const claimed = new Set<string>();
  for (const person of castList) {
    const found = contestants.find((c) => !claimed.has(c) && fuzzyIncludes(c, person.name));
    if (found) {
      castToContestant.set(person.name, found);
      claimed.add(found);
    }
  }
  return castToContestant;
}

// Picks the cast list (if any) that covers this template's contestants —
// so a future WEEKLY_CATEGORIES show without a matching photo set just
// falls back to plain dropdowns instead of a half-empty gallery.
export function findCategoryCast(contestants: string[]) {
  let best: { cast: { name: string; photo: string }[]; matches: Map<string, string> } | null = null;
  for (const cast of CATEGORY_CASTS) {
    const matches = matchCast(cast, contestants);
    if (matches.size > 0 && (!best || matches.size > best.matches.size)) {
      best = { cast, matches };
    }
  }
  return best;
}

export type CategoryDraft = { starBaker: string; technical: string; votedOff: string };

const SLOT_ORDER: (keyof CategoryDraft)[] = ["starBaker", "technical", "votedOff"];
const SLOT_LABEL: Record<keyof CategoryDraft, string> = {
  starBaker: "SB",
  technical: "TW",
  votedOff: "OUT",
};
const SLOT_COLOR: Record<keyof CategoryDraft, string> = {
  starBaker: "bg-pink text-ink",
  technical: "bg-purple text-cream",
  votedOff: "bg-lilac text-ink",
};

export function CategoryPicksModal({
  cast,
  matches,
  eliminatedContestants,
  initial,
  onSave,
  onClose,
}: {
  cast: { name: string; photo: string }[];
  matches: Map<string, string>;
  eliminatedContestants: string[];
  initial: CategoryDraft;
  onSave: (draft: CategoryDraft) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [draft, setDraft] = useState<CategoryDraft>(initial);

  if (!mounted) return null;

  function slotsFor(contestant: string) {
    return SLOT_ORDER.filter((slot) => draft[slot] === contestant);
  }

  function handleTap(contestant: string) {
    const occupied = slotsFor(contestant);
    if (occupied.length > 0) {
      // Already assigned somewhere — tapping again clears every slot it's in.
      setDraft((prev) => {
        const next = { ...prev };
        for (const slot of occupied) next[slot] = "";
        return next;
      });
      return;
    }
    const emptySlot = SLOT_ORDER.find((slot) => !draft[slot]);
    if (!emptySlot) return;
    setDraft((prev) => ({ ...prev, [emptySlot]: contestant }));
  }

  function renderCard(person: { name: string; photo: string }) {
    const match = matches.get(person.name) ?? null;
    const isOut = match ? eliminatedContestants.includes(match) : false;
    const slots = match ? slotsFor(match) : [];
    const pickable = !!match && !isOut;

    return (
      <button
        key={person.name}
        type="button"
        onClick={() => pickable && match && handleTap(match)}
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
              slots.length > 0 ? "border-pink" : "border-cream/10"
            }`}
          />
          {slots.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {slots.map((slot) => (
                <span
                  key={slot}
                  className={`px-1.5 h-6 min-w-6 rounded-full font-display text-[10px] flex items-center justify-center shadow ${SLOT_COLOR[slot]}`}
                >
                  {SLOT_LABEL[slot]}
                </span>
              ))}
            </div>
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

  const pickedNames = new Set(SLOT_ORDER.map((slot) => draft[slot]).filter(Boolean));
  const pickedPeople = cast.filter((p) => {
    const match = matches.get(p.name);
    return match && pickedNames.has(match);
  });
  const restPeople = cast.filter((p) => !pickedPeople.includes(p));
  const filledCount = SLOT_ORDER.filter((slot) => draft[slot]).length;

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
          <p className="font-script text-3xl text-pink leading-none mb-1">meet the bakers</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide">THIS WEEK&apos;S PICKS</h2>
          <p className="text-sm text-cream/55 mt-1.5">
            Tap a photo — first tap sets Star Baker, then Technical Winner, then Voted Off. Tap again to clear.{" "}
            {filledCount}/3 picked.
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-cream/50">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-pink inline-block" /> Star Baker
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-purple inline-block" /> Technical Winner
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-lilac inline-block" /> Voted Off
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 pt-4 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {pickedPeople.map((person) => renderCard(person))}
            {pickedPeople.length > 0 && <div className="col-span-full h-px bg-cream/15 -my-1.5" />}
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
