import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateLeagueWizard } from "./CreateLeagueWizard";

export const dynamic = "force-dynamic";

export default async function NewLeaguePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const templates = await prisma.leagueTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { rules: { orderBy: { order: "asc" } } },
  });

  return <CreateLeagueWizard templates={templates} />;
}
