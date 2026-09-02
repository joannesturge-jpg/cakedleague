"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DRAFT_MODE_LABELS, formatDueDate, isSeasonPredictionsLocked } from "@/lib/leagues";
import { ContestantsModal } from "./ContestantsModal";

type Rule = { id: string; label: string; points: number; isCustom: boolean };
type WeeklyPick = { id: string; week: number; topThree: string[]; songPrediction: string | null };
type Member = {
  id: string;
  userId: string;
  role: string;
  notifyPicksDue: boolean;
  winnerPick: string | null;
  finalFourPicks: string[];
  weeklyPicks: WeeklyPick[];
  user: { name: string };
};
type Pick = { id: string; contestant: string; memberId: string };
type Template = {
  id: string;
  name: string;
  contestants: string[];
  eliminatedContestants: string[];
  draftOpenDay: string | null;
  draftOpenTime: string | null;
  pickFormat: string;
} | null;
type League = {
  id: string;
  name: string;
  glyph: string;
  description: string | null;
  visibility: string;
  inviteCode: string;
  weeks: number | null;
  scoringPerWeek: number | null;
  dueDay: string;
  dueTime: string;
  draftMode: string;
  entryFeeEnabled: boolean;
  entryFeeAmount: number | null;
  entryFeePayMethod: string | null;
  prizeEnabled: boolean;
  prizePlaces: number | null;
  rules: Rule[];
  members: Member[];
  picks: Pick[];
  template: Template;
};

const MEMBER_COLORS = ["#7B2CF5", "#E85BAE", "#C8A6FF", "#FBF7F4", "#8f47ff"];

// Contestant strings are entered as "Celeb Name & Pro Name" (or "... with
// Pro ..."). The Submissions tab only wants the celeb's name.
function celebrityName(full: string) {
  const idx = full.search(/\s*&\s*|\s+with\s+/i);
  return idx === -1 ? full : full.slice(0, idx).trim();
}

