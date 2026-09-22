// WEEKLY_TOP3 scoring for Survivor-tagged (SRVR) templates. Shares its
// data shape with DWTS (a pre-season top-four pick, then a weekly
// top-three pick) but not its scoring logic: DWTS derives points by
// ranking a week's numeric scores into an actual top three, while
// Survivor has no such ranking — every rule (immunity win, idol found,
// survives, eliminated, ...) is its own per-contestant event. A member
// just earns whatever's been awarded, that week, to whichever of their
// three picks it happened to.
export type SurvivorWeeklyPick = { week: number; topThree: string[] };
export type SurvivorRuleAward = { week: number; contestant: string; ruleLabel: string; points: number };
export type SurvivorAdjustment = { points: number; note: string };

export type SurvivorScoreLine = { label: string; points: number };
export type SurvivorScoreGroup = { key: string; title: string; total: number; lines: SurvivorScoreLine[] };

export function breakdownSurvivorMember(params: {
  finalFourPicks: string[];
  weeklyPicks: SurvivorWeeklyPick[];
  ruleAwards: SurvivorRuleAward[];
  actualFinalFour: string[];
  adjustments?: SurvivorAdjustment[];
}): SurvivorScoreGroup[] {
  const { finalFourPicks, weeklyPicks, ruleAwards, actualFinalFour, adjustments = [] } = params;

  const groups: SurvivorScoreGroup[] = [];

  const seasonLines: SurvivorScoreLine[] = [];
  for (const name of finalFourPicks) {
    if (actualFinalFour.includes(name)) seasonLines.push({ label: `Top four correct — ${name}`, points: 5 });
  }
  if (seasonLines.length > 0) {
    groups.push({ key: "season", title: "Season", total: seasonLines.reduce((s, l) => s + l.points, 0), lines: seasonLines });
  }

  const awardsByWeek = new Map<number, SurvivorRuleAward[]>();
  for (const a of ruleAwards) {
    const list = awardsByWeek.get(a.week) ?? [];
    list.push(a);
    awardsByWeek.set(a.week, list);
  }

  const sortedPicks = [...weeklyPicks].sort((a, b) => a.week - b.week);
  for (const pick of sortedPicks) {
    const lines: SurvivorScoreLine[] = [];
    for (const award of awardsByWeek.get(pick.week) ?? []) {
      if (pick.topThree.includes(award.contestant)) {
        lines.push({ label: `${award.ruleLabel} — ${award.contestant}`, points: award.points });
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

export function scoreSurvivorMember(params: Parameters<typeof breakdownSurvivorMember>[0]): number {
  return breakdownSurvivorMember(params).reduce((sum, g) => sum + g.total, 0);
}
