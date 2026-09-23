"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminRuleAward = { id: string; week: number; contestant: string; ruleId: string };
export type AdminWeeklyScore = { id: string; week: number; contestant: string; score: number };
export type AdminWeeklyResult = {
  id: string;
  week: number;
  actualStarBaker: string | null;
  actualTechnicalWinner: string | null;
  actualVotedOff: string | null;
  actualTechnicalLoser: string | null;
  handshakes: unknown;
};
export type AdminScoringRule = { id: string; label: string; points: number; order: number };
export type AdminScoringTemplate = {
  id: string;
  name: string;
  tag: string | null;
  weeks: number;
  contestants: string[];
  eliminatedContestants: string[];
  pickFormat: string;
  rules: AdminScoringRule[];
  ruleAwards: AdminRuleAward[];
  weeklyScores: AdminWeeklyScore[];
  weeklyResults: AdminWeeklyResult[];
  weekThemes: unknown;
  actualFinalFour: string[];
  actualWinner: string | null;
};

// Rules that score themselves from other admin inputs instead of a manual
// per-rule toggle — matched by keyword since templates don't currently tag
// rules by role. Adjust if a future template's wording doesn't fit these:
// "top three" / "song" come from the ranked-score grid above, and
// "winner pick" (both the correct-pick and eliminated-pick rules) comes
// from Actual Season Winner and the Couple Eliminated toggles — so
// there's nothing left to manually award for either one.
const RANK_DERIVED_PATTERN = /top three|song|winner pick/i;

// Same idea, for Traitors (TRTRS) — these labels are informational/
// engine-computed from the "went home," shield, and votes-against
// inputs, not their own checkbox. Kept separate from RANK_DERIVED_PATTERN
// since Survivor's genuinely-manual "Survives the episode" rule would
// otherwise collide with Traitors' derived one of the same name.
const TRAITORS_DERIVED_PATTERN =
  /prediction correct|survives the episode|eliminated this episode|predicted player goes home|all three selections|receives 0 votes/i;

