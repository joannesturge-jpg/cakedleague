export const DUE_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export const DUE_DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

// IANA zone stored on the league; the short label is what members see next
// to a due date/time so it's unambiguous which zone the commissioner meant.
export const TIMEZONES = [
  { id: "America/Los_Angeles", label: "Pacific", abbr: "PT" },
  { id: "America/Denver", label: "Mountain", abbr: "MT" },
  { id: "America/Chicago", label: "Central", abbr: "CT" },
  { id: "America/New_York", label: "Eastern", abbr: "ET" },
] as const;

export const TIMEZONE_ABBR: Record<string, string> = Object.fromEntries(
  TIMEZONES.map((t) => [t.id, t.abbr])
);

export const DEFAULT_TIMEZONE = "America/Los_Angeles";

export const DRAFT_MODES = [
  { id: "SNAKE", name: "Snake draft", desc: "Pick order reverses each round so everyone gets a fair shot at the best picks." },
  { id: "AUCTION", name: "Auction", desc: "Everyone gets a budget and bids on who they want." },
  { id: "FREE_FOR_ALL", name: "Free-for-all", desc: "First come, first served — no set draft order." },
  { id: "AI", name: "Describe it", desc: "Tell us how it should work in your own words." },
] as const;

export const DRAFT_MODE_LABELS: Record<string, string> = Object.fromEntries(
  DRAFT_MODES.map((d) => [d.id, d.name])
);

export const PAY_METHODS = ["Venmo", "PayPal", "Cash App", "Other"] as const;

export const LEAGUE_EMOJIS = [
  "🎬", "🍰", "💃", "🏆", "🎭", "🎤", "🎸", "🕺",
  "👑", "🔥", "🎯", "🎪", "🎨", "🍿", "🎲", "🥇",
  "🌟", "💰", "🎉", "🏅", "⚡", "🎧", "📺", "🎢",
];

