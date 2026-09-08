import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLogin } from "./AdminLogin";
import { LogoutButton } from "@/app/components/LogoutButton";
import { AdminShell } from "./AdminShell";
import type { AdminAnalyticsData } from "./AdminAnalytics";

// [Sun, Mon, Tue, Wed, Thu, Fri, Sat] counts.
function byWeekday(dates: Date[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dates) counts[d.getDay()]++;
  return counts;
}

function inLastNDays(dates: Date[], n: number, offsetDays = 0) {
  const now = Date.now();
  const end = now - offsetDays * 24 * 60 * 60 * 1000;
  const start = end - n * 24 * 60 * 60 * 1000;
  return dates.filter((d) => d.getTime() > start && d.getTime() <= end).length;
}

export async function AdminDashboard() {
  // The admin dashboard is only reachable at admin.<domain> — never on the
  // main site, even if someone guesses the path. Local dev is exempt so you
  // don't need a real subdomain to work on it.
  const host = headers().get("host") || "";
  if (process.env.NODE_ENV === "production" && !host.startsWith("admin.")) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    return <AdminLogin />;
  }

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center">
        <h1 className="font-display text-3xl tracking-wide">ACCESS DENIED</h1>
        <p className="text-cream/60 max-w-sm">
          You&apos;re signed in as {user.email}, but this account doesn&apos;t have admin access.
        </p>
        <LogoutButton className="px-5 py-2.5 rounded-full text-sm font-semibold border border-cream/20 hover:border-cream transition" />
      </div>
    );
  }

  const [
    users,
    templates,
    notifySignups,
    publicLeagues,
    allLeagues,
    usersWhoCreatedLeague,
    usersActivated,
    usersWhoJoinedOthers,
    memberJoins,
    weeklyTop3MemberCount,
    weeklyPicksSubmitted,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isAdmin: true,
        isBlocked: true,
        _count: { select: { leagues: { where: { isActive: true, deletedAt: null } } } },
      },
    }),
    prisma.leagueTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: { rules: { orderBy: { order: "asc" } }, ruleAwards: true, weeklyScores: true },
    }),
    prisma.notifySignup.findMany({
      orderBy: { createdAt: "desc" },
      include: { template: { select: { name: true, glyph: true } } },
    }),
    prisma.league.findMany({
      where: { visibility: "PUBLIC", deletedAt: null },
      select: { id: true, templateId: true },
    }),
    prisma.league.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tag: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        visibility: true,
        templateId: true,
        _count: { select: { members: true } },
      },
    }),
    // Activation funnel — every league owner is also auto-added as a member
    // of their own league, so "created" is always a subset of "has a
    // membership." usersWhoJoinedOthers isolates memberships that aren't
    // just someone's own league.
    prisma.user.count({ where: { leagues: { some: { deletedAt: null } } } }),
    prisma.user.count({ where: { memberships: { some: {} } } }),
    prisma.user.count({ where: { memberships: { some: { role: { not: "OWNER" } } } } }),
    prisma.leagueMember.findMany({ select: { joinedAt: true } }),
    prisma.leagueMember.count({ where: { league: { deletedAt: null, template: { pickFormat: "WEEKLY_TOP3" } } } }),
    prisma.leagueMemberWeeklyPick.count({
      where: { member: { league: { deletedAt: null, template: { pickFormat: "WEEKLY_TOP3" } } } },
    }),
  ]);

  const publicLeagueByTemplate: Record<string, string> = {};
  for (const l of publicLeagues) {
    if (l.templateId) publicLeagueByTemplate[l.templateId] = l.id;
  }

  const nonDeletedLeagues = allLeagues.filter((l) => !l.deletedAt);
  const notifyEmailSet = new Set(notifySignups.map((s) => s.email.toLowerCase()));
  const notifySignupConverted = users.filter((u) => notifyEmailSet.has(u.email.toLowerCase())).length;
  const uniqueNotifyEmails = notifyEmailSet.size;

  const templateNameById = new Map(templates.map((t) => [t.id, t.name]));
  const leaguesByTemplate = new Map<string, number>();
  for (const l of nonDeletedLeagues) {
    if (l.templateId) leaguesByTemplate.set(l.templateId, (leaguesByTemplate.get(l.templateId) ?? 0) + 1);
  }
  const topTemplates = Array.from(leaguesByTemplate.entries())
    .map(([templateId, count]) => ({ name: templateNameById.get(templateId) ?? "Custom", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalMembers = nonDeletedLeagues.reduce((sum, l) => sum + l._count.members, 0);

  const userCreatedAts = users.map((u) => u.createdAt);
  const leagueCreatedAts = allLeagues.map((l) => l.createdAt);
  const memberJoinedAts = memberJoins.map((m) => m.joinedAt);

  const analytics: AdminAnalyticsData = {
    totalUsers: users.length,
    usersWhoCreatedLeague,
    usersWhoJoinedOthers,
    usersActivated,
    signupsByWeekday: byWeekday(userCreatedAts),
    leagueCreationsByWeekday: byWeekday(leagueCreatedAts),
    joinsByWeekday: byWeekday(memberJoinedAts),
    signupsThisWeek: inLastNDays(userCreatedAts, 7),
    signupsLastWeek: inLastNDays(userCreatedAts, 7, 7),
    leaguesThisWeek: inLastNDays(leagueCreatedAts, 7),
    leaguesLastWeek: inLastNDays(leagueCreatedAts, 7, 7),
    notifySignupTotal: uniqueNotifyEmails,
    notifySignupConverted,
    totalLeaguesCreated: allLeagues.length,
    activeLeagues: nonDeletedLeagues.filter((l) => l.isActive).length,
    inactiveLeagues: nonDeletedLeagues.filter((l) => !l.isActive).length,
    deletedLeagues: allLeagues.length - nonDeletedLeagues.length,
    publicLeagues: nonDeletedLeagues.filter((l) => l.visibility === "PUBLIC").length,
    privateLeagues: nonDeletedLeagues.filter((l) => l.visibility === "PRIVATE").length,
    avgMembersPerLeague: nonDeletedLeagues.length ? totalMembers / nonDeletedLeagues.length : 0,
    topTemplates,
    weeklyTop3MemberCount,
    weeklyPicksSubmitted,
  };

  return (
    <AdminShell
      adminEmail={user.email}
      users={users}
      templates={templates}
      notifySignups={notifySignups}
      publicLeagueByTemplate={publicLeagueByTemplate}
      leagues={allLeagues}
      analytics={analytics}
    />
  );
}