export function LeaguePageClient({
  league,
  isOwner,
  currentUserId,
}: {
  league: League;
  isOwner: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"details" | "submissions" | "rankings" | "scoring">("details");
  const [rulesOpen, setRulesOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [deleting, setDeleting] = useState(false);

  const myMembership = league.members.find((m) => m.userId === currentUserId);
  const [notifyOn, setNotifyOn] = useState(myMembership?.notifyPicksDue ?? true);
  const [notifySaving, setNotifySaving] = useState(false);

  const [picks, setPicks] = useState(league.picks);
  const [pickBusy, setPickBusy] = useState<string | null>(null);
  const [pickError, setPickError] = useState("");

  async function draftContestant(contestant: string) {
    setPickBusy(contestant);
    setPickError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}/picks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestant }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't draft that contestant");
      setPicks((prev) => [...prev, data]);
    } catch (err) {
      setPickError(err instanceof Error ? err.message : "Couldn't draft that contestant");
    } finally {
      setPickBusy(null);
    }
  }

  async function undraftContestant(contestant: string) {
    setPickBusy(contestant);
    setPickError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}/picks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestant }),
      });
      if (!res.ok) throw new Error("Couldn't drop that contestant");
      setPicks((prev) => prev.filter((p) => p.contestant !== contestant));
    } catch (err) {
      setPickError(err instanceof Error ? err.message : "Couldn't drop that contestant");
    } finally {
      setPickBusy(null);
    }
  }

  const [winnerPick, setWinnerPick] = useState(myMembership?.winnerPick ?? null);
  const [winnerBusy, setWinnerBusy] = useState(false);
  const [winnerError, setWinnerError] = useState("");

  async function pickWinner(contestant: string) {
    setWinnerBusy(true);
    setWinnerError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}/winner-pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestant }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save that pick");
      setWinnerPick(data.winnerPick);
      return true;
    } catch (err) {
      setWinnerError(err instanceof Error ? err.message : "Couldn't save that pick");
      return false;
    } finally {
      setWinnerBusy(false);
    }
  }

  const [finalFourPicks, setFinalFourPicks] = useState(myMembership?.finalFourPicks ?? []);
  const [finalFourBusy, setFinalFourBusy] = useState(false);
  const [finalFourError, setFinalFourError] = useState("");

  async function submitFinalFour(picks: string[]) {
    setFinalFourBusy(true);
    setFinalFourError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}/final-four-pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save those picks");
      setFinalFourPicks(data.finalFourPicks);
      return true;
    } catch (err) {
      setFinalFourError(err instanceof Error ? err.message : "Couldn't save those picks");
      return false;
    } finally {
      setFinalFourBusy(false);
    }
  }

  const [weeklyPicks, setWeeklyPicks] = useState(myMembership?.weeklyPicks ?? []);
  const [weekliesBusy, setWeekliesBusy] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");

  async function submitWeeklyPick(week: number, topThree: string[], songPrediction: string) {
    setWeekliesBusy(true);
    setWeeklyError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}/weekly-pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, topThree, songPrediction: songPrediction || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save that pick");
      setWeeklyPicks((prev) => [...prev.filter((p) => p.week !== week), data]);
      return true;
    } catch (err) {
      setWeeklyError(err instanceof Error ? err.message : "Couldn't save that pick");
      return false;
    } finally {
      setWeekliesBusy(false);
    }
  }

  async function toggleNotify() {
    const next = !notifyOn;
    setNotifyOn(next);
    setNotifySaving(true);
    try {
      await fetch(`/api/leagues/${league.id}/notify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyPicksDue: next }),
      });
    } finally {
      setNotifySaving(false);
    }
  }

  const weeks = league.weeks ?? undefined;
  const scoringPerWeek = league.scoringPerWeek ?? undefined;
  const hasCustomRules = league.rules.some((r) => r.isCustom);

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${league.inviteCode}`);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy link"), 1500);
  }

  async function deleteLeague() {
    if (!confirm(`Delete "${league.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leagues/${league.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const facts = [
    { label: "Template", value: league.template?.name ?? "Custom" },
    ...(weeks ? [{ label: "Season length", value: `${weeks} weeks` }] : []),
    ...(scoringPerWeek ? [{ label: "Scoring per week", value: `${scoringPerWeek}x` }] : []),
    { label: "Drafting", value: DRAFT_MODE_LABELS[league.draftMode] ?? league.draftMode },
    { label: "Entry fee", value: league.entryFeeEnabled ? `$${league.entryFeeAmount} via ${league.entryFeePayMethod}` : "None" },
    { label: "Prize", value: league.prizeEnabled ? `${league.prizePlaces} place${(league.prizePlaces ?? 0) > 1 ? "s" : ""} pay out` : "None" },
  ];

  return (
    <div className="px-5 sm:px-10 py-8 sm:py-11 pb-20 max-w-[57.6rem] mx-auto">
      <div className="flex gap-6 items-center flex-wrap mb-8">
        <div
          className="w-[100px] h-[100px] rounded-3xl flex-none flex items-center justify-center text-5xl shadow-[0_18px_44px_rgba(123,44,245,.34)]"
          style={{ background: "linear-gradient(140deg,#7B2CF5,#E85BAE)" }}
        >
          {league.glyph}
        </div>
        <div className="flex-1 min-w-[240px]">
          <span
            className={`inline-block px-3 py-1 rounded-full text-[10.5px] font-extrabold tracking-widest mb-1.5 ${
              league.visibility === "PRIVATE" ? "bg-[#7CE8B0]/15 text-[#7CE8B0]" : "bg-purple/20 text-lilac"
            }`}
          >
            {league.visibility}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-1.5 leading-tight">{league.name}</h1>
          {league.description && <p className="text-cream/60 max-w-lg leading-relaxed">{league.description}</p>}
        </div>
        {isOwner && (
          <button
            onClick={deleteLeague}
            disabled={deleting}
            className="text-sm font-semibold text-cream/40 hover:text-pink transition flex-none"
          >
            {deleting ? "Deleting…" : "Delete league"}
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-6 border-b border-cream/12 pb-0.5">
        <TabButton active={tab === "details"} onClick={() => setTab("details")}>
          Details
        </TabButton>
        {league.template?.pickFormat === "WEEKLY_TOP3" && (
          <TabButton active={tab === "submissions"} onClick={() => setTab("submissions")}>
            Submissions
          </TabButton>
        )}
        <TabButton active={tab === "rankings"} onClick={() => setTab("rankings")}>
          Rankings
        </TabButton>
        {isOwner && hasCustomRules && (
          <TabButton active={tab === "scoring"} onClick={() => setTab("scoring")}>
            Scoring
          </TabButton>
        )}
      </div>

      {tab === "details" && (
        <div>
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {facts.map((f) => (
              <div key={f.label} className="p-4 rounded-2xl bg-card border border-cream/10">
                <div className="text-[10.5px] tracking-widest text-cream/36 font-bold mb-1.5">{f.label.toUpperCase()}</div>
                <div className="text-sm font-medium">{f.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap p-5 rounded-2xl bg-pink/10 border border-pink/35 mb-3">
            <div className="text-[10.5px] tracking-widest text-pink font-bold">PICKS DUE</div>
            <div className="font-display text-xl tracking-wide">{formatDueDate(league.dueDay, league.dueTime)}</div>
          </div>

          <button
            onClick={toggleNotify}
            disabled={notifySaving}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-card border border-cream/10 mb-5 text-left disabled:opacity-60"
          >
            <span className={`w-10 h-6 rounded-full relative transition flex-none ${notifyOn ? "bg-pink" : "bg-cream/15"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifyOn ? "left-[18px]" : "left-0.5"}`} />
            </span>
            <span className="text-[14.5px] text-cream/75">Email me when picks are due for this league</span>
          </button>

          <div className="flex flex-col gap-3">
            <Panel
              title="SCORING RULES"
              count={`${league.rules.length} rule${league.rules.length === 1 ? "" : "s"}`}
              open={rulesOpen}
              onToggle={() => setRulesOpen((v) => !v)}
            >
              {league.rules.length === 0 ? (
                <p className="text-sm text-cream/45">No point rules yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {league.rules.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-ink/50">
                      <span className="text-sm text-cream/78">{r.label}</span>
                      <span className="font-display text-base">{r.points > 0 ? `+${r.points}` : r.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="MEMBERS"
              count={`${league.members.length} member${league.members.length === 1 ? "" : "s"}`}
              open={membersOpen}
              onToggle={() => setMembersOpen((v) => !v)}
            >
              <div className="flex flex-col gap-2 mb-4">
                {league.members.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-ink/50">
                    <span className="w-8 h-8 rounded-full flex-none" style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{m.user.name}</div>
                      <div className="text-xs text-cream/45">{m.role === "OWNER" ? "Commissioner" : "Member"}</div>
                    </div>
                  </div>
                ))}
              </div>
              {isOwner && (
                <div className="flex gap-2.5 flex-wrap items-center">
                  <div className="flex-1 min-w-[220px] px-3.5 py-3 rounded-xl bg-ink/60 border border-cream/12 text-[13px] text-cream/65 truncate">
                    {typeof window !== "undefined" ? `${window.location.origin}/join/${league.inviteCode}` : league.inviteCode}
                  </div>
                  <button
                    onClick={copyInvite}
                    className="px-6 py-3 rounded-full bg-pink text-ink font-extrabold text-[14.5px] hover:bg-cream transition whitespace-nowrap"
                  >
                    {copyLabel}
                  </button>
                </div>
              )}
            </Panel>

            {league.template?.pickFormat === "WEEKLY_TOP3" ? (
              <WeeklyPicksForm
                template={league.template}
                weeks={league.weeks ?? 11}
                winnerPick={winnerPick}
                winnerBusy={winnerBusy}
                winnerError={winnerError}
                onPickWinner={pickWinner}
                finalFourPicks={finalFourPicks}
                finalFourBusy={finalFourBusy}
                finalFourError={finalFourError}
                onSubmitFinalFour={submitFinalFour}
                weeklyPicks={weeklyPicks}
                weekliesBusy={weekliesBusy}
                weeklyError={weeklyError}
                onSubmitWeekly={submitWeeklyPick}
              />
            ) : (
              <DraftPool
                template={league.template}
                members={league.members}
                picks={picks}
                myMembershipId={myMembership?.id ?? null}
                busy={pickBusy}
                error={pickError}
                onDraft={draftContestant}
                onUndraft={undraftContestant}
              />
            )}

            {isOwner && league.template?.pickFormat === "WEEKLY_TOP3" && (
              <CommissionerSongPredictions members={league.members} />
            )}
          </div>
        </div>
      )}

      {tab === "submissions" && (
        <SubmissionsTab members={league.members} weeks={league.weeks ?? 11} myMembershipId={myMembership?.id ?? null} />
      )}

      {tab === "rankings" && <ComingSoon title="LEAGUE TABLE" text="Standings show up here once scoring starts." />}
      {tab === "scoring" && (
        <ComingSoon title="ENTER RESULTS" text="Score entry for commissioners is coming soon." badge="ADMIN" />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-1 pb-3 text-sm font-semibold border-b-2 transition ${
        active ? "border-pink text-cream" : "border-transparent text-cream/45 hover:text-cream/75"
      }`}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-cream/10 rounded-3xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-xl tracking-wide">{title}</h3>
          <span className="text-[13.5px] text-cream/45">{count}</span>
        </div>
        <span className="font-display text-xl text-pink leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

function DraftPool({
  template,
  members,
  picks,
  myMembershipId,
  busy,
  error,
  onDraft,
  onUndraft,
}: {
  template: Template;
  members: Member[];
  picks: Pick[];
  myMembershipId: string | null;
  busy: string | null;
  error: string;
  onDraft: (contestant: string) => void;
  onUndraft: (contestant: string) => void;
}) {
  if (!template || template.contestants.length === 0) {
    return (
      <div className="bg-card border border-cream/10 rounded-2xl p-6 text-center">
        <h3 className="font-display text-xl tracking-wide mb-1.5">DRAFT POOL</h3>
        <p className="font-script text-3xl text-pink leading-none">Not ready yet!</p>
        <p className="text-sm text-cream/55 mt-2">Drafting is coming soon for this league.</p>
      </div>
    );
  }

  const active = template.contestants.filter((c) => !template.eliminatedContestants.includes(c));
  const memberName = (memberId: string) => members.find((m) => m.id === memberId)?.user.name ?? "Someone";

  return (
    <div className="bg-card border border-cream/10 rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h3 className="font-display text-xl tracking-wide">DRAFT POOL</h3>
        {template.draftOpenDay && template.draftOpenTime && (
          <span className="text-[11px] text-cream/40 font-semibold">
            Picks open {formatDueDate(template.draftOpenDay, template.draftOpenTime)} PT
          </span>
        )}
      </div>
      <p className="text-sm text-cream/55 mb-4">
        First come, first served — once someone drafts a contestant, they&apos;re off the board.
      </p>
      {error && <p className="text-sm text-pink font-medium mb-3">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        {active.map((c) => {
          const pick = picks.find((p) => p.contestant === c);
          const isMine = pick && pick.memberId === myMembershipId;
          const isBusy = busy === c;
          if (!pick) {
            return (
              <button
                key={c}
                onClick={() => onDraft(c)}
                disabled={isBusy || !myMembershipId}
                className="px-3 py-2 rounded-xl text-sm font-semibold border border-cream/15 bg-ink/40 text-cream/80 hover:border-pink transition disabled:opacity-50"
              >
                {isBusy ? "Drafting…" : c}
              </button>
            );
          }
          return (
            <button
              key={c}
              onClick={() => (isMine ? onUndraft(c) : undefined)}
              disabled={isBusy || !isMine}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition disabled:opacity-70 ${
                isMine ? "border-pink bg-pink/15 text-pink" : "border-cream/10 bg-ink/20 text-cream/35"
              }`}
            >
              {c} · {isMine ? "yours ×" : memberName(pick.memberId)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyPicksForm({
  template,
  weeks,
  winnerPick,
  winnerBusy,
  winnerError,
  onPickWinner,
  finalFourPicks,
  finalFourBusy,
  finalFourError,
  onSubmitFinalFour,
  weeklyPicks,
  weekliesBusy,
  weeklyError,
  onSubmitWeekly,
}: {
  template: Template;
  weeks: number;
  winnerPick: string | null;
  winnerBusy: boolean;
  winnerError: string;
  onPickWinner: (contestant: string) => Promise<boolean>;
  finalFourPicks: string[];
  finalFourBusy: boolean;
  finalFourError: string;
  onSubmitFinalFour: (picks: string[]) => Promise<boolean>;
  weeklyPicks: WeeklyPick[];
  weekliesBusy: boolean;
  weeklyError: string;
  onSubmitWeekly: (week: number, topThree: string[], songPrediction: string) => Promise<boolean>;
}) {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showContestants, setShowContestants] = useState(false);

  // Season winner — editable up until the lock date. Starts in edit mode
  // until a pick exists, then shows a saved view with an Edit pencil.
  const [winnerEditing, setWinnerEditing] = useState(!winnerPick);
  const [draftWinner, setDraftWinner] = useState(winnerPick ?? "");

  function enterWinnerEdit() {
    setDraftWinner(winnerPick ?? "");
    setWinnerEditing(true);
  }
  async function saveWinner() {
    if (!draftWinner) return;
    const ok = await onPickWinner(draftWinner);
    if (ok) setWinnerEditing(false);
  }

  // Final four — same editable-until-lock pattern as the winner pick.
  const [fourEditing, setFourEditing] = useState(finalFourPicks.length !== 4);
  const [draftFour, setDraftFour] = useState<string[]>(finalFourPicks.length === 4 ? finalFourPicks : []);

  function toggleFour(c: string) {
    setDraftFour((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : prev.length < 4 ? [...prev, c] : prev
    );
  }
  function enterFourEdit() {
    setDraftFour(finalFourPicks.length === 4 ? finalFourPicks : []);
    setFourEditing(true);
  }
  async function saveFour() {
    const ok = await onSubmitFinalFour(draftFour);
    if (ok) setFourEditing(false);
  }

  // Weekly top-three + song prediction — same pattern, but per-week: each
  // week starts in edit mode until that week has a saved pick.
  const startingPick = weeklyPicks.find((p) => p.week === 1);
  const [draftTop, setDraftTop] = useState<[string, string, string]>([
    startingPick?.topThree[0] ?? "",
    startingPick?.topThree[1] ?? "",
    startingPick?.topThree[2] ?? "",
  ]);
  const [draftSong, setDraftSong] = useState(startingPick?.songPrediction ?? "");
  const [weeklyEditing, setWeeklyEditing] = useState(!startingPick);

  function changeWeek(w: number) {
    setSelectedWeek(w);
    const p = weeklyPicks.find((x) => x.week === w);
    setDraftTop([p?.topThree[0] ?? "", p?.topThree[1] ?? "", p?.topThree[2] ?? ""]);
    setDraftSong(p?.songPrediction ?? "");
    setWeeklyEditing(!p);
  }

  function enterWeeklyEdit() {
    setDraftTop([existing?.topThree[0] ?? "", existing?.topThree[1] ?? "", existing?.topThree[2] ?? ""]);
    setDraftSong(existing?.songPrediction ?? "");
    setWeeklyEditing(true);
  }
  async function saveWeekly() {
    const ok = await onSubmitWeekly(selectedWeek, draftTop, draftSong);
    if (ok) setWeeklyEditing(false);
  }

  function saveTopThreeFromModal(picked: string[]) {
    const padded = [...picked];
    while (padded.length < 3) padded.push("");
    setDraftTop(padded.slice(0, 3) as [string, string, string]);
    setShowContestants(false);
  }

  if (!template) return null;
  const active = template.contestants.filter((c) => !template.eliminatedContestants.includes(c));
  const existing = weeklyPicks.find((p) => p.week === selectedWeek);
  const canSave = draftTop.every((c) => c) && new Set(draftTop).size === 3;

  return (
    <div className="flex flex-col gap-3">
      {!isSeasonPredictionsLocked() && (
        <>
          <div className="bg-card border border-cream/10 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <h3 className="font-display text-xl tracking-wide">SEASON WINNER</h3>
              {!winnerEditing && (
                <button
                  onClick={enterWinnerEdit}
                  className="text-xs font-semibold text-cream/55 hover:text-pink transition flex items-center gap-1"
                >
                  <span aria-hidden>✎</span> Edit
                </button>
              )}
            </div>
            {!winnerEditing ? (
              <p className="text-sm text-cream/70">
                Your pick: <span className="text-pink font-semibold">{winnerPick}</span>
              </p>
            ) : (
              <>
                <p className="text-sm text-cream/55 mb-3">
                  You can change this until Sept 15 at 5:00 PM PT — after that it locks for good.
                </p>
                {winnerError && <p className="text-sm text-pink font-medium mb-2">{winnerError}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {active.map((c) => {
                    const selected = draftWinner === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setDraftWinner(c)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                          selected
                            ? "border-pink bg-pink/15 text-pink"
                            : "border-cream/15 bg-ink/40 text-cream/80 hover:border-pink"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {c}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={saveWinner}
                  disabled={!draftWinner || winnerBusy}
                  className="px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
                >
                  {winnerBusy ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>

          <div className="bg-card border border-cream/10 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <h3 className="font-display text-xl tracking-wide">FINAL FOUR PREDICTIONS</h3>
              {!fourEditing && (
                <button
                  onClick={enterFourEdit}
                  className="text-xs font-semibold text-cream/55 hover:text-pink transition flex items-center gap-1"
                >
                  <span aria-hidden>✎</span> Edit
                </button>
              )}
            </div>
            {!fourEditing ? (
              <div className="flex flex-wrap gap-1.5">
                {finalFourPicks.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-2 rounded-xl text-sm font-semibold border border-pink bg-pink/15 text-pink"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm text-cream/55 mb-3">
                  +5 points for every one you get right. You can change these until Sept 15 at 5:00 PM PT — after
                  that they lock for good.
                </p>
                {finalFourError && <p className="text-sm text-pink font-medium mb-2">{finalFourError}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {active.map((c) => {
                    const selected = draftFour.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleFour(c)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                          selected
                            ? "border-pink bg-pink/15 text-pink"
                            : "border-cream/15 bg-ink/40 text-cream/80 hover:border-pink"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {c}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={saveFour}
                  disabled={draftFour.length !== 4 || finalFourBusy}
                  className="px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
                >
                  {finalFourBusy ? "Saving…" : `Save (${draftFour.length}/4)`}
                </button>
              </>
            )}
          </div>
        </>
      )}

      <div className="bg-card border border-cream/10 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <h3 className="font-display text-xl tracking-wide">WEEKLY PICKS</h3>
          <div className="flex items-center gap-2">
            {weeklyEditing && (
              <button
                onClick={() => setShowContestants(true)}
                className="px-3 py-2 rounded-lg border border-cream/15 text-cream/80 text-sm font-semibold hover:border-pink hover:text-pink transition"
              >
                See Contestants
              </button>
            )}
            <select
              value={selectedWeek}
              onChange={(e) => changeWeek(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-ink/60 border border-cream/15 text-cream text-sm outline-none"
            >
              {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>
        </div>
        {showContestants && (
          <ContestantsModal
            contestants={template.contestants}
            eliminatedContestants={template.eliminatedContestants}
            initialSelected={draftTop}
            onSave={saveTopThreeFromModal}
            onClose={() => setShowContestants(false)}
          />
        )}
        {!weeklyEditing && existing ? (
          <>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm text-cream/55">Your picks for this week:</p>
              <button
                onClick={enterWeeklyEdit}
                className="text-xs font-semibold text-cream/55 hover:text-pink transition flex items-center gap-1"
              >
                <span aria-hidden>✎</span> Edit
              </button>
            </div>
            <ol className="flex flex-col gap-1 mb-2">
              {existing.topThree.map((c, i) => (
                <li key={i} className="text-sm text-cream/78">
                  {i + 1}. {c}
                </li>
              ))}
            </ol>
            {existing.songPrediction && (
              <p className="text-xs text-cream/50">Song: {existing.songPrediction}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-cream/55 mb-4">Rank your top three for this week, in order.</p>
            {weeklyError && <p className="text-sm text-pink font-medium mb-3">{weeklyError}</p>}
            <div className="flex flex-col gap-2.5 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-display text-pink flex-none">{i + 1}.</span>
                  <select
                    value={draftTop[i]}
                    onChange={(e) =>
                      setDraftTop((prev) => {
                        const next = [...prev] as [string, string, string];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    className="flex-1 px-3 py-2.5 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition"
                  >
                    <option value="">Choose a couple</option>
                    {active.map((c) => (
                      <option key={c} value={c} disabled={draftTop.includes(c) && draftTop[i] !== c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-2">
              SONG PREDICTION (OPTIONAL)
            </label>
            <input
              value={draftSong}
              onChange={(e) => setDraftSong(e.target.value)}
              placeholder="A song you think gets used this week"
              className="w-full px-4 py-3 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition mb-4"
            />
            <button
              onClick={saveWeekly}
              disabled={!canSave || weekliesBusy}
              className="px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
            >
              {weekliesBusy ? "Saving…" : existing ? "Save" : "Save picks"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SubmissionsTab({
  members,
  weeks,
  myMembershipId,
}: {
  members: Member[];
  weeks: number;
  myMembershipId: string | null;
}) {
  const [week, setWeek] = useState(1);
  const me = members.find((m) => m.id === myMembershipId);
  const myPick = me?.weeklyPicks.find((p) => p.week === week);
  const unlocked = !!myPick;
  const seasonPredictionsUnlocked = !!me?.winnerPick && me.finalFourPicks.length === 4;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <p className="font-script text-3xl text-pink leading-none mb-0.5">the tea</p>
          <h1 className="font-display text-3xl tracking-wide">SUBMISSIONS</h1>
        </div>
      </div>

      <div className="bg-card border border-cream/10 rounded-2xl p-4 mb-5">
        <h3 className="font-display text-base tracking-wide mb-1.5">SEASON PREDICTIONS</h3>
        {!seasonPredictionsUnlocked ? (
          <p className="text-sm text-cream/55">
            Lock in your season winner and final four picks on the Details tab to see everyone else&apos;s.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {members.map((m) => {
              const isMe = m.id === myMembershipId;
              return (
                <div
                  key={m.id}
                  className={`px-3.5 py-2 rounded-xl border ${isMe ? "border-pink bg-pink/10" : "border-cream/10 bg-ink/40"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{m.user.name}</span>
                    {isMe && <span className="text-[9px] font-bold tracking-widest text-pink">YOU</span>}
                  </div>
                  {m.winnerPick && m.finalFourPicks.length === 4 ? (
                    <p className="text-xs text-cream/68 leading-snug">
                      Winner: {celebrityName(m.winnerPick)}
                      <br />
                      Top 4: {m.finalFourPicks.map(celebrityName).join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-cream/40">Not submitted yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <p className="font-script text-3xl text-pink leading-none mb-0.5">weekly</p>
          <h2 className="font-display text-2xl tracking-wide">WEEK BY WEEK</h2>
        </div>
        <select
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="px-3.5 py-2.5 rounded-xl bg-card border border-cream/15 text-cream text-sm outline-none focus:border-pink transition"
        >
          {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>

      {!unlocked ? (
        <div className="bg-card border border-cream/10 rounded-3xl p-8 text-center">
          <p className="font-script text-3xl text-pink leading-none">not yet</p>
          <h3 className="font-display text-xl tracking-wide mt-2 mb-1.5">SUBMIT YOUR PICKS FIRST</h3>
          <p className="text-sm text-cream/55">
            Submit your Week {week} picks on the Details tab to see everyone else&apos;s.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((m) => {
            const pick = m.weeklyPicks.find((p) => p.week === week);
            const isMe = m.id === myMembershipId;
            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border ${isMe ? "border-pink bg-pink/10" : "border-cream/10 bg-card"}`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="font-display text-lg tracking-wide">{m.user.name}</span>
                  {isMe && <span className="text-[10px] font-bold tracking-widest text-pink">YOU</span>}
                </div>
                {pick ? (
                  <>
                    <ol className="flex flex-col gap-1 mb-2">
                      {pick.topThree.map((c, i) => (
                        <li key={i} className="text-sm text-cream/78">
                          {i + 1}. {c}
                        </li>
                      ))}
                    </ol>
                    {pick.songPrediction && (
                      <p className="text-xs text-cream/50">Song: {pick.songPrediction}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-cream/40">Not submitted yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommissionerSongPredictions({ members }: { members: Member[] }) {
  const rows = members
    .flatMap((m) =>
      m.weeklyPicks
        .filter((p) => p.songPrediction)
        .map((p) => ({ week: p.week, member: m.user.name, song: p.songPrediction as string }))
    )
    .sort((a, b) => a.week - b.week);

  return (
    <div className="bg-card border border-cream/10 rounded-3xl p-6">
      <h3 className="font-display text-xl tracking-wide mb-1.5">SONG PREDICTIONS</h3>
      <p className="text-sm text-cream/55 mb-4">
        You&apos;re the one who checks these — score them yourself each week.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-cream/45">No song predictions submitted yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-ink/50">
              <span className="text-sm text-cream/78">
                Week {r.week} · {r.member}
              </span>
              <span className="text-sm font-medium">{r.song}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComingSoon({ title, text, badge }: { title: string; text: string; badge?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {badge && (
        <div className="flex items-center gap-2.5 px-[18px] py-3 rounded-2xl bg-purple/15 border border-purple/45">
          <span className="px-2.5 py-1 rounded-full bg-purple text-cream text-[10.5px] font-extrabold tracking-widest">{badge}</span>
          <span className="text-sm text-lilac font-medium">Only commissioners see this tab.</span>
        </div>
      )}
      <div className="bg-card border border-cream/10 rounded-3xl p-8 text-center">
        <h3 className="font-display text-xl tracking-wide mb-1.5">{title}</h3>
        <p className="text-sm text-cream/55">{text}</p>
      </div>
    </div>
  );
}
