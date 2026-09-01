"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DRAFT_MODE_LABELS, formatDueDate } from "@/lib/leagues";

type Rule = { id: string; label: string; points: number; isCustom: boolean };
type WeeklyPick = { id: string; week: number; topThree: string[]; songPrediction: string | null };
type Member = {
  id: string;
  userId: string;
  role: string;
  notifyPicksDue: boolean;
  winnerPick: string | null;
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
  const [tab, setTab] = useState<"details" | "rankings" | "scoring">("details");
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
      if (!res.ok) throw new Error(data?.error || "Couldn't lock in that pick");
      setWinnerPick(data.winnerPick);
    } catch (err) {
      setWinnerError(err instanceof Error ? err.message : "Couldn't lock in that pick");
    } finally {
      setWinnerBusy(false);
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
    } catch (err) {
      setWeeklyError(err instanceof Error ? err.message : "Couldn't save that pick");
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
    <div className="px-5 sm:px-10 py-8 sm:py-11 pb-20 max-w-3xl mx-auto">
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
          </div>
        </div>
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
  onPickWinner: (contestant: string) => void;
  weeklyPicks: WeeklyPick[];
  weekliesBusy: boolean;
  weeklyError: string;
  onSubmitWeekly: (week: number, topThree: string[], songPrediction: string) => void;
}) {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const startingPick = weeklyPicks.find((p) => p.week === 1);
  const [draftTop, setDraftTop] = useState<[string, string, string]>([
    startingPick?.topThree[0] ?? "",
    startingPick?.topThree[1] ?? "",
    startingPick?.topThree[2] ?? "",
  ]);
  const [draftSong, setDraftSong] = useState(startingPick?.songPrediction ?? "");

  function changeWeek(w: number) {
    setSelectedWeek(w);
    const p = weeklyPicks.find((x) => x.week === w);
    setDraftTop([p?.topThree[0] ?? "", p?.topThree[1] ?? "", p?.topThree[2] ?? ""]);
    setDraftSong(p?.songPrediction ?? "");
  }

  if (!template) return null;
  const active = template.contestants.filter((c) => !template.eliminatedContestants.includes(c));
  const existing = weeklyPicks.find((p) => p.week === selectedWeek);
  const canSave = draftTop.every((c) => c) && new Set(draftTop).size === 3;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card border border-cream/10 rounded-3xl p-6">
        <h3 className="font-display text-xl tracking-wide mb-1.5">SEASON WINNER</h3>
        {winnerPick ? (
          <p className="text-sm text-cream/70">
            Locked in: <span className="text-pink font-semibold">{winnerPick}</span>
          </p>
        ) : (
          <>
            <p className="text-sm text-cream/55 mb-3">Pick once — this can&apos;t be changed after you save it.</p>
            {winnerError && <p className="text-sm text-pink font-medium mb-2">{winnerError}</p>}
            <div className="flex flex-wrap gap-1.5">
              {active.map((c) => (
                <button
                  key={c}
                  onClick={() => onPickWinner(c)}
                  disabled={winnerBusy}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-cream/15 bg-ink/40 text-cream/80 hover:border-pink transition disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-card border border-cream/10 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <h3 className="font-display text-xl tracking-wide">WEEKLY PICKS</h3>
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
          onClick={() => onSubmitWeekly(selectedWeek, draftTop, draftSong)}
          disabled={!canSave || weekliesBusy}
          className="px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-50"
        >
          {weekliesBusy ? "Saving…" : existing ? "Update picks" : "Save picks"}
        </button>
      </div>
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