export function AdminScoring({ templates }: { templates: AdminScoringTemplate[] }) {
  const router = useRouter();
  // DWTS is the live show right now — default to it instead of whatever
  // happens to be first in the list.
  const defaultTemplate =
    templates.find((t) => t.tag === "DWTS") ??
    templates.find((t) => t.pickFormat === "WEEKLY_TOP3") ??
    templates[0] ??
    null;
  const [templateId, setTemplateId] = useState(() => defaultTemplate?.id ?? "");
  const [week, setWeek] = useState(() => (defaultTemplate?.tag === "TRTRS" ? 2 : 1));
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const template = templates.find((t) => t.id === templateId) ?? null;
  const activeContestants =
    template?.contestants.filter((c) => !template.eliminatedContestants.includes(c)) ?? [];

  function isAwarded(ruleId: string, contestant: string) {
    return !!template?.ruleAwards.some((a) => a.ruleId === ruleId && a.week === week && a.contestant === contestant);
  }

  // Nothing here saves as you go — WeeklyTop3Scoring and DraftRulesScoring
  // keep their own local draft of the week's entries, and only call this
  // (via their "Submit Week N" button) once you're done editing.
  async function submitWeek(
    scoreChanges: { contestant: string; score: number }[],
    awardChanges: { ruleId: string; contestant: string }[]
  ) {
    if (!template) return;
    setBusyKey("submit");
    setError("");
    try {
      for (const s of scoreChanges) {
        const res = await fetch(`/api/admin/templates/${template.id}/weekly-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ week, contestant: s.contestant, score: s.score }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Couldn't save ${s.contestant}'s score`);
        }
      }
      for (const a of awardChanges) {
        const res = await fetch(`/api/admin/templates/${template.id}/scoring`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ week, ruleId: a.ruleId, contestant: a.contestant }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Couldn't save a rule");
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this week's scoring");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveActualResults(payload: { actualFinalFour?: string[]; actualWinner?: string }) {
    if (!template) return;
    const key = payload.actualWinner ? "actual:winner" : "actual:finalFour";
    setBusyKey(key);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/actual-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Couldn't save that");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveCategoryResult(payload: {
    week: number;
    actualStarBaker: string | null;
    actualTechnicalWinner: string | null;
    actualVotedOff: string | null;
    actualTechnicalLoser: string | null;
    handshakes: Record<string, number>;
  }) {
    if (!template) return;
    setBusyKey("submit");
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/category-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Couldn't save this week's results");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this week's results");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveWeekTheme(themeWeek: number, theme: string) {
    if (!template) return;
    const key = `theme:${themeWeek}`;
    setBusyKey(key);
    setError("");
    const current = (template.weekThemes as Record<string, string> | null) ?? {};
    const next = { ...current, [String(themeWeek)]: theme };
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekThemes: next }),
      });
      if (!res.ok) throw new Error("Couldn't save that theme");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that theme");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleEliminated(contestant: string) {
    if (!template) return;
    const key = `eliminate:${contestant}`;
    setBusyKey(key);
    setError("");
    const next = template.eliminatedContestants.includes(contestant)
      ? template.eliminatedContestants.filter((c) => c !== contestant)
      : [...template.eliminatedContestants, contestant];
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eliminatedContestants: next }),
      });
      if (!res.ok) throw new Error("Couldn't update that");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that");
    } finally {
      setBusyKey(null);
    }
  }

  if (!template) {
    return (
      <div className="bg-white border border-[#E2E4E9] rounded-lg px-5 py-12 text-center text-sm text-[#6B7280]">
        No templates yet — add one in League Templates first.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">WEEKLY SCORING</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Applies to every league built from this exact template — id <code className="text-[#16181D]">{template.id}</code>.
            {templates.filter((t) => t.tag === template.tag).length > 1 && (
              <span className="text-[#C2314E] font-semibold">
                {" "}
                {templates.filter((t) => t.tag === template.tag).length} templates share the {template.tag} tag — make
                sure this is the one your leagues are actually built on (check the Leagues tab).
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <select
          value={templateId}
          onChange={(e) => {
            const next = templates.find((t) => t.id === e.target.value);
            setTemplateId(e.target.value);
            setWeek(next?.tag === "TRTRS" ? 2 : 1);
          }}
          className="px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tag ? `${t.tag} — ${t.name}` : t.name} ({t.id})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#5B6270]">Week</span>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="px-3 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
          >
            {Array.from({ length: template.weeks }, (_, i) => i + 1)
              .filter((w) => template.tag !== "TRTRS" || w >= 2)
              .map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-[#FDF2F4] border-x border-[#E2E4E9] text-[#C2314E] text-sm">{error}</div>
      )}

      {template.pickFormat === "WEEKLY_TOP3" ? (
        <WeeklyTop3Scoring
          template={template}
          week={week}
          activeContestants={activeContestants}
          busyKey={busyKey}
          isAwarded={isAwarded}
          onToggleEliminated={toggleEliminated}
          onSaveActualResults={saveActualResults}
          onSubmitWeek={submitWeek}
          onSaveWeekTheme={saveWeekTheme}
        />
      ) : template.pickFormat === "WEEKLY_CATEGORIES" ? (
        <WeeklyCategoriesScoring
          template={template}
          week={week}
          activeContestants={activeContestants}
          busyKey={busyKey}
          onToggleEliminated={toggleEliminated}
          onSaveResult={saveCategoryResult}
          onSaveWeekTheme={saveWeekTheme}
        />
      ) : (
        <DraftRulesScoring
          template={template}
          week={week}
          activeContestants={activeContestants}
          busyKey={busyKey}
          isAwarded={isAwarded}
          onSubmitWeek={(awardChanges) => submitWeek([], awardChanges)}
        />
      )}
    </div>
  );
}

function RulesScoring({
  rules,
  activeContestants,
  busyKey,
  isAwarded,
  onToggleAward,
}: {
  rules: AdminScoringRule[];
  activeContestants: string[];
  busyKey: string | null;
  isAwarded: (ruleId: string, contestant: string) => boolean;
  onToggleAward: (ruleId: string, contestant: string) => void;
}) {
  return (
    <div className="bg-white border border-[#E2E4E9] rounded-b-lg divide-y divide-[#EDEFF3]">
      {rules.map((rule) => (
        <div key={rule.id} className="px-[18px] py-4">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="text-sm font-semibold">{rule.label}</span>
            <span className="text-xs font-bold text-[#8A909B]">
              {rule.points > 0 ? `+${rule.points}` : rule.points} pts
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeContestants.map((c) => {
              const awarded = isAwarded(rule.id, c);
              const key = `award:${rule.id}:${c}`;
              return (
                <button
                  key={c}
                  onClick={() => onToggleAward(rule.id, c)}
                  disabled={busyKey === key}
                  className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition disabled:opacity-50 ${
                    awarded
                      ? "bg-[#EEF8F1] border-[#1E7B45]/40 text-[#1E7B45]"
                      : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                  }`}
                >
                  {awarded ? "✓ " : ""}
                  {c}
                </button>
              );
            })}
            {activeContestants.length === 0 && (
              <p className="text-xs text-[#8A909B]">No active contestants — add some in League Templates.</p>
            )}
          </div>
        </div>
      ))}
      {rules.length === 0 && (
        <div className="px-5 py-12 text-center text-sm text-[#6B7280]">
          This template has no scoring rules yet — add some in League Templates.
        </div>
      )}
    </div>
  );
}

function WeeklyTop3Scoring({
  template,
  week,
  activeContestants,
  busyKey,
  isAwarded,
  onToggleEliminated,
  onSaveActualResults,
  onSubmitWeek,
  onSaveWeekTheme,
}: {
  template: AdminScoringTemplate;
  week: number;
  activeContestants: string[];
  busyKey: string | null;
  isAwarded: (ruleId: string, contestant: string) => boolean;
  onToggleEliminated: (contestant: string) => void;
  onSaveActualResults: (payload: { actualFinalFour?: string[]; actualWinner?: string }) => void;
  onSubmitWeek: (
    scoreChanges: { contestant: string; score: number }[],
    awardChanges: { ruleId: string; contestant: string }[]
  ) => void;
  onSaveWeekTheme: (week: number, theme: string) => void;
}) {
  // Survivor's rules are all individual per-contestant events (immunity
  // win, idol found, survives, eliminated...) — there's no "rank the
  // week's scores to find a top three" concept the way DWTS has, so the
  // week theme, per-couple score grid, and song predictions note (all
  // DWTS-specific) don't apply and stay hidden.
  const isSurvivor = template.tag === "SRVR";
  // Traitors also skips week theme and song predictions, but — unlike
  // Survivor — still needs the numeric per-contestant grid, just
  // relabeled (it's votes-against, not a top-three ranking).
  const isTraitors = template.tag === "TRTRS";
  const showDwtsExtras = !isSurvivor && !isTraitors;

  const scoresThisWeek = template.weeklyScores.filter((s) => s.week === week);
  const scoreOf = (c: string) => scoresThisWeek.find((s) => s.contestant === c)?.score ?? 0;

  const weekThemes = (template.weekThemes as Record<string, string> | null) ?? {};
  const savedTheme = weekThemes[String(week)] ?? "";
  const [themeDraft, setThemeDraft] = useState(savedTheme);
  const [themeSyncedKey, setThemeSyncedKey] = useState(`${template.id}-${week}`);
  if (`${template.id}-${week}` !== themeSyncedKey) {
    setThemeSyncedKey(`${template.id}-${week}`);
    setThemeDraft(savedTheme);
  }

  // Scoring stays open to every couple, eliminated or not — a couple can
  // still land in a week's top three (or get injured, etc.) the same week
  // they're voted off, so pulling them from the grid the moment they're
  // marked eliminated would make that unrecordable.
  const allContestants = template.contestants;

  const derivedPattern = isTraitors ? TRAITORS_DERIVED_PATTERN : RANK_DERIVED_PATTERN;
  const otherRules = template.rules.filter((r) => !derivedPattern.test(r.label));

  // Nothing here saves as it's typed/clicked — it's all held in a local
  // draft, seeded from the committed data, until "Submit Week N" is
  // pressed. Re-seeded whenever the selected template or week changes.
  function seedScores() {
    return Object.fromEntries(allContestants.map((c) => [c, String(scoreOf(c))]));
  }
  function seedAwards() {
    const s = new Set<string>();
    for (const rule of otherRules) {
      for (const c of activeContestants) {
        if (isAwarded(rule.id, c)) s.add(`${rule.id}:${c}`);
      }
    }
    return s;
  }
  const draftKey = `${template.id}-${week}`;
  const [draftScores, setDraftScores] = useState<Record<string, string>>(() => seedScores());
  const [draftAwards, setDraftAwards] = useState<Set<string>>(() => seedAwards());
  const [syncedKey, setSyncedKey] = useState(draftKey);
  if (draftKey !== syncedKey) {
    setSyncedKey(draftKey);
    setDraftScores(seedScores());
    setDraftAwards(seedAwards());
  }

  function draftScoreOf(c: string) {
    return Math.round(Number(draftScores[c]) || 0);
  }
  function draftIsAwarded(ruleId: string, c: string) {
    return draftAwards.has(`${ruleId}:${c}`);
  }
  function toggleDraftAward(ruleId: string, c: string) {
    setDraftAwards((prev) => {
      const next = new Set(prev);
      const key = `${ruleId}:${c}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const ranked = [...allContestants].sort((a, b) => draftScoreOf(b) - draftScoreOf(a));
  const thirdPlaceScore = ranked.length >= 3 ? draftScoreOf(ranked[2]) : -Infinity;
  const topThree = new Set(ranked.filter((c) => draftScoreOf(c) >= thirdPlaceScore && draftScoreOf(c) > 0));

  const scoreChanges = allContestants
    .filter((c) => draftScoreOf(c) !== scoreOf(c))
    .map((c) => ({ contestant: c, score: draftScoreOf(c) }));
  const awardChanges = otherRules.flatMap((rule) =>
    activeContestants
      .filter((c) => draftIsAwarded(rule.id, c) !== isAwarded(rule.id, c))
      .map((c) => ({ ruleId: rule.id, contestant: c }))
  );
  const pendingCount = scoreChanges.length + awardChanges.length;

  return (
    <div className="flex flex-col gap-3.5">
      <SeasonPredictionsAnswerKey
        template={template}
        busyKey={busyKey}
        onSaveActualResults={onSaveActualResults}
      />

      {showDwtsExtras && (
        <div className="bg-white border border-[#E2E4E9] rounded-lg px-[18px] py-4">
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2">WEEK {week} THEME</div>
          <div className="flex items-center gap-2">
            <input
              value={themeDraft}
              onChange={(e) => setThemeDraft(e.target.value)}
              placeholder="e.g. Viral Hits"
              className="flex-1 px-3 py-2 rounded-md border border-[#D6D9E0] bg-white text-sm outline-none focus:border-purple transition"
            />
            <button
              onClick={() => onSaveWeekTheme(week, themeDraft)}
              disabled={themeDraft === savedTheme || busyKey === `theme:${week}`}
              className="px-4 py-2 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
            >
              {busyKey === `theme:${week}` ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {!isSurvivor && (
        <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1">
            {isTraitors ? "VOTES AGAINST EACH CONTESTANT" : "SCORE EVERY COUPLE"}
          </div>
          <p className="text-xs text-[#8A909B] mb-3">
            {isTraitors
              ? "Enter how many votes each contestant received at the Round Table this week — 0 triggers a bonus for whoever picked them."
              : "Enter each couple's score for the week — the top three (ties included) are ranked automatically below."}
          </p>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {allContestants.map((c) => {
              const inTop3 = !isTraitors && topThree.has(c);
              const eliminated = template.eliminatedContestants.includes(c);
              return (
                <div
                  key={c}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                    inTop3 ? "bg-[#EEF8F1] border-[#1E7B45]/40" : "bg-[#F8F9FB] border-[#EDEFF3]"
                  }`}
                >
                  <span className="flex-1 text-sm truncate">{c}</span>
                  {eliminated && <span className="text-[10px] font-bold text-[#C2314E]">OUT</span>}
                  {inTop3 && <span className="text-[10px] font-bold text-[#1E7B45]">TOP 3</span>}
                  <input
                    type="number"
                    value={draftScores[c] ?? "0"}
                    onChange={(e) => setDraftScores((prev) => ({ ...prev, [c]: e.target.value }))}
                    className="w-16 px-2 py-1 rounded border border-[#D6D9E0] bg-white text-sm text-center outline-none focus:border-purple transition"
                  />
                </div>
              );
            })}
            {allContestants.length === 0 && (
              <p className="text-xs text-[#8A909B]">No contestants — add some in League Templates.</p>
            )}
          </div>
        </div>
      )}

      {showDwtsExtras && (
        <div className="bg-white border border-[#E2E4E9] rounded-lg px-[18px] py-4">
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1">SONG PREDICTIONS</div>
          <p className="text-sm text-[#5B6270]">
            Not scored here — each league&apos;s commissioner checks their own members&apos; song predictions from
            their league page.
          </p>
        </div>
      )}

      {otherRules.length > 0 && (
        <RulesScoring
          rules={otherRules}
          activeContestants={activeContestants}
          busyKey={busyKey}
          isAwarded={draftIsAwarded}
          onToggleAward={toggleDraftAward}
        />
      )}

      <div className="bg-white border border-[#E2E4E9] rounded-lg px-[18px] py-4">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2.5">
          {isSurvivor || isTraitors ? "CONTESTANT ELIMINATED" : "COUPLE ELIMINATED"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {template.contestants.map((c) => {
            const out = template.eliminatedContestants.includes(c);
            return (
              <button
                key={c}
                onClick={() => onToggleEliminated(c)}
                disabled={busyKey === `eliminate:${c}`}
                className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition disabled:opacity-50 ${
                  out ? "bg-[#C2314E] text-white border-[#C2314E]" : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                }`}
              >
                {out ? "OUT — " : ""}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-[18px] py-3.5 bg-white border border-[#E2E4E9] rounded-lg">
        <span className="text-[13px] text-[#5B6270]">
          {pendingCount === 0
            ? "No changes to submit"
            : `${pendingCount} change${pendingCount === 1 ? "" : "s"} ready to submit`}
        </span>
        <button
          onClick={() => onSubmitWeek(scoreChanges, awardChanges)}
          disabled={pendingCount === 0 || busyKey === "submit"}
          className="px-5 py-2.5 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
        >
          {busyKey === "submit" ? "Submitting…" : `Submit Week ${week}`}
        </button>
      </div>
    </div>
  );
}

// WEEKLY_CATEGORIES templates (Bake Off): the week's answer key — actual
// Star Baker/technical winner/voted off/technical loser (single-select
// each) plus handshake counts (a baker can get more than one). Same
// "draft locally, submit once" pattern as the other scoring views.
function WeeklyCategoriesScoring({
  template,
  week,
  activeContestants,
  busyKey,
  onToggleEliminated,
  onSaveResult,
  onSaveWeekTheme,
}: {
  template: AdminScoringTemplate;
  week: number;
  activeContestants: string[];
  busyKey: string | null;
  onToggleEliminated: (contestant: string) => void;
  onSaveResult: (payload: {
    week: number;
    actualStarBaker: string | null;
    actualTechnicalWinner: string | null;
    actualVotedOff: string | null;
    actualTechnicalLoser: string | null;
    handshakes: Record<string, number>;
  }) => void;
  onSaveWeekTheme: (week: number, theme: string) => void;
}) {
  const existing = template.weeklyResults.find((r) => r.week === week) ?? null;
  const existingHandshakes = (existing?.handshakes as Record<string, number> | null) ?? {};
  const weekThemes = (template.weekThemes as Record<string, string> | null) ?? {};
  const savedTheme = weekThemes[String(week)] ?? "";

  const [themeDraft, setThemeDraft] = useState(savedTheme);
  const [themeSyncedKey, setThemeSyncedKey] = useState(`${template.id}-${week}`);
  if (`${template.id}-${week}` !== themeSyncedKey) {
    setThemeSyncedKey(`${template.id}-${week}`);
    setThemeDraft(savedTheme);
  }

  function seed() {
    return {
      starBaker: existing?.actualStarBaker ?? "",
      technical: existing?.actualTechnicalWinner ?? "",
      votedOff: existing?.actualVotedOff ?? "",
      technicalLoser: existing?.actualTechnicalLoser ?? "",
      handshakes: { ...existingHandshakes },
    };
  }

  const draftKey = `${template.id}-${week}`;
  const [draft, setDraft] = useState(seed());
  const [syncedKey, setSyncedKey] = useState(draftKey);
  if (draftKey !== syncedKey) {
    setSyncedKey(draftKey);
    setDraft(seed());
  }

  function handshakeCount(c: string) {
    return draft.handshakes[c] ?? 0;
  }
  function bumpHandshake(c: string, delta: number) {
    setDraft((prev) => ({
      ...prev,
      handshakes: { ...prev.handshakes, [c]: Math.max(0, (prev.handshakes[c] ?? 0) + delta) },
    }));
  }

  const dirty =
    draft.starBaker !== (existing?.actualStarBaker ?? "") ||
    draft.technical !== (existing?.actualTechnicalWinner ?? "") ||
    draft.votedOff !== (existing?.actualVotedOff ?? "") ||
    draft.technicalLoser !== (existing?.actualTechnicalLoser ?? "") ||
    JSON.stringify(draft.handshakes) !== JSON.stringify(existingHandshakes);

  function CategoryPicker({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="px-[18px] py-4 border-b border-[#EDEFF3] last:border-b-0">
        <div className="text-sm font-semibold mb-2.5">{label}</div>
        <div className="flex flex-wrap gap-1.5">
          {activeContestants.map((c) => {
            const selected = value === c;
            return (
              <button
                key={c}
                onClick={() => onChange(selected ? "" : c)}
                className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                  selected
                    ? "bg-purple/10 border-purple text-purple"
                    : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                }`}
              >
                {selected ? "✓ " : ""}
                {c}
              </button>
            );
          })}
          {activeContestants.length === 0 && (
            <p className="text-xs text-[#8A909B]">No active contestants — add some in League Templates.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="bg-white border border-[#E2E4E9] rounded-lg px-[18px] py-4">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2">
          WEEK {week} THEME
        </div>
        <div className="flex items-center gap-2">
          <input
            value={themeDraft}
            onChange={(e) => setThemeDraft(e.target.value)}
            placeholder="e.g. Cake Week"
            className="flex-1 px-3 py-2 rounded-md border border-[#D6D9E0] bg-white text-sm outline-none focus:border-purple transition"
          />
          <button
            onClick={() => onSaveWeekTheme(week, themeDraft)}
            disabled={themeDraft === savedTheme || busyKey === `theme:${week}`}
            className="px-4 py-2 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
          >
            {busyKey === `theme:${week}` ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {week === 1 && (
        <div className="px-[18px] py-3 bg-[#FFF8E8] border border-[#F0D98C] rounded-lg text-sm text-[#8A6D1F]">
          Week 1 isn&apos;t scored — you can still record results here for the record, but it won&apos;t affect anyone&apos;s points.
        </div>
      )}

      <div className="bg-white border border-[#E2E4E9] rounded-lg">
        <CategoryPicker label="Actual Star Baker" value={draft.starBaker} onChange={(v) => setDraft((p) => ({ ...p, starBaker: v }))} />
        <CategoryPicker
          label="Actual technical winner"
          value={draft.technical}
          onChange={(v) => setDraft((p) => ({ ...p, technical: v }))}
        />
        <CategoryPicker label="Actual voted off" value={draft.votedOff} onChange={(v) => setDraft((p) => ({ ...p, votedOff: v }))} />
        <CategoryPicker
          label="Actual last place in the technical"
          value={draft.technicalLoser}
          onChange={(v) => setDraft((p) => ({ ...p, technicalLoser: v }))}
        />
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1">HOLLYWOOD HANDSHAKES</div>
        <p className="text-xs text-[#8A909B] mb-3">A baker can get more than one in an episode.</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {activeContestants.map((c) => (
            <div key={c} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#EDEFF3] bg-[#F8F9FB]">
              <span className="flex-1 text-sm truncate">{c}</span>
              <button
                onClick={() => bumpHandshake(c, -1)}
                disabled={handshakeCount(c) === 0}
                className="w-7 h-7 rounded-md border border-[#D6D9E0] bg-white text-sm font-bold disabled:opacity-30"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold">{handshakeCount(c)}</span>
              <button
                onClick={() => bumpHandshake(c, 1)}
                className="w-7 h-7 rounded-md border border-[#D6D9E0] bg-white text-sm font-bold"
              >
                +
              </button>
            </div>
          ))}
          {activeContestants.length === 0 && (
            <p className="text-xs text-[#8A909B]">No active contestants — add some in League Templates.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-lg px-[18px] py-4">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2.5">BAKER ELIMINATED</div>
        <div className="flex flex-wrap gap-1.5">
          {template.contestants.map((c) => {
            const out = template.eliminatedContestants.includes(c);
            return (
              <button
                key={c}
                onClick={() => onToggleEliminated(c)}
                disabled={busyKey === `eliminate:${c}`}
                className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition disabled:opacity-50 ${
                  out ? "bg-[#C2314E] text-white border-[#C2314E]" : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                }`}
              >
                {out ? "OUT — " : ""}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-[18px] py-3.5 bg-white border border-[#E2E4E9] rounded-lg">
        <span className="text-[13px] text-[#5B6270]">{dirty ? "Changes ready to submit" : "No changes to submit"}</span>
        <button
          onClick={() =>
            onSaveResult({
              week,
              actualStarBaker: draft.starBaker || null,
              actualTechnicalWinner: draft.technical || null,
              actualVotedOff: draft.votedOff || null,
              actualTechnicalLoser: draft.technicalLoser || null,
              handshakes: draft.handshakes,
            })
          }
          disabled={!dirty || busyKey === "submit"}
          className="px-5 py-2.5 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
        >
          {busyKey === "submit" ? "Submitting…" : `Submit Week ${week}`}
        </button>
      </div>
    </div>
  );
}

// Same "draft locally, submit once" pattern as WeeklyTop3Scoring's rule
// toggles, for templates that don't have a score grid — just the rule
// list.
function DraftRulesScoring({
  template,
  week,
  activeContestants,
  busyKey,
  isAwarded,
  onSubmitWeek,
}: {
  template: AdminScoringTemplate;
  week: number;
  activeContestants: string[];
  busyKey: string | null;
  isAwarded: (ruleId: string, contestant: string) => boolean;
  onSubmitWeek: (awardChanges: { ruleId: string; contestant: string }[]) => void;
}) {
  function seedAwards() {
    const s = new Set<string>();
    for (const rule of template.rules) {
      for (const c of activeContestants) {
        if (isAwarded(rule.id, c)) s.add(`${rule.id}:${c}`);
      }
    }
    return s;
  }
  const draftKey = `${template.id}-${week}`;
  const [draftAwards, setDraftAwards] = useState<Set<string>>(() => seedAwards());
  const [syncedKey, setSyncedKey] = useState(draftKey);
  if (draftKey !== syncedKey) {
    setSyncedKey(draftKey);
    setDraftAwards(seedAwards());
  }

  function draftIsAwarded(ruleId: string, c: string) {
    return draftAwards.has(`${ruleId}:${c}`);
  }
  function toggle(ruleId: string, c: string) {
    setDraftAwards((prev) => {
      const next = new Set(prev);
      const key = `${ruleId}:${c}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const changes = template.rules.flatMap((rule) =>
    activeContestants
      .filter((c) => draftIsAwarded(rule.id, c) !== isAwarded(rule.id, c))
      .map((c) => ({ ruleId: rule.id, contestant: c }))
  );

  return (
    <div className="flex flex-col gap-3">
      <RulesScoring
        rules={template.rules}
        activeContestants={activeContestants}
        busyKey={busyKey}
        isAwarded={draftIsAwarded}
        onToggleAward={toggle}
      />
      <div className="flex items-center justify-between gap-3 px-[18px] py-3.5 bg-white border border-[#E2E4E9] rounded-lg">
        <span className="text-[13px] text-[#5B6270]">
          {changes.length === 0 ? "No changes to submit" : `${changes.length} change${changes.length === 1 ? "" : "s"} ready to submit`}
        </span>
        <button
          onClick={() => onSubmitWeek(changes)}
          disabled={changes.length === 0 || busyKey === "submit"}
          className="px-5 py-2.5 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
        >
          {busyKey === "submit" ? "Submitting…" : `Submit Week ${week}`}
        </button>
      </div>
    </div>
  );
}

// The real-world answer key for the pre-season "final four" and season
// winner predictions members lock in once. Not tied to the week selector
// above — the real results land whenever the show actually gets there, so
// this stays visible and editable (until locked) no matter which week is
// selected.
function SeasonPredictionsAnswerKey({
  template,
  busyKey,
  onSaveActualResults,
}: {
  template: AdminScoringTemplate;
  busyKey: string | null;
  onSaveActualResults: (payload: { actualFinalFour?: string[]; actualWinner?: string }) => void;
}) {
  const [picking, setPicking] = useState<string[]>([]);
  const [pickedWinner, setPickedWinner] = useState<string | null>(null);
  const finalFourLocked = template.actualFinalFour.length > 0;
  const winnerLocked = !!template.actualWinner;
  // Survivor has no separate season-winner pick — just the pre-season
  // top four — so there's nothing to enter an answer key for here.
  const isSurvivor = template.tag === "SRVR";
  // Traitors is the opposite: no top-four pick, just the one binary
  // Traitors-vs-Faithfuls prediction, reusing the same actualWinner
  // field with "Traitors" / "Faithfuls" as its two possible values.
  const isTraitors = template.tag === "TRTRS";

  function toggle(c: string) {
    setPicking((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : prev.length < 4 ? [...prev, c] : prev
    );
  }

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-b-lg p-[18px]">
      <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1">
        SEASON PREDICTIONS — ANSWER KEY
      </div>
      <p className="text-xs text-[#8A909B] mb-3">
        {isSurvivor
          ? "Can only be set once — pick it whenever the real result is known. Members predicted their top four for +5 points each, before week one."
          : isTraitors
            ? "Can only be set once — pick it whenever the real result is known. Members predicted Traitors or Faithfuls for +5 points, before week one."
            : "Each of these can only be set once — pick them whenever the real result is known. Members predicted the final four for +5 points each and the season winner once, before week one."}
      </p>

      {!isTraitors && (
        <div className="mb-4">
          <div className="text-[13px] font-semibold text-[#16181D] mb-2">
            Actual final four {finalFourLocked ? "" : `(${picking.length}/4)`}
          </div>
          {finalFourLocked ? (
            <div className="flex flex-wrap gap-1.5">
              {template.actualFinalFour.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-[#EEF8F1] border border-[#1E7B45]/40 text-[#1E7B45]"
                >
                  ✓ {c}
                </span>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {template.contestants.map((c) => {
                  const selected = picking.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggle(c)}
                      className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                        selected
                          ? "bg-purple/10 border-purple text-purple"
                          : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {c}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onSaveActualResults({ actualFinalFour: picking })}
                disabled={picking.length !== 4 || busyKey === "actual:finalFour"}
                className="px-4 py-2 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
              >
                {busyKey === "actual:finalFour" ? "Locking in…" : "Lock in final four"}
              </button>
            </>
          )}
        </div>
      )}

      {isTraitors && (
        <div>
          <div className="text-[13px] font-semibold text-[#16181D] mb-2">Actual outcome</div>
          {winnerLocked ? (
            <span className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-[#EEF8F1] border border-[#1E7B45]/40 text-[#1E7B45] inline-block">
              ✓ {template.actualWinner}
            </span>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {["Traitors", "Faithfuls"].map((c) => {
                  const selected = pickedWinner === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setPickedWinner(c)}
                      className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                        selected
                          ? "bg-purple/10 border-purple text-purple"
                          : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {c} win
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => pickedWinner && onSaveActualResults({ actualWinner: pickedWinner })}
                disabled={!pickedWinner || busyKey === "actual:winner"}
                className="px-4 py-2 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
              >
                {busyKey === "actual:winner" ? "Locking in…" : "Lock in outcome"}
              </button>
            </>
          )}
        </div>
      )}

      {!isSurvivor && !isTraitors && (
        <div>
          <div className="text-[13px] font-semibold text-[#16181D] mb-2">Actual season winner</div>
          {winnerLocked ? (
            <span className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-[#EEF8F1] border border-[#1E7B45]/40 text-[#1E7B45] inline-block">
              ✓ {template.actualWinner}
            </span>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {template.contestants.map((c) => {
                  const selected = pickedWinner === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setPickedWinner(c)}
                      className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                        selected
                          ? "bg-purple/10 border-purple text-purple"
                          : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {c}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => pickedWinner && onSaveActualResults({ actualWinner: pickedWinner })}
                disabled={!pickedWinner || busyKey === "actual:winner"}
                className="px-4 py-2 rounded-md bg-purple text-white text-[13px] font-bold disabled:opacity-40"
              >
                {busyKey === "actual:winner" ? "Locking in…" : "Lock in season winner"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
