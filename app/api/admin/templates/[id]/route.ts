import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.subject === "string") data.subject = body.subject.trim();
  if (typeof body.tag === "string") data.tag = body.tag.trim().toUpperCase() || null;
  if (typeof body.glyph === "string" && body.glyph) data.glyph = body.glyph;
  if (typeof body.weeks === "number") data.weeks = Math.max(1, Math.round(body.weeks));
  if (typeof body.scoringPerWeek === "number") data.scoringPerWeek = Math.max(1, Math.round(body.scoringPerWeek));
  if (typeof body.dueDay === "string") data.dueDay = body.dueDay;
  if (typeof body.draftMode === "string") data.draftMode = body.draftMode;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.description === "string") data.description = body.description;
  if (Array.isArray(body.contestants)) {
    data.contestants = body.contestants
      .filter((c: unknown): c is string => typeof c === "string" && c.trim().length > 0)
      .map((c: string) => c.trim());
  }
  if (Array.isArray(body.eliminatedContestants)) {
    data.eliminatedContestants = body.eliminatedContestants.filter((c: unknown): c is string => typeof c === "string");
  }
  if (typeof body.draftOpenDay === "string") data.draftOpenDay = body.draftOpenDay || null;
  if (typeof body.draftOpenTime === "string") data.draftOpenTime = body.draftOpenTime || null;

  const ops = [];

  if (Object.keys(data).length > 0) {
    ops.push(prisma.leagueTemplate.update({ where: { id: params.id }, data }));
  }

  if (Array.isArray(body.rules)) {
    const rules = body.rules
      .filter((r: unknown): r is { label: string; points: number } =>
        typeof r === "object" && r !== null && typeof (r as { label?: unknown }).label === "string"
      )
      .map((r: { label: string; points: number }, i: number) => ({
        label: r.label.trim(),
        points: Math.round(Number(r.points) || 0),
        order: i,
        templateId: params.id,
      }));

    ops.push(
      prisma.leagueTemplateRule.deleteMany({ where: { templateId: params.id } }),
      ...(rules.length ? [prisma.leagueTemplateRule.createMany({ data: rules })] : [])
    );
  }

  if (ops.length) await prisma.$transaction(ops);

  const template = await prisma.leagueTemplate.findUnique({
    where: { id: params.id },
    include: { rules: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(template);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await prisma.leagueTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
