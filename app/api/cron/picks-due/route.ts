import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPicksDueReminderEmail } from "@/lib/email";
import { formatNextDueDate } from "@/lib/leagues";

// Runs once daily (see vercel.json) around 9am ET — Vercel's free plan only
// allows a cron to run once a day, so this can't hit the exact hour of
// "24 hours before" for every league's own due time. Instead it sends the
// reminder the calendar day before a league's due day, which lands within
// about a day of the deadline for members who opted in, both at the account
// level (User.notifyPicksDue) and for this specific league
// (LeagueMember.notifyPicksDue).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrow = tomorrowDate
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" })
    .toUpperCase();

  const leaguesMatchingDay = await prisma.league.findMany({
    where: { dueDay: tomorrow, deletedAt: null },
    include: {
      members: {
        where: { notifyPicksDue: true },
        include: { user: { select: { id: true, email: true, notifyPicksDue: true } } },
      },
    },
  });

  // Skip a league whose season hasn't actually started yet — dueDay alone
  // would otherwise fire reminders for a recurring weekday before the show
  // has aired a single episode.
  const leagues = leaguesMatchingDay.filter(
    (l) => !l.startDate || l.startDate.getTime() <= tomorrowDate.getTime()
  );

  const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;
  const now = Date.now();
  let emailsSent = 0;

  for (const league of leagues) {
    if (league.lastPicksReminderSentAt && now - league.lastPicksReminderSentAt.getTime() < TWENTY_HOURS_MS) {
      continue;
    }

    const recipients = league.members.filter((m) => m.user.notifyPicksDue);
    const dueLabel = formatNextDueDate(league.dueDay, league.dueTime, league.timezone, new Date(), league.startDate);

    await Promise.all(
      recipients.map((m) => sendPicksDueReminderEmail(m.user.email, m.user.id, dueLabel))
    );

    await prisma.league.update({ where: { id: league.id }, data: { lastPicksReminderSentAt: new Date() } });
    emailsSent += recipients.length;
  }

  return NextResponse.json({ ok: true, leaguesChecked: leagues.length, emailsSent });
}
