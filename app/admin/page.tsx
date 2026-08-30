import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLogin } from "./AdminLogin";
import { LogoutButton } from "@/app/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { leagues: { where: { isActive: true } } } },
    },
  });

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl tracking-wide">ADMIN</h1>
          <p className="text-cream/55 text-sm mt-1">
            {users.length} {users.length === 1 ? "account" : "accounts"}
          </p>
        </div>
        <LogoutButton className="px-4 py-2 rounded-full text-sm font-semibold border border-cream/20 hover:border-cream transition" />
      </div>

      <div className="bg-card border border-cream/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-cream/45 text-xs uppercase tracking-widest border-b border-cream/10">
              <th className="px-5 py-3.5 font-bold">Name</th>
              <th className="px-5 py-3.5 font-bold">Email</th>
              <th className="px-5 py-3.5 font-bold">Active leagues</th>
              <th className="px-5 py-3.5 font-bold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-cream/5 last:border-0">
                <td className="px-5 py-3.5 font-medium">{u.name}</td>
                <td className="px-5 py-3.5 text-cream/70">{u.email}</td>
                <td className="px-5 py-3.5">{u._count.leagues}</td>
                <td className="px-5 py-3.5 text-cream/55">
                  {u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-cream/45">
                  No signups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
