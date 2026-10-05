// WEEKLY_CATEGORIES scoring (Bake Off). Points, per Joanne's house rules:
// +5 correct Star Baker pick, +3 correct technical winner, +3 correct
// voted off, +10 bonus on top if all three are correct, -5 if your Star
// Baker pick gets voted off, -3 if your voted off pick was actually Star
// Baker, +2 if any of your three picks came last in the technical, +5 for
// each Hollywood handshake earned by any of your three picks. Week 1 is
// collected but never scored — nothing's happened in the show yet.
export type CategoryPick = {
  week: number;
  starBakerPick: string | null;
  technicalPick: string | null;
  votedOffPick: string | null;
};

export type WeeklyResult = {
  week: number;
  actualStarBaker: string | null;
  actualTechnicalWinner: string | null;
  actualVotedOff: string | null;
  actualTechnicalLoser: string | null;
  handshakes: Record<string, number>;
};

export function isCategoryWeekScored(week: number) {
  return week > 1;
}

export type CategoryScoreLine = { label: string; points: number };
export type CategoryScoreGroup = { key: string; title: string; total: number; lines: CategoryScoreLine[] };

export function breakdownCategoryMember(params: {
  picks: CategoryPick[];
  results: WeeklyResult[];
  adjustments?: { points: number; note: string }[];
}): CategoryScoreGroup[] {
  const { picks, results, adjustments = [] } = params;
  const resultByWeek = new Map(results.map((r) => [r.week, r]));
  const groups: CategoryScoreGroup[] = [];

  const sortedPicks = [...picks].sort((a, b) => a.week - b.week);
  for (const pick of sortedPicks) {
    if (!isCategoryWeekScored(pick.week)) continue;
    const result = resultByWeek.get(pick.week);
    if (!result) continue;

    const lines: CategoryScoreLine[] = [];
    let correctCount = 0;

    if (pick.starBakerPick && pick.starBakerPick === result.actualStarBaker) {
      lines.push({ label: `Correct Star Baker pick — ${pick.starBakerPick}`, points: 5 });
      correctCount++;
    }
    if (pick.technicalPick && pick.technicalPick === result.actualTechnicalWinner) {
      lines.push({ label: `Correct technical winner pick — ${pick.technicalPick}`, points: 3 });
      correctCount++;
    }
    if (pick.votedOffPick && pick.votedOffPick === result.actualVotedOff) {
      lines.push({ label: `Correct voted off pick — ${pick.votedOffPick}`, points: 3 });
      correctCount++;
    }
    if (correctCount === 3) {
      lines.push({ label: "All three picks correct", points: 10 });
    }

    if (pick.starBakerPick && pick.starBakerPick === result.actualVotedOff) {
      lines.push({ label: `Star Baker pick was voted off — ${pick.starBakerPick}`, points: -5 });
    }
    if (pick.votedOffPick && pick.votedOffPick === result.actualStarBaker) {
      lines.push({ label: `Voted off pick was actually Star Baker — ${pick.votedOffPick}`, points: -3 });
    }

    const picksSet = new Set(
      [pick.starBakerPick, pick.technicalPick, pick.votedOffPick].filter((c): c is string => !!c)
    );
    if (result.actualTechnicalLoser && picksSet.has(result.actualTechnicalLoser)) {
      lines.push({ label: `Pick came last in the technical — ${result.actualTechnicalLoser}`, points: 2 });
    }
    for (const name of picksSet) {
      const count = result.handshakes[name] ?? 0;
      if (count > 0) {
        lines.push({ label: `Hollywood handshake${count > 1 ? ` x${count}` : ""} — ${name}`, points: 5 * count });
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
