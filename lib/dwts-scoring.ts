// WEEKLY_TOP3 scoring (DWTS). Covers the weekly top-three prediction, song
// predictions, the season winner pick, the final four pre-season
// prediction, and the injured/falls bonus rules. Point values come from
// the league's own rules (a commissioner may have customized them),
// matched by label the same way the admin scoring screen classifies
// rules.
//
// Song predictions have no stored "actual song" to check picks against,
// so they're the one thing in this engine that isn't derived from an
// admin-entered answer key — a commissioner marks a member's guess
// correct themselves (LeagueMemberWeeklyPick.songCorrect), and once set,
// scores automatically like everything else here.
//
// Injured/falls attribution: the admin marks a couple injured/fallen for
// a given week (a template-wide fact, same as an actual top-three
// result). A member only gets that bonus/penalty if that couple was in
// *their own* top-three pick for that same week — nothing else ties a
// couple to a member in this pick format.
export type DwtsWeeklyScoreEntry = { week: number; contestant: string; score: number };
export type DwtsWeeklyPick = { week: number; topThree: string[]; songCorrect?: boolean };
export type DwtsRule = { label: string; points: number };
export type DwtsRuleAward = { week: number; contestant: string; ruleLabel: string };

function pointsForLabel(rules: DwtsRule[], pattern: RegExp, fallback: number) {
  const match = rules.find((r) => pattern.test(r.label));
  return match ? match.points : fallback;
}

// The top three contestants for a week (ties included at the cutoff) —
// same derivation the admin scoring screen uses to highlight "TOP 3".
export function actualTopThree(scoresThisWeek: DwtsWeeklyScoreEntry[]): Set<string> {
  const ranked = [...scoresThisWeek].sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return new Set();
  const thirdScore = ranked.length >= 3 ? ranked[2].score : -Infinity;
  return new Set(ranked.filter((s) => s.score > 0 && s.score >= thirdScore).map((s) => s.contestant));
}

// The top three's couples grouped by tied score, in descending order —
// e.g. two couples tied at 21 points share the first group (positions
// 1-2), a couple at 20 alone forms the next (position 3). A tie means
// either order within that group counts for the exact-order bonus, so
// this only pins down which *group* each position belongs to, not one
// canonical ranking. Returns null when a tie straddles the position-3
// cutoff (e.g. three couples tied for what would be positions 2-3-4) —
// there's no clean boundary to award the bonus against.
function topThreePositionGroups(scoresThisWeek: DwtsWeeklyScoreEntry[]): string[][] | null {
  const ranked = [...scoresThisWeek].filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const groups: string[][] = [];
  let total = 0;
  let i = 0;
  while (i < ranked.length && total < 3) {
    const score = ranked[i].score;
    const group: string[] = [];
    while (i < ranked.length && ranked[i].score === score) {
      group.push(ranked[i].contestant);
      i++;
    }
    if (group.length > 3 - total) return null;
    groups.push(group);
    total += group.length;
  }
  return total === 3 ? groups : null;
}

// A pick matches if each position group's couples land somewhere within
// that group's block of positions, in any order within the block.
function matchesPositionGroups(pick: string[], groups: string[][]): boolean {
  let idx = 0;
  for (const group of groups) {
    const slice = pick.slice(idx, idx + group.length);
    if (slice.length !== group.length || !group.every((name) => slice.includes(name))) return false;
    idx += group.length;
  }
  return true;
}

export function scoreWeeklyTopThree(
  pick: DwtsWeeklyPick | undefined,
  scoresThisWeek: DwtsWeeklyScoreEntry[],
  rules: DwtsRule[]
): number {
  if (!pick) return 0;
  const correctPoints = pointsForLabel(rules, /each correct couple/i, 10);
  const exactOrderPoints = pointsForLabel(rules, /exact order/i, 15);
  const songPoints = pointsForLabel(rules, /song/i, 10);

  const top3 = actualTopThree(scoresThisWeek);
  const correct = pick.topThree.filter((c) => c && top3.has(c)).length;
  let points = correct * correctPoints;

  const groups = topThreePositionGroups(scoresThisWeek);
  if (groups && matchesPositionGroups(pick.topThree, groups)) {
    points += exactOrderPoints;
  }

  if (pick.songCorrect) points += songPoints;

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

export function scoreWeeklyBonusAwards(
  weeklyPicks: DwtsWeeklyPick[],
  awards: DwtsRuleAward[],
  rules: DwtsRule[]
): number {
  const injuredPattern = /injured/i;
  const fallsPattern = /falls/i;
  let total = 0;
  for (const award of awards) {
    const isInjured = injuredPattern.test(award.ruleLabel);
    const isFalls = !isInjured && fallsPattern.test(award.ruleLabel);
    if (!isInjured && !isFalls) continue;

    const pick = weeklyPicks.find((p) => p.week === award.week);
    if (!pick || !pick.topThree.includes(award.contestant)) continue;

    total += isInjured ? pointsForLabel(rules, injuredPattern, 5) : pointsForLabel(rules, fallsPattern, -5);
  }
  return total;
}

export function scoreDwtsMember(params: {
  winnerPick: string | null;
  finalFourPicks: string[];
  weeklyPicks: DwtsWeeklyPick[];
  weeklyScores: DwtsWeeklyScoreEntry[];
  ruleAwards: DwtsRuleAward[];
  actualWinner: string | null;
  actualFinalFour: string[];
  eliminatedContestants: string[];
  rules: DwtsRule[];
}): number {
  const {
    winnerPick,
    finalFourPicks,
    weeklyPicks,
    weeklyScores,
    ruleAwards,
    actualWinner,
    actualFinalFour,
    eliminatedContestants,
    rules,
  } = params;

  let total = scoreSeasonWinner(winnerPick, actualWinner, eliminatedContestants, rules);
  total += scoreFinalFour(finalFourPicks, actualFinalFour);
  total += scoreWeeklyBonusAwards(weeklyPicks, ruleAwards, rules);

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
