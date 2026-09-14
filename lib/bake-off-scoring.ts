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

export function scoreCategoryWeek(pick: CategoryPick | undefined, result: WeeklyResult | undefined): number {
  if (!pick || !result || !isCategoryWeekScored(pick.week)) return 0;

  let points = 0;
  let correctCount = 0;

  if (pick.starBakerPick && pick.starBakerPick === result.actualStarBaker) {
    points += 5;
    correctCount++;
  }
  if (pick.technicalPick && pick.technicalPick === result.actualTechnicalWinner) {
    points += 3;
    correctCount++;
  }
  if (pick.votedOffPick && pick.votedOffPick === result.actualVotedOff) {
    points += 3;
    correctCount++;
  }
  if (correctCount === 3) points += 10;

  if (pick.starBakerPick && pick.starBakerPick === result.actualVotedOff) points -= 5;
  if (pick.votedOffPick && pick.votedOffPick === result.actualStarBaker) points -= 3;

  const picksSet = new Set(
    [pick.starBakerPick, pick.technicalPick, pick.votedOffPick].filter((c): c is string => !!c)
  );

  if (result.actualTechnicalLoser && picksSet.has(result.actualTechnicalLoser)) points += 2;

  for (const name of picksSet) {
    points += 5 * (result.handshakes[name] ?? 0);
  }

  return points;
}

export function scoreCategorySeason(picks: CategoryPick[], results: WeeklyResult[]): number {
  const resultByWeek = new Map(results.map((r) => [r.week, r]));
  return picks.reduce((total, pick) => total + scoreCategoryWeek(pick, resultByWeek.get(pick.week)), 0);
}
