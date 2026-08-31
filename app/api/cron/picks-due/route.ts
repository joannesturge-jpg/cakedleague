import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPicksDueReminderEmail } from "@/lib/email";
import { formatDueDate } from "@/lib/leagues";

// Runs once daily (see vercel.json) around 9am ET. Sends the "picks are due
// today" reminder to members who opted in, both at the account level
// (User.notifyPicksDue) and for this specific league (LeagueMember.notifyPicksDue).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" })
    .toUpperCase();

  const leagues = await prisma.league.findMany({
    where: { dueDay: today },
    include: {
      members: {
        where: { notifyPicksDue: true },
        include: { user: { select: { email: true, name: true, notifyPicksDue: true } } },
      },
    },
  });

  const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;
  const now = Date.now();
  let emailsSent = 0;

  for (const league of leagues) {
    if (league.lastPicksReminderSentAt && now - league.lastPicksReminderSentAt.getTime() < TWENTY_HOURS_MS) {
      continue;
    }

    const recipients = league.members.filter((m) => m.user.notifyPicksDue);
    const dueLabel = formatDueDate(league.dueDay, league.dueTime);

    await Promise.all(
      recipients.map((m) => sendPicksDueReminderEmail(m.user.email, m.user.name, league.name, dueLabel, league.id))
    );

    await prisma.league.update({ where: { id: league.id }, data: { lastPicksReminderSentAt: new Date() } });
    emailsSent += recipients.length;
  }

  return NextResponse.json({ ok: true, leaguesChecked: leagues.length, emailsSent });
}
