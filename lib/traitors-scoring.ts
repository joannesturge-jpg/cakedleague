// WEEKLY_TOP3 scoring for The Traitors (TRTRS). Each week's three picks
// have distinct, fixed roles — [0] a Traitor picked to survive, [1] a
// Faithful picked to survive, [2] a player predicted to go home — unlike
// DWTS's ranked top three or Survivor's unordered three, so scoring has
// to know which slot is which, not just "was this contestant picked."
//
// "Survives" / "eliminated" are the DEFAULT state for the survive-picks
// (true unless the week's admin-entered facts say otherwise), so a week
// with no admin input at all would otherwise look like every pick
// survived. To avoid that false positive, a week only gets scored once
// it has *some* admin-entered fact (a rule award or a votes-against
// score) for that week, for any contestant.
export type TraitorsWeeklyPick = { week: number; topThree: string[] };
export type TraitorsRuleAward = { week: number; contestant: string; ruleLabel: string };
export type TraitorsWeeklyScoreEntry = { week: number; contestant: string; score: number };
export type TraitorsAdjustment = { points: number; note: string };

export type TraitorsScoreLine = { label: string; points: number };
export type TraitorsScoreGroup = { key: string; title: string; total: number; lines: TraitorsScoreLine[] };

const WENT_HOME_LABEL = "Went home this week (banished or murdered)";
const SHIELD_LABEL = "Earns a shield";
const FIRST_TO_SPEAK_LABEL = "First to speak at the Round Table";
const VOTED_TRAITOR_LABEL = "Selected Faithful votes for a Traitor at Banishment";
const VOTED_TRAITOR_SUCCESS_LABEL = "Selected Faithful votes for a Traitor — Banishment successful";

export function breakdownTraitorsMember(params: {
  winnerPick: string | null;
  weeklyPicks: TraitorsWeeklyPick[];
  ruleAwards: TraitorsRuleAward[];
  weeklyScores: TraitorsWeeklyScoreEntry[];
  actualWinner: string | null;
  adjustments?: TraitorsAdjustment[];
}): TraitorsScoreGroup[] {
  const { winnerPick, weeklyPicks, ruleAwards, weeklyScores, actualWinner, adjustments = [] } = params;

  const groups: TraitorsScoreGroup[] = [];

  if (winnerPick && actualWinner && winnerPick === actualWinner) {
    groups.push({
      key: "season",
      title: "Season",
      total: 5,
      lines: [{ label: `Traitors vs Faithfuls prediction correct — ${winnerPick}`, points: 5 }],
    });
  }

  const awardsByWeek = new Map<number, TraitorsRuleAward[]>();
  for (const a of ruleAwards) {
    const list = awardsByWeek.get(a.week) ?? [];
    list.push(a);
    awardsByWeek.set(a.week, list);
  }
  const scoresByWeek = new Map<number, TraitorsWeeklyScoreEntry[]>();
  for (const s of weeklyScores) {
    const list = scoresByWeek.get(s.week) ?? [];
    list.push(s);
    scoresByWeek.set(s.week, list);
  }

  const sortedPicks = [...weeklyPicks].sort((a, b) => a.week - b.week);
  for (const pick of sortedPicks) {
    const weekAwards = awardsByWeek.get(pick.week) ?? [];
    const weekScores = scoresByWeek.get(pick.week) ?? [];
    const weekHasData = weekAwards.length > 0 || weekScores.length > 0;
    if (!weekHasData) continue;

    const wentHome = new Set(weekAwards.filter((a) => a.ruleLabel === WENT_HOME_LABEL).map((a) => a.contestant));
    const shielded = new Set(weekAwards.filter((a) => a.ruleLabel === SHIELD_LABEL).map((a) => a.contestant));
    const firstToSpeak = new Set(weekAwards.filter((a) => a.ruleLabel === FIRST_TO_SPEAK_LABEL).map((a) => a.contestant));
    const votedTraitor = new Set(weekAwards.filter((a) => a.ruleLabel === VOTED_TRAITOR_LABEL).map((a) => a.contestant));
    const votedTraitorSuccess = new Set(
      weekAwards.filter((a) => a.ruleLabel === VOTED_TRAITOR_SUCCESS_LABEL).map((a) => a.contestant)
    );
    const zeroVotes = new Set(weekScores.filter((s) => s.score === 0).map((s) => s.contestant));

    const [traitorPick, faithfulPick, predictedGoHome] = pick.topThree;
    const lines: TraitorsScoreLine[] = [];

    if (traitorPick) {
      if (wentHome.has(traitorPick)) {
        lines.push({ label: `Selected to survive — eliminated this episode — ${traitorPick}`, points: -5 });
      } else {
        lines.push({ label: `Selected to survive — survives the episode — ${traitorPick}`, points: 8 });
      }
    }
    if (faithfulPick) {
      if (wentHome.has(faithfulPick)) {
        lines.push({ label: `Selected to survive — eliminated this episode — ${faithfulPick}`, points: -5 });
      } else {
        lines.push({ label: `Selected to survive — survives the episode — ${faithfulPick}`, points: 8 });
      }
      if (votedTraitorSuccess.has(faithfulPick)) {
        lines.push({ label: `Voted for a Traitor — banishment successful — ${faithfulPick}`, points: 10 });
      } else if (votedTraitor.has(faithfulPick)) {
        lines.push({ label: `Voted for a Traitor at banishment — ${faithfulPick}`, points: 5 });
      }
    }
    if (predictedGoHome && wentHome.has(predictedGoHome)) {
      lines.push({ label: `Predicted player goes home — ${predictedGoHome}`, points: 8 });
    }

    for (const c of [traitorPick, faithfulPick, predictedGoHome]) {
      if (!c) continue;
      if (shielded.has(c)) lines.push({ label: `Earns a shield — ${c}`, points: 5 });
      if (firstToSpeak.has(c)) lines.push({ label: `First to speak at the Round Table — ${c}`, points: 3 });
      if (zeroVotes.has(c)) lines.push({ label: `Receives 0 votes at the Round Table — ${c}`, points: 5 });
    }

    const allThreeCorrect =
      !!traitorPick &&
      !!faithfulPick &&
      !!predictedGoHome &&
      !wentHome.has(traitorPick) &&
      !wentHome.has(faithfulPick) &&
      wentHome.has(predictedGoHome);
    if (allThreeCorrect) {
      lines.push({ label: "All three selections correct", points: 10 });
    }

    if (lines.length > 0) {
      groups.push({
        key: `week-${pick.week}`,
        title: `Week ${pick.week}`,
        total: lines.reduce((s, l) => s + l.points, 0),
        lines,
      });
    }
  }

  if (adjustments.length > 0) {
    groups.push({
      key: "adjustments",
      title: "Commissioner Adjustments",
      total: adjustments.reduce((s, a) => s + a.points, 0),
      lines: adjustments.map((a) => ({ label: a.note, points: a.points })),
    });
  }

  return groups;
}

export function scoreTraitorsMember(params: Parameters<typeof breakdownTraitorsMember>[0]): number {
  return breakdownTraitorsMember(params).reduce((sum, g) => sum + g.total, 0);
}
