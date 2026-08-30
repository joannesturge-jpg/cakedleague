import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const leagues = await prisma.league.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-10 py-14 max-w-4xl mx-auto">
      <p className="font-script text-4xl text-pink leading-none mb-1">
        welcome back, {user.name.split(" ")[0].toLowerCase()}
      </p>
      <h1 className="font-display text-5xl tracking-wide mb-8">MY LEAGUES</h1>

      {leagues.length === 0 ? (
        <div className="bg-card border border-cream/10 rounded-2xl px-8 py-14 text-center">
          <p className="text-cream/60 mb-2">You don&apos;t have any leagues yet.</p>
          <p className="text-cream/40 text-sm">League creation is coming soon — check back shortly.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leagues.map((l) => (
            <div key={l.id} className="bg-card border border-cream/10 rounded-2xl px-6 py-5 flex items-center justify-between">
              <span className="font-display text-2xl tracking-wide">{l.name}</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  l.isActive ? "bg-pink/20 text-pink" : "bg-cream/10 text-cream/50"
                }`}
              >
                {l.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
