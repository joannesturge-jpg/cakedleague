// WEEKLY_TOP3 scoring (DWTS). Covers what's unambiguously derivable from
// stored data: the weekly top-three prediction, the season winner pick,
// and the final four pre-season prediction. Point values come from the
// league's own rules (a commissioner may have customized them), matched
// by label the same way the admin scoring screen classifies rules.
//
// Two seeded rules are deliberately left out of this calculation:
// "Weekly song prediction is correct" (already documented as scored
// manually by each commissioner from their league page) and the
// "Contestant injured/falls" bonuses (no unambiguous way to attribute
// those to a member in this pick format — nothing pins a couple to a
// member for a given week besides that week's top-three guess).
export type DwtsWeeklyScoreEntry = { week: number; contestant: string; score: number };
export type DwtsWeeklyPick = { week: number; topThree: string[] };
export type DwtsRule = { label: string; points: number };

function pointsForLabel(rules: DwtsRule[], pattern: RegExp, fallback: number) {
  const match = rules.find((r) => pattern.test(r.label));
  return match ? match.points : fallback;
}

// The top three contestants for a week (ties included at the cutoff) —
// same derivation the admin scoring screen uses to highlight "TOP 3".
function actualTopThree(scoresThisWeek: DwtsWeeklyScoreEntry[]): Set<string> {
  const ranked = [...scoresThisWeek].sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return new Set();
  const thirdScore = ranked.length >= 3 ? ranked[2].score : -Infinity;
  return new Set(ranked.filter((s) => s.score > 0 && s.score >= thirdScore).map((s) => s.contestant));
}

// A clean, tie-free 1st/2nd/3rd ranking — "exact order" only makes sense
// when there is one.
function strictTopThree(scoresThisWeek: DwtsWeeklyScoreEntry[]): string[] | null {
  const ranked = [...scoresThisWeek].filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (ranked.length < 3) return null;
  const [a, b, c, d] = ranked;
  if (a.score === b.score || b.score === c.score) return null;
  if (d && d.score === c.score) return null;
  return [a.contestant, b.contestant, c.contestant];
}

export function scoreWeeklyTopThree(
  pick: DwtsWeeklyPick | undefined,
  scoresThisWeek: DwtsWeeklyScoreEntry[],
  rules: DwtsRule[]
): number {
  if (!pick) return 0;
  const correctPoints = pointsForLabel(rules, /each correct couple/i, 10);
  const exactOrderPoints = pointsForLabel(rules, /exact order/i, 15);

  const top3 = actualTopThree(scoresThisWeek);
  const correct = pick.topThree.filter((c) => c && top3.has(c)).length;
  let points = correct * correctPoints;

  const strict = strictTopThree(scoresThisWeek);
  if (strict && pick.topThree[0] === strict[0] && pick.topThree[1] === strict[1] && pick.topThree[2] === strict[2]) {
    points += exactOrderPoints;
  }
  return points;
}

export function scoreSeasonWinner(
  pick: string | null,
  actualWinner: string | null,
  eliminatedContestants: string[],
  rules: DwtsRule[]
): number {
  if (!pick) return 0;
  if (actualWinner && pick === actualWinner) return pointsForLabel(rules, /winner pick is correct/i, 20);
  if (eliminatedContestants.includes(pick)) return pointsForLabel(rules, /winner pick is eliminated/i, -10);
  return 0;
}

// +5 per correct name — not a configurable LeagueRule, just the flat
// value documented on LeagueMember.finalFourPicks.
export function scoreFinalFour(picks: string[], actualFinalFour: string[]): number {
  if (actualFinalFour.length === 0) return 0;
  return picks.filter((c) => actualFinalFour.includes(c)).length * 5;
}

export function scoreDwtsMember(params: {
  winnerPick: string | null;
  finalFourPicks: string[];
  weeklyPicks: DwtsWeeklyPick[];
  weeklyScores: DwtsWeeklyScoreEntry[];
  actualWinner: string | null;
  actualFinalFour: string[];
  eliminatedContestants: string[];
  rules: DwtsRule[];
}): number {
  const { winnerPick, finalFourPicks, weeklyPicks, weeklyScores, actualWinner, actualFinalFour, eliminatedContestants, rules } = params;

  let total = scoreSeasonWinner(winnerPick, actualWinner, eliminatedContestants, rules);
  total += scoreFinalFour(finalFourPicks, actualFinalFour);

  const scoresByWeek = new Map<number, DwtsWeeklyScoreEntry[]>();
  for (const s of weeklyScores) {
    const list = scoresByWeek.get(s.week) ?? [];
    list.push(s);
    scoresByWeek.set(s.week, list);
  }
  for (const pick of weeklyPicks) {
    total += scoreWeeklyTopThree(pick, scoresByWeek.get(pick.week) ?? [], rules);
  }

  return total;
}
