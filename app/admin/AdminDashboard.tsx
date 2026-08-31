import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLogin } from "./AdminLogin";
import { LogoutButton } from "@/app/components/LogoutButton";
import { AdminShell } from "./AdminShell";

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

  const [users, templates, notifySignups] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isAdmin: true,
        isBlocked: true,
        _count: { select: { leagues: { where: { isActive: true } } } },
      },
    }),
    prisma.leagueTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: { rules: { orderBy: { order: "asc" } } },
    }),
    prisma.notifySignup.findMany({
      orderBy: { createdAt: "desc" },
      include: { template: { select: { name: true, glyph: true } } },
    }),
  ]);

  return <AdminShell adminEmail={user.email} users={users} templates={templates} notifySignups={notifySignups} />;
}
