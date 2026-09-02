"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminRuleAward = { id: string; week: number; contestant: string; ruleId: string };
export type AdminWeeklyScore = { id: string; week: number; contestant: string; score: number };
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
  actualFinalFour: string[];
  actualWinner: string | null;
};

// Rules whose scoring now comes from the ranked-score grid instead of a
// manual per-rule toggle — matched by keyword since templates don't
// currently tag rules by role. Adjust if a future template's wording
// doesn't fit "top three" / "song".
const RANK_DERIVED_PATTERN = /top three|song/i;

export function AdminScoring({ templates }: { templates: AdminScoringTemplate[] }) {
  const router = useRouter();
  // DWTS is the live show right now — default to it instead of whatever
  // happens to be first in the list.
  const [templateId, setTemplateId] = useState(
    () =>
      templates.find((t) => t.tag === "DWTS")?.id ??
      templates.find((t) => t.pickFormat === "WEEKLY_TOP3")?.id ??
      templates[0]?.id ??
      ""
  );
  const [week, setWeek] = useState(1);
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
            Applies to every league on the {template.tag ?? "matching"} tag automatically.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setWeek(1);
          }}
          className="px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tag ? `${t.tag} — ${t.name}` : t.name}
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
            {Array.from({ length: template.weeks }, (_, i) => i + 1).map((w) => (
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
}) {
  const scoresThisWeek = template.weeklyScores.filter((s) => s.week === week);
  const scoreOf = (c: string) => scoresThisWeek.find((s) => s.contestant === c)?.score ?? 0;

  const otherRules = template.rules.filter((r) => !RANK_DERIVED_PATTERN.test(r.label));

  // Nothing here saves as it's typed/clicked — it's all held in a local
  // draft, seeded from the committed data, until "Submit Week N" is
  // pressed. Re-seeded whenever the selected template or week changes.
  function seedScores() {
    return Object.fromEntries(activeContestants.map((c) => [c, String(scoreOf(c))]));
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

  const ranked = [...activeContestants].sort((a, b) => draftScoreOf(b) - draftScoreOf(a));
  const thirdPlaceScore = ranked.length >= 3 ? draftScoreOf(ranked[2]) : -Infinity;
  const topThree = new Set(ranked.filter((c) => draftScoreOf(c) >= thirdPlaceScore && draftScoreOf(c) > 0));

  const scoreChanges = activeContestants
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

      <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1">SCORE EVERY COUPLE</div>
        <p className="text-xs text-[#8A909B] mb-3">
          Enter each couple&apos;s score for the week — the top three (ties included) are ranked automatically below.
        </p>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {activeContestants.map((c) => {
            const inTop3 = topThree.has(c);
            return (
              <div
                key={c}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                  inTop3 ? "bg-[#EEF8F1] border-[#1E7B45]/40" : "bg-[#F8F9FB] border-[#EDEFF3]"
                }`}
              >
                <span className="flex-1 text-sm truncate">{c}</span>
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
          {activeContestants.length === 0 && (
            <p className="text-xs text-[#8A909B]">No active contestants — add some in League Templates.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E2E4E9] rounded-lg px-[18px] py-4">
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1">SONG PREDICTIONS</div>
        <p className="text-sm text-[#5B6270]">
          Not scored here — each league&apos;s commissioner checks their own members&apos; song predictions from
          their league page.
        </p>
      </div>

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
        <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2.5">COUPLE ELIMINATED</div>
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
        Each of these can only be set once — pick them whenever the real result is known. Members predicted the
        final four for +5 points each and the season winner once, before week one.
      </p>

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
    </div>
  );
}
