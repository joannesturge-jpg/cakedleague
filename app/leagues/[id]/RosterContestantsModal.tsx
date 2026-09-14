"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Cast photos for ROSTER-format leagues (draft-and-keep, unlike DWTS's
// weekly top-three). Keyed by first name — add a new show's cast here (and
// its images under public/<show>-cast/) the same way; the modal only shows
// itself when a template's contestants actually match a list below.
const ROSTER_CASTS: { name: string; photo: string }[][] = [
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

// Greedily pairs each cast photo with (at most) one contestant string, in
// cast-list order, so a photo can't be double-booked to two contestants.
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
// so adding a future ROSTER show without a matching photo set just means no
// "See Contestants" button shows up, instead of a half-empty gallery.
export function findRosterCast(contestants: string[]) {
  let best: { cast: { name: string; photo: string }[]; matches: Map<string, string> } | null = null;
  for (const cast of ROSTER_CASTS) {
    const matches = matchCast(cast, contestants);
    if (matches.size > 0 && (!best || matches.size > best.matches.size)) {
      best = { cast, matches };
    }
  }
  return best;
}

type Pick = { id: string; contestant: string; memberId: string };
type Member = { id: string; user: { name: string } };

export function RosterContestantsModal({
  cast,
  matches,
  eliminatedContestants,
  picks,
  members,
  myMembershipId,
  busy,
  onDraft,
  onUndraft,
  onClose,
}: {
  cast: { name: string; photo: string }[];
  matches: Map<string, string>;
  eliminatedContestants: string[];
  picks: Pick[];
  members: Member[];
  myMembershipId: string | null;
  busy: string | null;
  onDraft: (contestant: string) => void;
  onUndraft: (contestant: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const memberName = (memberId: string) => members.find((m) => m.id === memberId)?.user.name ?? "Someone";

  function renderCard(person: { name: string; photo: string }) {
    const match = matches.get(person.name) ?? null;
    const isOut = match ? eliminatedContestants.includes(match) : false;
    const pick = match ? picks.find((p) => p.contestant === match) : undefined;
    const isMine = !!pick && pick.memberId === myMembershipId;
    const isTaken = !!pick && !isMine;
    const isBusy = match ? busy === match : false;
    const clickable = !!match && !isOut && !isTaken && !isBusy && (isMine || !!myMembershipId);

    function handleClick() {
      if (!clickable || !match) return;
      if (isMine) onUndraft(match);
      else onDraft(match);
    }

    return (
      <button
        key={person.name}
        type="button"
        onClick={handleClick}
        disabled={!clickable}
        className={`relative flex flex-col items-center text-center gap-2.5 rounded-2xl p-1.5 transition ${
          clickable ? "cursor-pointer hover:bg-cream/5" : isTaken || isOut ? "cursor-not-allowed opacity-60" : "cursor-not-allowed opacity-40"
        }`}
      >
        <div className="relative w-full">
          <img
            src={person.photo}
            alt={person.name}
            className={`w-full aspect-square object-cover rounded-2xl border-2 transition ${
              isMine ? "border-pink" : "border-cream/10"
            }`}
          />
          {isOut && (
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/70">
              <span className="text-[10px] font-bold tracking-widest text-cream/70">ELIMINATED</span>
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-cream/85">{match ?? person.name}</p>
        {isMine && <p className="text-[11px] font-bold text-pink -mt-1.5">yours · tap to drop</p>}
        {isTaken && <p className="text-[11px] text-cream/40 -mt-1.5">{memberName(pick!.memberId)}</p>}
      </button>
    );
  }

  const mine = cast.filter((p) => {
    const match = matches.get(p.name);
    const pick = match ? picks.find((pk) => pk.contestant === match) : undefined;
    return pick && pick.memberId === myMembershipId;
  });
  const mineNames = new Set(mine.map((p) => p.name));
  const rest = cast.filter((p) => !mineNames.has(p.name));

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
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/60 hover:text-cream hover:bg-cream/10 transition text-xl z-10"
        >
          ×
        </button>
        <div className="flex-none px-6 sm:px-8 pt-6 sm:pt-8 pb-1">
          <p className="font-script text-3xl text-pink leading-none mb-1">meet the bakers</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide">THE TENT</h2>
          <p className="text-sm text-cream/55 mt-1.5">Tap a photo to draft — first come, first served.</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 pt-4 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {mine.map((person) => renderCard(person))}
            {mine.length > 0 && <div className="col-span-full h-px bg-cream/15 -my-1.5" />}
            {rest.map((person) => renderCard(person))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
