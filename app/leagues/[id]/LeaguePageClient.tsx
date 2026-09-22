"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DRAFT_MODE_LABELS,
  formatDueDate,
  formatNextDueDate,
  formatOpenDate,
  isSeasonPredictionsLocked,
  isSurvivorTopFourLocked,
  isWeekOpen,
  weekOpenInstant,
  isWeekDuePassed,
  weekDueInstant,
  DUE_DAYS,
  DUE_DAY_LABELS,
  TIMEZONES,
  TIMEZONE_ABBR,
  DEFAULT_TIMEZONE,
} from "@/lib/leagues";
import { ContestantsModal } from "./ContestantsModal";
import { CategoryPicksModal, findCategoryCast, type CategoryDraft } from "./CategoryPicksModal";
import { breakdownDwtsMember, actualTopThree } from "@/lib/dwts-scoring";
import { breakdownSurvivorMember } from "@/lib/survivor-scoring";
import { ScoreBreakdownModal } from "./ScoreBreakdownModal";
import { AdjustScoreModal, type AdjustMode } from "./AdjustScoreModal";

type Rule = { id: string; label: string; points: number; isCustom: boolean; awards: { memberId: string }[] };
type WeeklyPick = {
  id: string;
  week: number;
  topThree: string[];
  songPrediction: string | null;
  songCorrect: boolean;
};
type CategoryPick = {
  id: string;
  week: number;
  starBakerPick: string | null;
  technicalPick: string | null;
  votedOffPick: string | null;
};
type Adjustment = { id: string; mode: string; amount: number; points: number; note: string };
type Member = {
  id: string;
  userId: string;
  role: string;
  notifyPicksDue: boolean;
  winnerPick: string | null;
  finalFourPicks: string[];
  weeklyPicks: WeeklyPick[];
  categoryPicks: CategoryPick[];
  adjustments: Adjustment[];
  user: { name: string };
};
type Pick = { id: string; contestant: string; memberId: string };
type Template = {
  id: string;
  name: string;
  tag: string | null;
  contestants: string[];
  eliminatedContestants: string[];
  draftOpenDay: string | null;
  draftOpenTime: string | null;
  pickFormat: string;
  weekThemes: unknown;
  actualWinner: string | null;
  actualFinalFour: string[];
  weeklyScores: { week: number; contestant: string; score: number }[];
  ruleAwards: { week: number; contestant: string; rule: { label: string; points: number } }[];
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
  timezone: string;
  startDate: string | Date | null;
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

type LeagueTab = "details" | "submissions" | "rankings" | "scoring";

const TAB_PATHS: Record<LeagueTab, string> = {
  details: "",
  submissions: "/submissions",
  rankings: "/rankings",
  scoring: "/scoring",
};

export function LeaguePageClient({
  league,
  isOwner,
  currentUserId,
  isAdminPreview,
  initialTab,
}: {
  league: League;
  isOwner: boolean;
  currentUserId: string;
  isAdminPreview: boolean;
  initialTab: LeagueTab;
}) {
  const router = useRouter();
  const [tab, setTabState] = useState<LeagueTab>(initialTab);

  function setTab(next: LeagueTab) {
    setTabState(next);
    router.replace(`/leagues/${league.id}${TAB_PATHS[next]}`, { scroll: false });
  }
  const [rulesOpen, setRulesOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [deleting, setDeleting] = useState(false);

  const myMembership = league.members.find((m) => m.userId === currentUserId);
  const [notifyOn, setNotifyOn] = useState(myMembership?.notifyPicksDue ?? false);
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

  const [categoryPicks, setCategoryPicks] = useState(myMembership?.categoryPicks ?? []);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  async function submitCategoryPick(week: number, draft: CategoryDraft) {
    setCategoryBusy(true);
    setCategoryError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}/category-pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week,
          starBakerPick: draft.starBaker || undefined,
          technicalPick: draft.technical || undefined,
          votedOffPick: draft.votedOff || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save that pick");
      setCategoryPicks((prev) => [...prev.filter((p) => p.week !== week), data]);
      return true;
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Couldn't save that pick");
      return false;
    } finally {
      setCategoryBusy(false);
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

  const [dueDay, setDueDayValue] = useState(league.dueDay);
  const [dueTime, setDueTimeValue] = useState(league.dueTime);
  const [timezone, setTimezoneValue] = useState(league.timezone);
  const [dueDateEditing, setDueDateEditing] = useState(false);
  const [dueDateDraft, setDueDateDraft] = useState({ dueDay, dueTime, timezone });
  const [dueDateSaving, setDueDateSaving] = useState(false);
  const [dueDateError, setDueDateError] = useState("");

  function enterDueDateEdit() {
    setDueDateDraft({ dueDay, dueTime, timezone });
    setDueDateError("");
    setDueDateEditing(true);
  }

  async function saveDueDate() {
    setDueDateSaving(true);
    setDueDateError("");
    try {
      const res = await fetch(`/api/leagues/${league.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dueDateDraft),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save that");
      setDueDayValue(data.dueDay);
      setDueTimeValue(data.dueTime);
      setTimezoneValue(data.timezone);
      setDueDateEditing(false);
    } catch (err) {
      setDueDateError(err instanceof Error ? err.message : "Couldn't save that");
    } finally {
      setDueDateSaving(false);
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

          <div className="p-5 rounded-2xl bg-pink/10 border border-pink/35 mb-3">
            {dueDateEditing ? (
              <>
                <div className="text-[10.5px] tracking-widest text-pink font-bold mb-3">EDIT PICKS DUE</div>
                {dueDateError && <p className="text-sm text-pink font-medium mb-2">{dueDateError}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {DUE_DAYS.map((d) => {
                    const selected = dueDateDraft.dueDay === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDueDateDraft((prev) => ({ ...prev, dueDay: d }))}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                          selected ? "border-pink bg-pink/15 text-pink" : "border-cream/15 bg-ink/40 text-cream/80 hover:border-pink"
                        }`}
                      >
                        {DUE_DAY_LABELS[d]}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap mb-4">
                  <input
                    type="time"
                    value={dueDateDraft.dueTime}
                    onChange={(e) => setDueDateDraft((prev) => ({ ...prev, dueTime: e.target.value }))}
                    className="px-3 py-2.5 rounded-lg bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition"
                  />
                  <select
                    value={dueDateDraft.timezone}
                    onChange={(e) => setDueDateDraft((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="px-3 py-2.5 rounded-lg bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.label} ({tz.abbr})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveDueDate}
                    disabled={dueDateSaving}
                    className="px-5 py-2.5 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
                  >
                    {dueDateSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setDueDateEditing(false)}
                    disabled={dueDateSaving}
                    className="text-sm font-semibold text-cream/50 hover:text-cream transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-[10.5px] tracking-widest text-pink font-bold">PICKS DUE</div>
                <div className="flex items-center gap-3">
                  <div className="font-display text-xl tracking-wide">
                    {formatNextDueDate(
                      dueDay,
                      dueTime,
                      timezone,
                      new Date(),
                      league.startDate ? new Date(league.startDate) : null
                    )}{" "}
                    {TIMEZONE_ABBR[timezone] ?? ""}
                  </div>
                  {isOwner && (
                    <button
                      onClick={enterDueDateEdit}
                      className="text-sm font-semibold text-pink hover:text-pink/75 transition flex items-center gap-1"
                    >
                      <span aria-hidden>✎</span> Edit
                    </button>
                  )}
                </div>
              </div>
            )}
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
                dueDay={league.dueDay}
                dueTime={league.dueTime}
                timezone={league.timezone}
                startDate={league.startDate}
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
            ) : league.template?.pickFormat === "WEEKLY_CATEGORIES" ? (
              <CategoryPicksForm
                template={league.template}
                weeks={league.weeks ?? 10}
                startDate={league.startDate}
                categoryPicks={categoryPicks}
                categoryBusy={categoryBusy}
                categoryError={categoryError}
                onSubmitCategory={submitCategoryPick}
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
          </div>
        </div>
      )}

      {tab === "submissions" && (
        <SubmissionsTab
          leagueId={league.id}
          members={league.members}
          weeks={league.weeks ?? 11}
          myMembershipId={myMembership?.id ?? null}
          isOwner={isOwner}
          isAdminPreview={isAdminPreview}
          pickFormat={league.template?.pickFormat ?? null}
          tag={league.template?.tag ?? null}
          weeklyScores={league.template?.weeklyScores ?? []}
        />
      )}

      {tab === "rankings" &&
        (league.template?.pickFormat === "WEEKLY_TOP3" ? (
          league.template.tag === "SRVR" ? (
            <SurvivorLeaderboard league={league} currentUserId={currentUserId} isOwner={isOwner} />
          ) : (
            <DwtsLeaderboard league={league} currentUserId={currentUserId} isOwner={isOwner} />
          )
        ) : hasCustomRules ? (
          <CustomRuleLeaderboard league={league} currentUserId={currentUserId} />
        ) : (
          <ComingSoon title="LEAGUE TABLE" text="Standings show up here once scoring starts." />
        ))}
      {tab === "scoring" &&
        (isOwner && hasCustomRules ? (
          <CustomRuleScoring leagueId={league.id} rules={league.rules} members={league.members} />
        ) : (
          <ComingSoon title="ENTER RESULTS" text="Score entry for commissioners is coming soon." badge="ADMIN" />
        ))}
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
  dueDay,
  dueTime,
  timezone,
  startDate,
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
  dueDay: string;
  dueTime: string;
  timezone: string;
  startDate: string | Date | null;
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
  // Default to the week after the last one that's been scored — once a
  // week is done, there's no reason to land on it instead of the current
  // one, and this keeps advancing on its own as each week gets scored.
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const scoredWeeks = template?.weeklyScores.map((s) => s.week) ?? [];
    const nextWeek = (scoredWeeks.length ? Math.max(...scoredWeeks) : 0) + 1;
    return Math.min(Math.max(nextWeek, 1), weeks || 1);
  });
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
  // Survivor leagues have no separate "season winner" pick — just the
  // pre-season top four — and no song prediction rule, so both stay
  // hidden for them.
  const isSurvivor = template.tag === "SRVR";
  const active = template.contestants.filter((c) => !template.eliminatedContestants.includes(c));
  const existing = weeklyPicks.find((p) => p.week === selectedWeek);
  const weekThemes = (template.weekThemes as Record<string, string> | null) ?? {};
  const weekTheme = (w: number) => weekThemes[String(w)] ?? "";
  const startDateObj = startDate ? new Date(startDate) : null;
  const weekOpen = isWeekOpen(selectedWeek, template.id, dueDay, dueTime, timezone, startDateObj);
  const weekOpensAt = weekOpen ? null : weekOpenInstant(selectedWeek, template.id, dueDay, dueTime, timezone, startDateObj);
  const weekDuePassed = isWeekDuePassed(selectedWeek, dueDay, dueTime, timezone, startDateObj);
  const weekDueAt = weekDuePassed ? weekDueInstant(selectedWeek, dueDay, dueTime, timezone, startDateObj) : null;
  const canSave = weekOpen && !weekDuePassed && draftTop.every((c) => c) && new Set(draftTop).size === 3;

  const topFourLocked = isSurvivor ? isSurvivorTopFourLocked() : isSeasonPredictionsLocked();

  return (
    <div className="flex flex-col gap-3">
      {!isSurvivor && !isSeasonPredictionsLocked() && (
        <div className="bg-card border border-cream/10 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h3 className="font-display text-xl tracking-wide">SEASON WINNER</h3>
            {!winnerEditing && (
              <button
                onClick={enterWinnerEdit}
                className="text-sm font-semibold text-pink hover:text-pink/75 transition flex items-center gap-1"
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
      )}

      {!topFourLocked && (
        <div className="bg-card border border-cream/10 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h3 className="font-display text-xl tracking-wide">
              {isSurvivor ? "YOUR TOP FOUR" : "FINAL FOUR PREDICTIONS"}
            </h3>
            {!fourEditing && (
              <button
                onClick={enterFourEdit}
                className="text-sm font-semibold text-pink hover:text-pink/75 transition flex items-center gap-1"
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
                {isSurvivor
                  ? "+5 points for every one you get right. You can change these until Sept 30 at 5:00 PM PT — after that they lock for good."
                  : "+5 points for every one you get right. You can change these until Sept 15 at 5:00 PM PT — after that they lock for good."}
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
      )}

      <div className="bg-card border border-cream/10 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display text-xl tracking-wide">
              WEEKLY PICKS{weekTheme(selectedWeek) && ` — ${weekTheme(selectedWeek).toUpperCase()}`}
            </h3>
            <select
              value={selectedWeek}
              onChange={(e) => changeWeek(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-ink/60 border border-cream/15 text-cream text-sm outline-none"
            >
              {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                  {weekTheme(w) ? ` — ${weekTheme(w)}` : ""}
                </option>
              ))}
            </select>
          </div>
          {!isSurvivor && weeklyEditing && weekOpen && !weekDuePassed ? (
            <button
              onClick={() => setShowContestants(true)}
              className="px-3 py-2 rounded-lg border border-cream/15 text-cream/80 text-sm font-semibold hover:border-pink hover:text-pink transition"
            >
              See Contestants
            </button>
          ) : (
            existing &&
            !weekDuePassed && (
              <button
                onClick={enterWeeklyEdit}
                className="text-sm font-semibold text-pink hover:text-pink/75 transition flex items-center gap-1"
              >
                <span aria-hidden>✎</span> Edit
              </button>
            )
          )}
        </div>
        {/* ContestantsModal is hardcoded to DWTS's cast photos (DWTS_CAST)
            — it doesn't generically render whatever `contestants` list is
            passed in, so it can't be reused for Survivor's real cast. */}
        {!isSurvivor && showContestants && (
          <ContestantsModal
            contestants={template.contestants}
            eliminatedContestants={template.eliminatedContestants}
            initialSelected={draftTop}
            onSave={saveTopThreeFromModal}
            onClose={() => setShowContestants(false)}
          />
        )}
        {isSurvivor && selectedWeek === 1 ? (
          <>
            <p className="text-sm text-cream/50 mt-3">Week 1 will not be scored. Be sure to make your picks for week 2!</p>
            <p className="text-sm text-cream/50 mt-1.5">Additional selections and points will come at the time of the merge.</p>
          </>
        ) : !weeklyEditing && existing ? (
          <>
            <p className="text-sm text-cream/55 mb-3 mt-3">Your picks for this week:</p>
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
        ) : !weekOpen ? (
          <p className="text-sm text-cream/50 mt-3">
            Picks for week {selectedWeek} aren&apos;t open yet.
            {weekOpensAt && <> They open {formatOpenDate(weekOpensAt, timezone)} {TIMEZONE_ABBR[timezone] ?? ""}.</>}
          </p>
        ) : weekDuePassed ? (
          <p className="text-sm text-cream/50 mt-3">
            Picks for week {selectedWeek} are closed.
            {weekDueAt && <> They were due {formatOpenDate(weekDueAt, timezone)} {TIMEZONE_ABBR[timezone] ?? ""}.</>}
          </p>
        ) : (
          <>
            <p className="text-sm text-cream/55 mb-4">
              {isSurvivor ? "Pick three castaways to root for this week." : "Rank your top three for this week, in order."}
            </p>
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
                    <option value="">{isSurvivor ? "Choose a contestant" : "Choose a couple"}</option>
                    {active.map((c) => (
                      <option key={c} value={c} disabled={draftTop.includes(c) && draftTop[i] !== c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {!isSurvivor && (
              <>
                <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-2">
                  SONG PREDICTION (OPTIONAL)
                </label>
                <input
                  value={draftSong}
                  onChange={(e) => setDraftSong(e.target.value)}
                  placeholder="A song you think gets used this week"
                  className="w-full px-4 py-3 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition mb-4"
                />
              </>
            )}
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

function CategoryPicksForm({
  template,
  weeks,
  startDate,
  categoryPicks,
  categoryBusy,
  categoryError,
  onSubmitCategory,
}: {
  template: Template;
  weeks: number;
  startDate: string | Date | null;
  categoryPicks: CategoryPick[];
  categoryBusy: boolean;
  categoryError: string;
  onSubmitCategory: (week: number, draft: CategoryDraft) => Promise<boolean>;
}) {
  const [selectedWeek, setSelectedWeek] = useState(weeks >= 2 ? 2 : 1);
  const [showContestants, setShowContestants] = useState(false);

  const startingPick = categoryPicks.find((p) => p.week === 1);
  const [draft, setDraft] = useState<CategoryDraft>({
    starBaker: startingPick?.starBakerPick ?? "",
    technical: startingPick?.technicalPick ?? "",
    votedOff: startingPick?.votedOffPick ?? "",
  });
  const [editing, setEditing] = useState(!startingPick);

  function changeWeek(w: number) {
    setSelectedWeek(w);
    const p = categoryPicks.find((x) => x.week === w);
    setDraft({
      starBaker: p?.starBakerPick ?? "",
      technical: p?.technicalPick ?? "",
      votedOff: p?.votedOffPick ?? "",
    });
    setEditing(!p);
  }

  function enterEdit() {
    setDraft({
      starBaker: existing?.starBakerPick ?? "",
      technical: existing?.technicalPick ?? "",
      votedOff: existing?.votedOffPick ?? "",
    });
    setEditing(true);
  }

  async function save() {
    const ok = await onSubmitCategory(selectedWeek, draft);
    if (ok) setEditing(false);
  }

  function saveFromModal(picked: CategoryDraft) {
    setDraft(picked);
    setShowContestants(false);
  }

  if (!template) return null;
  const active = template.contestants.filter((c) => !template.eliminatedContestants.includes(c));
  const existing = categoryPicks.find((p) => p.week === selectedWeek);
  const canSave = !!draft.starBaker || !!draft.technical || !!draft.votedOff;
  const categoryCast = findCategoryCast(template.contestants);
  const weekThemes = (template.weekThemes as Record<string, string> | null) ?? {};
  const weekTheme = (w: number) => weekThemes[String(w)] ?? "";

  const SELECTS: { key: keyof CategoryDraft; label: string }[] = [
    { key: "starBaker", label: "Star Baker" },
    { key: "technical", label: "Wins the technical" },
    { key: "votedOff", label: "Voted off" },
  ];

  return (
    <div className="bg-card border border-cream/10 rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="font-display text-xl tracking-wide">
            WEEKLY PICKS{weekTheme(selectedWeek) && ` — ${weekTheme(selectedWeek).toUpperCase()}`}
          </h3>
          <select
            value={selectedWeek}
            onChange={(e) => changeWeek(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-ink/60 border border-cream/15 text-cream text-sm outline-none"
          >
            {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
                {weekTheme(w) ? ` — ${weekTheme(w)}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {template.draftOpenDay && template.draftOpenTime && (
            <span className="text-[11px] text-cream/40 font-semibold">
              Picks open{" "}
              {formatNextDueDate(
                template.draftOpenDay,
                template.draftOpenTime,
                DEFAULT_TIMEZONE,
                new Date(),
                startDate ? new Date(startDate) : null
              )}{" "}
              PT
            </span>
          )}
          {selectedWeek === 1 ? null : editing ? (
            categoryCast && (
              <button
                onClick={() => setShowContestants(true)}
                className="px-3 py-2 rounded-lg border border-cream/15 text-cream/80 text-sm font-semibold hover:border-pink hover:text-pink transition"
              >
                See Contestants
              </button>
            )
          ) : (
            existing && (
              <button
                onClick={enterEdit}
                className="text-sm font-semibold text-pink hover:text-pink/75 transition flex items-center gap-1"
              >
                <span aria-hidden>✎</span> Edit
              </button>
            )
          )}
        </div>
      </div>
      {categoryCast && showContestants && (
        <CategoryPicksModal
          cast={categoryCast.cast}
          matches={categoryCast.matches}
          eliminatedContestants={template.eliminatedContestants}
          initial={draft}
          onSave={saveFromModal}
          onClose={() => setShowContestants(false)}
        />
      )}
      {selectedWeek === 1 ? (
        <p className="text-sm text-cream/50 mt-3">Drafting will begin week 2, once we have met the contestants.</p>
      ) : !editing && existing ? (
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-sm text-cream/78">
            Star Baker: <span className="font-semibold text-pink">{existing.starBakerPick || "—"}</span>
          </p>
          <p className="text-sm text-cream/78">
            Wins the technical: <span className="font-semibold text-purple">{existing.technicalPick || "—"}</span>
          </p>
          <p className="text-sm text-cream/78">
            Voted off: <span className="font-semibold text-lilac">{existing.votedOffPick || "—"}</span>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-cream/55 mb-4 mt-3">Pick your prediction for each category.</p>
          {categoryError && <p className="text-sm text-pink font-medium mb-3">{categoryError}</p>}
          <div className="flex flex-col gap-2.5 mb-4">
            {SELECTS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-36 text-sm text-cream/60 flex-none">{label}</span>
                <select
                  value={draft[key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition"
                >
                  <option value="">Choose a baker</option>
                  {active.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={!canSave || categoryBusy}
            className="px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
          >
            {categoryBusy ? "Saving…" : existing ? "Save" : "Save picks"}
          </button>
        </>
      )}
    </div>
  );
}

function SubmissionsTab({
  leagueId,
  members,
  weeks,
  myMembershipId,
  isOwner,
  isAdminPreview,
  pickFormat,
  tag,
  weeklyScores,
}: {
  leagueId: string;
  members: Member[];
  weeks: number;
  myMembershipId: string | null;
  isOwner: boolean;
  isAdminPreview: boolean;
  pickFormat: string | null;
  tag: string | null;
  weeklyScores: { week: number }[];
}) {
  const isSurvivor = tag === "SRVR";
  const router = useRouter();
  // Same "next unscored week" default as the pick form — once a week's
  // scored, there's no reason to land on it instead of the current one.
  const [week, setWeek] = useState(() => {
    const scoredWeeks = weeklyScores.map((s) => s.week);
    const nextWeek = (scoredWeeks.length ? Math.max(...scoredWeeks) : 0) + 1;
    return Math.min(Math.max(nextWeek, 1), weeks || 1);
  });
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [songSaving, setSongSaving] = useState(false);
  const me = members.find((m) => m.id === myMembershipId);
  const myPick = me?.weeklyPicks.find((p) => p.week === week);
  // Normally you have to submit your own picks to see everyone else's —
  // an admin previewing a league they're not a member of has nothing to
  // submit, so that gate would otherwise make the preview useless.
  const unlocked = !!myPick || isAdminPreview;
  // Survivor has no season-winner pick — just the top four — so its
  // "submitted" check can't require winnerPick the way DWTS's does.
  function hasSeasonPrediction(m: Member) {
    return isSurvivor ? m.finalFourPicks.length === 4 : !!m.winnerPick && m.finalFourPicks.length === 4;
  }
  const seasonPredictionsUnlocked = (!!me && hasSeasonPrediction(me)) || isAdminPreview;
  const seasonSubmittedCount = members.filter(hasSeasonPrediction).length;

  // Song correctness is drafted locally and only sent once "Save" is
  // pressed — clicking a chip shouldn't fire a request per click. Re-seeds
  // whenever the selected week changes.
  const [songDraft, setSongDraft] = useState<Record<string, boolean>>({});
  const [songSyncedKey, setSongSyncedKey] = useState("");
  const songKey = `${leagueId}-${week}`;
  if (songKey !== songSyncedKey) {
    setSongSyncedKey(songKey);
    const seed: Record<string, boolean> = {};
    for (const m of members) {
      const p = m.weeklyPicks.find((p) => p.week === week);
      if (p?.songPrediction) seed[m.id] = p.songCorrect;
    }
    setSongDraft(seed);
  }

  function toggleDraftSong(memberId: string) {
    setSongDraft((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  }

  const songPendingChanges = members
    .map((m) => {
      const p = m.weeklyPicks.find((p) => p.week === week);
      if (!p?.songPrediction) return null;
      const draftVal = songDraft[m.id] ?? p.songCorrect;
      return draftVal !== p.songCorrect ? { memberId: m.id, correct: draftVal } : null;
    })
    .filter((x): x is { memberId: string; correct: boolean } => !!x);

  async function saveSongPredictions() {
    setSongSaving(true);
    try {
      await Promise.all(
        songPendingChanges.map((c) =>
          fetch(`/api/leagues/${leagueId}/song-correct`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId: c.memberId, week, correct: c.correct }),
          })
        )
      );
      router.refresh();
    } finally {
      setSongSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <p className="font-script text-3xl text-pink leading-none mb-0.5">the tea</p>
          <h1 className="font-display text-3xl tracking-wide">SUBMISSIONS</h1>
        </div>
      </div>

      <div className="mb-5">
        <Panel
          title="SEASON PREDICTIONS"
          count={`${seasonSubmittedCount}/${members.length} submitted`}
          open={seasonOpen}
          onToggle={() => setSeasonOpen((v) => !v)}
        >
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
                    {hasSeasonPrediction(m) ? (
                      <p className="text-xs text-cream/68 leading-snug">
                        {!isSurvivor && (
                          <>
                            Winner: {celebrityName(m.winnerPick!)}
                            <br />
                          </>
                        )}
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
        </Panel>
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
        <>
          {pickFormat === "WEEKLY_TOP3" && !isSurvivor && (() => {
            const withSongs = members.filter((m) => m.weeklyPicks.find((p) => p.week === week)?.songPrediction);
            return (
              <div className="bg-card border border-cream/10 rounded-3xl p-6 mb-5">
                <h3 className="font-display text-lg tracking-wide mb-1">SONG PREDICTIONS</h3>
                <p className="text-sm text-cream/55 mb-4">
                  As commissioner, you are responsible for scoring this part! Select all song predictions that were
                  correct for this week and they will be scored.
                </p>
                {withSongs.length === 0 ? (
                  <p className="text-sm text-cream/40">No song predictions submitted for this week.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {withSongs.map((m) => {
                        const pick = m.weeklyPicks.find((p) => p.week === week)!;
                        const draftCorrect = songDraft[m.id] ?? pick.songCorrect;
                        const chip = (
                          <span
                            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                              draftCorrect
                                ? "border-pink bg-pink/15 text-pink"
                                : "border-cream/15 bg-ink/40 text-cream/80"
                            } ${isOwner ? "hover:border-pink cursor-pointer" : ""}`}
                          >
                            {draftCorrect ? "✓ " : ""}
                            {m.user.name}: {pick.songPrediction}
                          </span>
                        );
                        return isOwner ? (
                          <button key={m.id} onClick={() => toggleDraftSong(m.id)}>
                            {chip}
                          </button>
                        ) : (
                          <span key={m.id}>{chip}</span>
                        );
                      })}
                    </div>
                    {isOwner && songPendingChanges.length > 0 && (
                      <button
                        onClick={saveSongPredictions}
                        disabled={songSaving}
                        className="mt-4 px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
                      >
                        {songSaving ? "Saving…" : `Save (${songPendingChanges.length})`}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          <div className="flex flex-col gap-2.5">
            <h3 className="font-display text-base tracking-wide text-cream/60">TOP THREE</h3>
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
                    <ol className="flex flex-col gap-1">
                      {pick.topThree.map((c, i) => (
                        <li key={i} className="text-sm text-cream/78">
                          {i + 1}. {c}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-cream/40">Not submitted yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DwtsLeaderboard({
  league,
  currentUserId,
  isOwner,
}: {
  league: League;
  currentUserId: string;
  isOwner: boolean;
}) {
  const template = league.template;
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<{ memberId: string; mode: AdjustMode } | null>(null);
  if (!template) return null;

  const hasAnyResults =
    template.weeklyScores.length > 0 ||
    template.ruleAwards.length > 0 ||
    !!template.actualWinner ||
    template.actualFinalFour.length > 0;

  const ruleAwards = template.ruleAwards.map((a) => ({ week: a.week, contestant: a.contestant, ruleLabel: a.rule.label }));

  const standings = league.members
    .map((m) => {
      const groups = breakdownDwtsMember({
        winnerPick: m.winnerPick,
        finalFourPicks: m.finalFourPicks,
        weeklyPicks: m.weeklyPicks,
        weeklyScores: template.weeklyScores,
        ruleAwards,
        actualWinner: template.actualWinner,
        actualFinalFour: template.actualFinalFour,
        eliminatedContestants: template.eliminatedContestants,
        rules: league.rules,
        adjustments: m.adjustments.map((a) => ({ points: a.points, note: a.note })),
      });
      return { member: m, groups, points: groups.reduce((sum, g) => sum + g.total, 0) };
    })
    .sort((a, b) => b.points - a.points);

  if (!hasAnyResults) {
    return <ComingSoon title="LEAGUE TABLE" text="Standings show up here once scoring starts." />;
  }

  const selected = standings.find((s) => s.member.id === selectedMemberId);
  const adjusting = standings.find((s) => s.member.id === adjustTarget?.memberId);

  const scoredWeeks = Array.from(new Set(template.weeklyScores.map((s) => s.week))).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-cream/10 rounded-3xl p-6">
        <h3 className="font-display text-lg tracking-wide mb-3">RESULTS SO FAR</h3>
        <div className="flex flex-col gap-2">
          {scoredWeeks.map((w) => {
            const top3 = Array.from(actualTopThree(template.weeklyScores.filter((s) => s.week === w)));
            return (
              <p key={w} className="text-sm text-cream/70">
                <span className="text-cream/45">Week {w} top three:</span>{" "}
                {top3.length ? top3.join(", ") : "no scores over 0 yet"}
              </p>
            );
          })}
          {template.actualWinner && (
            <p className="text-sm text-cream/70">
              <span className="text-cream/45">Season winner:</span> {template.actualWinner}
            </p>
          )}
          {template.actualFinalFour.length > 0 && (
            <p className="text-sm text-cream/70">
              <span className="text-cream/45">Final four:</span> {template.actualFinalFour.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="bg-card border border-cream/10 rounded-3xl p-2">
        {standings.map((row, i) => {
          const isMe = row.member.userId === currentUserId;
          return (
            <div
              key={row.member.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 last:mb-0 ${
                isMe ? "border border-pink" : ""
              }`}
              style={{ background: isMe ? "rgba(232,91,174,.12)" : i === 0 ? "rgba(232,91,174,.08)" : "transparent" }}
            >
              <span className="font-display text-sm text-cream/42 w-5">{i + 1}</span>
              <span
                className="w-7 h-7 rounded-full flex-none"
                style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              />
              <span className="flex-1 text-[14.5px] font-medium truncate flex items-center gap-2">
                {row.member.user.name}
                {isMe && <span className="text-[9px] font-bold tracking-widest text-pink">YOU</span>}
              </span>
              <button
                onClick={() => setSelectedMemberId(row.member.id)}
                className="font-display text-lg text-pink hover:text-cream transition"
                title="See how this score breaks down"
              >
                {row.points}
              </button>
              {isOwner && (
                <div className="flex items-center gap-1 flex-none">
                  <button
                    onClick={() => setAdjustTarget({ memberId: row.member.id, mode: "ADD" })}
                    title="Add points"
                    aria-label={`Add points to ${row.member.user.name}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border border-cream/15 text-cream/60 hover:border-pink hover:text-pink transition"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setAdjustTarget({ memberId: row.member.id, mode: "SUBTRACT" })}
                    title="Subtract points"
                    aria-label={`Subtract points from ${row.member.user.name}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border border-cream/15 text-cream/60 hover:border-pink hover:text-pink transition"
                  >
                    −
                  </button>
                  <button
                    onClick={() => setAdjustTarget({ memberId: row.member.id, mode: "SET" })}
                    title="Set total score"
                    aria-label={`Set ${row.member.user.name}'s total score`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border border-cream/15 text-cream/60 hover:border-pink hover:text-pink transition"
                  >
                    =
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <ScoreBreakdownModal
          memberName={selected.member.user.name}
          totalPoints={selected.points}
          groups={selected.groups}
          onClose={() => setSelectedMemberId(null)}
        />
      )}

      {adjustTarget && adjusting && (
        <AdjustScoreModal
          leagueId={league.id}
          memberId={adjusting.member.id}
          memberName={adjusting.member.user.name}
          mode={adjustTarget.mode}
          currentTotal={adjusting.points}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </div>
  );
}

// Survivor-tagged (SRVR) WEEKLY_TOP3 leagues — same shape as DWTS
// (finalFourPicks + weekly topThree) but scored via breakdownSurvivorMember
// instead, since Survivor's rules are individual events, not a ranked
// top three. Mirrors DwtsLeaderboard's layout and commissioner-adjustment
// actions exactly.
function SurvivorLeaderboard({
  league,
  currentUserId,
  isOwner,
}: {
  league: League;
  currentUserId: string;
  isOwner: boolean;
}) {
  const template = league.template;
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<{ memberId: string; mode: AdjustMode } | null>(null);
  if (!template) return null;

  const hasAnyResults = template.ruleAwards.length > 0 || template.actualFinalFour.length > 0;

  const ruleAwards = template.ruleAwards.map((a) => ({
    week: a.week,
    contestant: a.contestant,
    ruleLabel: a.rule.label,
    points: a.rule.points,
  }));

  const standings = league.members
    .map((m) => {
      const groups = breakdownSurvivorMember({
        finalFourPicks: m.finalFourPicks,
        weeklyPicks: m.weeklyPicks,
        ruleAwards,
        actualFinalFour: template.actualFinalFour,
        adjustments: m.adjustments.map((a) => ({ points: a.points, note: a.note })),
      });
      return { member: m, groups, points: groups.reduce((sum, g) => sum + g.total, 0) };
    })
    .sort((a, b) => b.points - a.points);

  if (!hasAnyResults) {
    return <ComingSoon title="LEAGUE TABLE" text="Standings show up here once scoring starts." />;
  }

  const selected = standings.find((s) => s.member.id === selectedMemberId);
  const adjusting = standings.find((s) => s.member.id === adjustTarget?.memberId);

  return (
    <div className="flex flex-col gap-4">
      {template.actualFinalFour.length > 0 && (
        <div className="bg-card border border-cream/10 rounded-3xl p-6">
          <h3 className="font-display text-lg tracking-wide mb-3">RESULTS SO FAR</h3>
          <p className="text-sm text-cream/70">
            <span className="text-cream/45">Final four:</span> {template.actualFinalFour.join(", ")}
          </p>
        </div>
      )}

      <div className="bg-card border border-cream/10 rounded-3xl p-2">
        {standings.map((row, i) => {
          const isMe = row.member.userId === currentUserId;
          return (
            <div
              key={row.member.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 last:mb-0 ${
                isMe ? "border border-pink" : ""
              }`}
              style={{ background: isMe ? "rgba(232,91,174,.12)" : i === 0 ? "rgba(232,91,174,.08)" : "transparent" }}
            >
              <span className="font-display text-sm text-cream/42 w-5">{i + 1}</span>
              <span
                className="w-7 h-7 rounded-full flex-none"
                style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              />
              <span className="flex-1 text-[14.5px] font-medium truncate flex items-center gap-2">
                {row.member.user.name}
                {isMe && <span className="text-[9px] font-bold tracking-widest text-pink">YOU</span>}
              </span>
              <button
                onClick={() => setSelectedMemberId(row.member.id)}
                className="font-display text-lg text-pink hover:text-cream transition"
                title="See how this score breaks down"
              >
                {row.points}
              </button>
              {isOwner && (
                <div className="flex items-center gap-1 flex-none">
                  <button
                    onClick={() => setAdjustTarget({ memberId: row.member.id, mode: "ADD" })}
                    title="Add points"
                    aria-label={`Add points to ${row.member.user.name}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border border-cream/15 text-cream/60 hover:border-pink hover:text-pink transition"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setAdjustTarget({ memberId: row.member.id, mode: "SUBTRACT" })}
                    title="Subtract points"
                    aria-label={`Subtract points from ${row.member.user.name}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border border-cream/15 text-cream/60 hover:border-pink hover:text-pink transition"
                  >
                    −
                  </button>
                  <button
                    onClick={() => setAdjustTarget({ memberId: row.member.id, mode: "SET" })}
                    title="Set total score"
                    aria-label={`Set ${row.member.user.name}'s total score`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border border-cream/15 text-cream/60 hover:border-pink hover:text-pink transition"
                  >
                    =
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <ScoreBreakdownModal
          memberName={selected.member.user.name}
          totalPoints={selected.points}
          groups={selected.groups}
          onClose={() => setSelectedMemberId(null)}
        />
      )}

      {adjustTarget && adjusting && (
        <AdjustScoreModal
          leagueId={league.id}
          memberId={adjusting.member.id}
          memberName={adjusting.member.user.name}
          mode={adjustTarget.mode}
          currentTotal={adjusting.points}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </div>
  );
}

// Custom leagues (no DWTS-style scoring engine) earn all of their points
// through commissioner-awarded custom rules — a member's total is just
// the sum of whichever custom rules they've been checked off for.
function CustomRuleLeaderboard({ league, currentUserId }: { league: League; currentUserId: string }) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const customRules = league.rules.filter((r) => r.isCustom);

  const standings = league.members
    .map((m) => {
      const lines = customRules
        .filter((r) => r.awards.some((a) => a.memberId === m.id))
        .map((r) => ({ label: r.label, points: r.points }));
      const points = lines.reduce((sum, l) => sum + l.points, 0);
      const groups = lines.length > 0 ? [{ key: "custom-rules", title: "Custom Rules", total: points, lines }] : [];
      return { member: m, groups, points };
    })
    .sort((a, b) => b.points - a.points);

  const hasAnyResults = standings.some((s) => s.groups.length > 0);
  if (!hasAnyResults) {
    return <ComingSoon title="LEAGUE TABLE" text="Standings show up here once scoring starts." />;
  }

  const selected = standings.find((s) => s.member.id === selectedMemberId);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-cream/10 rounded-3xl p-2">
        {standings.map((row, i) => {
          const isMe = row.member.userId === currentUserId;
          return (
            <div
              key={row.member.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 last:mb-0 ${
                isMe ? "border border-pink" : ""
              }`}
              style={{ background: isMe ? "rgba(232,91,174,.12)" : i === 0 ? "rgba(232,91,174,.08)" : "transparent" }}
            >
              <span className="font-display text-sm text-cream/42 w-5">{i + 1}</span>
              <span
                className="w-7 h-7 rounded-full flex-none"
                style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              />
              <span className="flex-1 text-[14.5px] font-medium truncate flex items-center gap-2">
                {row.member.user.name}
                {isMe && <span className="text-[9px] font-bold tracking-widest text-pink">YOU</span>}
              </span>
              <button
                onClick={() => setSelectedMemberId(row.member.id)}
                className="font-display text-lg text-pink hover:text-cream transition"
                title="See how this score breaks down"
              >
                {row.points}
              </button>
            </div>
          );
        })}
      </div>

      {selected && (
        <ScoreBreakdownModal
          memberName={selected.member.user.name}
          totalPoints={selected.points}
          groups={selected.groups}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
}

// One card per custom rule, each with its own checklist of members and
// its own "draft locally, then Save" state — same pattern as song
// prediction scoring, just keyed by rule instead of by week.
function CustomRuleScoring({ leagueId, rules, members }: { leagueId: string; rules: Rule[]; members: Member[] }) {
  const customRules = rules.filter((r) => r.isCustom);
  if (customRules.length === 0) {
    return <ComingSoon title="ENTER RESULTS" text="Add a custom rule from the Details tab, then come back here to score it." />;
  }
  return (
    <div className="flex flex-col gap-4">
      {customRules.map((rule) => (
        <RuleScoringCard key={rule.id} leagueId={leagueId} rule={rule} members={members} />
      ))}
    </div>
  );
}

function RuleScoringCard({ leagueId, rule, members }: { leagueId: string; rule: Rule; members: Member[] }) {
  const router = useRouter();
  const savedAwarded = new Set(rule.awards.map((a) => a.memberId));

  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [syncedKey, setSyncedKey] = useState("");
  const savedKey = `${rule.id}:${Array.from(savedAwarded).sort().join(",")}`;
  if (savedKey !== syncedKey) {
    setSyncedKey(savedKey);
    setDraft({});
  }

  function isChecked(memberId: string) {
    return draft[memberId] ?? savedAwarded.has(memberId);
  }
  function toggle(memberId: string) {
    setDraft((prev) => ({ ...prev, [memberId]: !isChecked(memberId) }));
  }

  const pendingChanges = members.filter((m) => isChecked(m.id) !== savedAwarded.has(m.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const memberIds = members.filter((m) => isChecked(m.id)).map((m) => m.id);
      const res = await fetch(`/api/leagues/${leagueId}/rules/${rule.id}/awards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Couldn't save this");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-cream/10 rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-lg tracking-wide">{rule.label.toUpperCase()}</h3>
        <span className={`font-display text-base ${rule.points >= 0 ? "text-pink" : "text-pink/70"}`}>
          {rule.points > 0 ? `+${rule.points}` : rule.points}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 mb-4">
        {members.map((m) => (
          <label
            key={m.id}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-cream/[0.04] transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isChecked(m.id)}
              onChange={() => toggle(m.id)}
              className="w-[18px] h-[18px] accent-pink flex-none"
            />
            <span className="text-sm">{m.user.name}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-[#ff8fa8] mb-2.5">{error}</p>}
      {pendingChanges.length > 0 && (
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-full bg-pink text-ink text-sm font-bold disabled:opacity-40 transition"
        >
          {saving ? "Saving…" : `Save (${pendingChanges.length})`}
        </button>
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
