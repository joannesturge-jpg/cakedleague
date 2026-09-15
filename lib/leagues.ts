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
