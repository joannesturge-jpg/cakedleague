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
export type DwtsWeeklyPick = { week: number; topThree: string[]; songPrediction?: string | null; songCorrect?: boolean };
export type DwtsRule = { label: string; points: number };
export type DwtsRuleAward = { week: number; contestant: string; ruleLabel: string };
export type DwtsAdjustment = { points: number; note: string };

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

const INJURED_PATTERN = /injured/i;
const FALLS_PATTERN = /falls/i;

export type DwtsScoreLine = { label: string; points: number };
export type DwtsScoreGroup = { key: string; title: string; total: number; lines: DwtsScoreLine[] };

// The itemized version of scoreDwtsMember — one group per week (plus a
// "Season" group for the winner pick and final four), each with the
// individual line items that added up to that group's total. This is the
// source of truth; scoreDwtsMember just sums it.
export function breakdownDwtsMember(params: {
  winnerPick: string | null;
  finalFourPicks: string[];
  weeklyPicks: DwtsWeeklyPick[];
  weeklyScores: DwtsWeeklyScoreEntry[];
  ruleAwards: DwtsRuleAward[];
  actualWinner: string | null;
  actualFinalFour: string[];
  eliminatedContestants: string[];
  rules: DwtsRule[];
  adjustments?: DwtsAdjustment[];
}): DwtsScoreGroup[] {
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
    adjustments = [],
  } = params;

  const groups: DwtsScoreGroup[] = [];

  const seasonLines: DwtsScoreLine[] = [];
  if (winnerPick && actualWinner && winnerPick === actualWinner) {
    seasonLines.push({ label: `Season winner pick correct — ${winnerPick}`, points: pointsForLabel(rules, /winner pick is correct/i, 20) });
  } else if (winnerPick && eliminatedContestants.includes(winnerPick)) {
    seasonLines.push({ label: `Season winner pick eliminated — ${winnerPick}`, points: pointsForLabel(rules, /winner pick is eliminated/i, -10) });
  }
  if (actualFinalFour.length > 0) {
    for (const name of finalFourPicks) {
      if (actualFinalFour.includes(name)) seasonLines.push({ label: `Final four correct — ${name}`, points: 5 });
    }
  }
  if (seasonLines.length > 0) {
    groups.push({ key: "season", title: "Season", total: seasonLines.reduce((s, l) => s + l.points, 0), lines: seasonLines });
  }

  const scoresByWeek = new Map<number, DwtsWeeklyScoreEntry[]>();
  for (const s of weeklyScores) {
    const list = scoresByWeek.get(s.week) ?? [];
    list.push(s);
    scoresByWeek.set(s.week, list);
  }
  const awardsByWeek = new Map<number, DwtsRuleAward[]>();
  for (const a of ruleAwards) {
    const list = awardsByWeek.get(a.week) ?? [];
    list.push(a);
    awardsByWeek.set(a.week, list);
  }

  const correctPoints = pointsForLabel(rules, /each correct couple/i, 10);
  const exactOrderPoints = pointsForLabel(rules, /exact order/i, 15);
  const songPoints = pointsForLabel(rules, /song/i, 10);

  const sortedPicks = [...weeklyPicks].sort((a, b) => a.week - b.week);
  for (const pick of sortedPicks) {
    const lines: DwtsScoreLine[] = [];
    const weekScores = scoresByWeek.get(pick.week) ?? [];

    const top3 = actualTopThree(weekScores);
    for (const c of pick.topThree) {
      if (c && top3.has(c)) lines.push({ label: `Correct couple in top three — ${c}`, points: correctPoints });
    }

    const groups3 = topThreePositionGroups(weekScores);
    if (groups3 && matchesPositionGroups(pick.topThree, groups3)) {
      lines.push({ label: "Top three in exact order", points: exactOrderPoints });
    }

    if (pick.songCorrect) {
      lines.push({
        label: pick.songPrediction ? `Song prediction correct — ${pick.songPrediction}` : "Song prediction correct",
        points: songPoints,
      });
    }

    for (const award of awardsByWeek.get(pick.week) ?? []) {
      if (!pick.topThree.includes(award.contestant)) continue;
      if (INJURED_PATTERN.test(award.ruleLabel)) {
        lines.push({ label: `Injured bonus — ${award.contestant}`, points: pointsForLabel(rules, INJURED_PATTERN, 5) });
      } else if (FALLS_PATTERN.test(award.ruleLabel)) {
        lines.push({ label: `Fall penalty — ${award.contestant}`, points: pointsForLabel(rules, FALLS_PATTERN, -5) });
      }
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

export function scoreDwtsMember(params: Parameters<typeof breakdownDwtsMember>[0]): number {
  return breakdownDwtsMember(params).reduce((sum, g) => sum + g.total, 0);
}
