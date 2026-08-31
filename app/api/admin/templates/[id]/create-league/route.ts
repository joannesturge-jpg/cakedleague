import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite";

// Creates the one official, public, join-by-anyone league for a template
// (e.g. the site's official Bake Off / DWTS league). Idempotent — if one
// already exists for this template, it's returned instead of duplicated.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const template = await prisma.leagueTemplate.findUnique({
    where: { id: params.id },
    include: { rules: { orderBy: { order: "asc" } } },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const existing = await prisma.league.findFirst({
    where: { templateId: template.id, visibility: "PUBLIC", deletedAt: null },
  });
  if (existing) return NextResponse.json({ id: existing.id });

  const league = await prisma.league.create({
    data: {
      name: template.name,
      glyph: template.glyph,
      description: template.description,
      visibility: "PUBLIC",
      inviteCode: generateInviteCode(),
      weeks: template.weeks,
      scoringPerWeek: template.scoringPerWeek,
      dueDay: template.dueDay,
      dueTime: "20:00",
      draftMode: template.draftMode,
      ownerId: admin.id,
      templateId: template.id,
      tag: template.tag,
      rules: {
        create: template.rules.map((r) => ({ label: r.label, points: r.points, order: r.order })),
      },
      members: { create: { userId: admin.id, role: "OWNER" } },
    },
  });

  return NextResponse.json({ id: league.id });
}