export function formatDueDate(dueDay: string, dueTime: string) {
  const day = dueDay.charAt(0) + dueDay.slice(1).toLowerCase();
  const [h, m] = dueTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${day}s at ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

// Wall-clock calendar/time in a given IANA zone for some instant — needed
// because the server runs in UTC, but a due day/time is meant in whatever
// zone the commissioner picked for their league.
function zonedParts(instant: Date, timezone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // hour12:false renders midnight as "24" in some locales/environments.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

// A pure calendar date (no time-of-day) as UTC midnight — lets day
// arithmetic and weekday lookups skip DST entirely, and formatting it with
// timeZone: "UTC" keeps the runtime's own local zone from reinterpreting
// (and shifting) the date.
function calendarDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

// The next real calendar date+time picks are due, in the league's own
// zone — always strictly in the future. If today is the due day, this
// only rolls to next week when the due time has already passed today; a
// due time still later today is the very next occurrence, not next
// week's.
//
// notBefore (a league's startDate) keeps this from landing on a Thursday
// before the season has actually started — e.g. a show premiering Sep 25
// shouldn't show "picks due" this coming Thursday if that Thursday is
// still in August. Keeps advancing a week at a time until it's on or
// after that date.
export function nextDueDate(
  dueDay: string,
  dueTime: string,
  timezone: string,
  from: Date = new Date(),
  notBefore?: Date | null
) {
  const targetDay = WEEKDAY_INDEX[dueDay];
  if (targetDay === undefined) return null;
  const [dueH, dueM] = dueTime.split(":").map(Number);

  const now = zonedParts(from, timezone);
  const today = calendarDate(now.year, now.month, now.day);

  let diff = (targetDay - today.getUTCDay() + 7) % 7;
  if (diff === 0 && (now.hour > dueH || (now.hour === dueH && now.minute >= dueM))) {
    diff = 7;
  }

  const result = new Date(today);
  result.setUTCDate(today.getUTCDate() + diff);

  if (notBefore) {
    const start = zonedParts(notBefore, timezone);
    const startDay = calendarDate(start.year, start.month, start.day);
    while (result.getTime() < startDay.getTime()) {
      result.setUTCDate(result.getUTCDate() + 7);
    }
  }

  return result;
}

// Like formatDueDate, but as a concrete upcoming date ("Tuesday, Sep 15 at
// 8:00 PM") instead of a generic recurring label — so the one day a week
// this actually matches "today" doesn't read as "due right now."
export function formatNextDueDate(
  dueDay: string,
  dueTime: string,
  timezone: string,
  from: Date = new Date(),
  notBefore?: Date | null
) {
  const date = nextDueDate(dueDay, dueTime, timezone, from, notBefore);
  if (!date) return formatDueDate(dueDay, dueTime);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const [h, m] = dueTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${weekday}, ${month} ${date.getUTCDate()} at ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// Real UTC instant for a wall-clock time in a given IANA zone — needed to
// compare "picks open at" against the current moment, not just a calendar
// date. Converges in one pass for the zones this app supports (no
// half-hour-offset or DST-transition edge cases to worry about here).
function zonedInstant(year: number, month: number, day: number, hour: number, minute: number, timezone: string) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const got = zonedParts(guess, timezone);
  const wantedUTC = Date.UTC(year, month - 1, day, hour, minute);
  const gotAsUTC = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
  return new Date(guess.getTime() + (wantedUTC - gotAsUTC));
}

const WEEKDAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function dayAfter(day: string) {
  const idx = WEEKDAY_INDEX[day];
  return idx === undefined ? day : WEEKDAY_NAMES[(idx + 1) % 7];
}

// The calendar date (UTC-midnight representation, no time-of-day) that
// week N's picks are due, anchored to the league's startDate. Week 1 is
// whatever due day/time falls on or after startDate; each week after that
// is exactly 7 days later.
function weekDueCalendarDate(week: number, dueDay: string, dueTime: string, timezone: string, startDate: Date | null) {
  if (!startDate) return null;
  const anchor = nextDueDate(dueDay, dueTime, timezone, startDate, startDate);
  if (!anchor) return null;
  const result = new Date(anchor);
  result.setUTCDate(result.getUTCDate() + (week - 1) * 7);
  return result;
}

// One-time schedule exceptions where a specific week's picks open later
// than the usual "day after due day" default — e.g. a multi-night
// premiere means results aren't final in time for the normal open day.
// Keyed by template id, then week number.
const PICK_OPEN_EXCEPTIONS: Record<string, Record<number, { day: string; time: string }>> = {
  tpl_dwts: { 2: { day: "THURSDAY", time: "00:00" } },
};

// The real instant week N's picks open — the day after the previous
// week's due day, at midnight in the league's zone, unless overridden
// above. Week 1 (and leagues with no startDate to anchor against) are
// always open — there's no "previous week" to wait on.
export function weekOpenInstant(
  week: number,
  templateId: string | null | undefined,
  dueDay: string,
  dueTime: string,
  timezone: string,
  startDate: Date | null
): Date | null {
  if (week <= 1 || !startDate) return null;
  const prevDue = weekDueCalendarDate(week - 1, dueDay, dueTime, timezone, startDate);
  if (!prevDue) return null;

  const override = templateId ? PICK_OPEN_EXCEPTIONS[templateId]?.[week] : undefined;
  const openDay = override?.day ?? dayAfter(dueDay);
  const openTime = override?.time ?? "00:00";

  const targetIdx = WEEKDAY_INDEX[openDay];
  let diff = (targetIdx - prevDue.getUTCDay() + 7) % 7;
  if (diff === 0) diff = 7;
  const openCalendar = new Date(prevDue);
  openCalendar.setUTCDate(prevDue.getUTCDate() + diff);

  const [h, m] = openTime.split(":").map(Number);
  return zonedInstant(openCalendar.getUTCFullYear(), openCalendar.getUTCMonth() + 1, openCalendar.getUTCDate(), h, m, timezone);
}

export function isWeekOpen(
  week: number,
  templateId: string | null | undefined,
  dueDay: string,
  dueTime: string,
  timezone: string,
  startDate: Date | null,
  now: Date = new Date()
): boolean {
  const openAt = weekOpenInstant(week, templateId, dueDay, dueTime, timezone, startDate);
  if (!openAt) return true;
  return now.getTime() >= openAt.getTime();
}

// The real instant week N's picks are due — the other end of the window
// from weekOpenInstant. Leagues with no startDate to anchor week numbers
// against can't say when any given week's deadline is, so those default
// to never-passed rather than guessing.
export function weekDueInstant(
  week: number,
  dueDay: string,
  dueTime: string,
  timezone: string,
  startDate: Date | null
): Date | null {
  const dueCalendar = weekDueCalendarDate(week, dueDay, dueTime, timezone, startDate);
  if (!dueCalendar) return null;
  const [h, m] = dueTime.split(":").map(Number);
  return zonedInstant(dueCalendar.getUTCFullYear(), dueCalendar.getUTCMonth() + 1, dueCalendar.getUTCDate(), h, m, timezone);
}

export function isWeekDuePassed(
  week: number,
  dueDay: string,
  dueTime: string,
  timezone: string,
  startDate: Date | null,
  now: Date = new Date()
): boolean {
  const dueAt = weekDueInstant(week, dueDay, dueTime, timezone, startDate);
  if (!dueAt) return false;
  return now.getTime() > dueAt.getTime();
}

// Formats an arbitrary instant (like a picks-open time) as a concrete date
// in the given zone — same style as formatNextDueDate.
export function formatOpenDate(instant: Date, timezone: string) {
  const parts = zonedParts(instant, timezone);
  const cal = calendarDate(parts.year, parts.month, parts.day);
  const weekday = cal.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = cal.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const period = parts.hour >= 12 ? "PM" : "AM";
  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  return `${weekday}, ${month} ${cal.getUTCDate()} at ${hour12}:${String(parts.minute).padStart(2, "0")} ${period}`;
}

export function formatMoney(cents: number) {
  return `$${cents.toLocaleString()}`;
}

// One-time cutoff for DWTS's pre-season predictions (season winner + final
// four): 5:00 PM Pacific on Sept 15, 2026. Pacific is on daylight time
// (UTC-7) that week, hence the 00:00 UTC-next-day timestamp. Not a
// recurring due date, so it's just hardcoded here rather than modeled.
export const SEASON_PREDICTIONS_LOCK_AT = "2026-09-16T00:00:00.000Z";

export function isSeasonPredictionsLocked() {
  return Date.now() >= new Date(SEASON_PREDICTIONS_LOCK_AT).getTime();
}

// Same idea, but for Survivor's pre-season top-four pick: 5:00 PM Pacific
// on Sept 30, 2026 — a different one-time cutoff from DWTS's, so it can't
// share SEASON_PREDICTIONS_LOCK_AT.
export const SURVIVOR_TOP_FOUR_LOCK_AT = "2026-10-01T00:00:00.000Z";

export function isSurvivorTopFourLocked() {
  return Date.now() >= new Date(SURVIVOR_TOP_FOUR_LOCK_AT).getTime();
}
