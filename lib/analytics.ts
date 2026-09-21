// Turns raw PageView rows into the numbers the admin Analytics tab shows.
// Nothing here is stored — sessions and their duration are derived at
// query time by grouping one visitor's page loads together whenever the
// gap between them is under 30 minutes.
import { isWeekOpen } from "./leagues";

const SESSION_GAP_MS = 30 * 60 * 1000;

export type PageViewRow = { visitorId: string; path: string; createdAt: Date };

// One entry per calendar day (UTC) over the trailing `days` days, oldest
// first, padded with zero for days with no visits — so a chart line
// doesn't just stop on quiet days.
export function computeDailyVisitors(views: PageViewRow[], days: number, now: Date = new Date()) {
  const byDay = new Map<string, Set<string>>();
  for (const v of views) {
    const key = v.createdAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, new Set());
    byDay.get(key)!.add(v.visitorId);
  }
  const result: { date: string; visitors: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, visitors: byDay.get(key)?.size ?? 0 });
  }
  return result;
}

export function computeSessionStats(views: PageViewRow[]) {
  const byVisitor = new Map<string, PageViewRow[]>();
  for (const v of views) {
    if (!byVisitor.has(v.visitorId)) byVisitor.set(v.visitorId, []);
    byVisitor.get(v.visitorId)!.push(v);
  }

  let totalMs = 0;
  for (const rows of byVisitor.values()) {
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let sessionStart = rows[0].createdAt.getTime();
    let last = sessionStart;
    for (let i = 1; i <= rows.length; i++) {
      const cur = rows[i]?.createdAt.getTime();
      if (cur === undefined || cur - last > SESSION_GAP_MS) {
        totalMs += last - sessionStart;
        if (cur !== undefined) sessionStart = cur;
      }
      if (cur !== undefined) last = cur;
    }
  }

  const uniqueVisitors = byVisitor.size;
  return {
    uniqueVisitors,
    totalHours: totalMs / (1000 * 60 * 60),
    avgMinutesPerVisitor: uniqueVisitors ? totalMs / (1000 * 60) / uniqueVisitors : 0,
  };
}

export type DwtsSubmissionLeague = {
  templateId: string | null;
  dueDay: string;
  dueTime: string;
  timezone: string;
  startDate: Date | null;
  weeks: number | null;
  members: { weeklyPicks: { week: number; topThree: string[] }[] }[];
};

// For each week that's opened in at least one DWTS-format (WEEKLY_TOP3)
// league, how many of the members eligible to pick that week — their
// league's window for it has actually opened — have a submitted top
// three. A league whose week N hasn't opened yet doesn't count its
// members in that week's denominator; not eligible yet isn't the same
// as having skipped it.
export function computeDwtsPickSubmission(leagues: DwtsSubmissionLeague[], now: Date = new Date()) {
  const maxWeek = leagues.reduce((max, l) => Math.max(max, l.weeks ?? 11), 0);
  const result: { week: number; submitted: number; eligible: number; percent: number }[] = [];

  for (let week = 1; week <= maxWeek; week++) {
    let submitted = 0;
    let eligible = 0;
    for (const league of leagues) {
      if (week > (league.weeks ?? 11)) continue;
      if (!isWeekOpen(week, league.templateId, league.dueDay, league.dueTime, league.timezone, league.startDate, now)) continue;
      for (const m of league.members) {
        eligible++;
        const pick = m.weeklyPicks.find((p) => p.week === week);
        if (pick && pick.topThree.length > 0) submitted++;
      }
    }
    if (eligible > 0) result.push({ week, submitted, eligible, percent: (submitted / eligible) * 100 });
  }

  return result;
}

export function computePageTraffic(views: PageViewRow[], limit = 15) {
  const counts = new Map<string, number>();
  for (const v of views) counts.set(v.path, (counts.get(v.path) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}
