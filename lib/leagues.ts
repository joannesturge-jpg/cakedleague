import { randomBytes } from "node:crypto";

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

export function generateInviteCode() {
  return randomBytes(6).toString("hex");
}

export function formatDueDate(dueDay: string, dueTime: string) {
  const day = dueDay.charAt(0) + dueDay.slice(1).toLowerCase();
  const [h, m] = dueTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${day}s at ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatMoney(cents: number) {
  return `$${cents.toLocaleString()}`;
}
