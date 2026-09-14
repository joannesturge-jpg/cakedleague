import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// WEEKLY_CATEGORIES templates (Bake Off): upserts one week's answer key —
// actual Star Baker/technical winner/voted off/technical loser, plus that
// week's handshake counts (name -> count, replacing what was there
// before — a baker can get more than one handshake in an episode).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const week = Math.round(Number(body.week));
  if (!Number.isFinite(week) || week < 1) {
    return NextResponse.json({ error: "Missing week" }, { status: 400 });
  }

  const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const actualStarBaker = clean(body.actualStarBaker);
  const actualTechnicalWinner = clean(body.actualTechnicalWinner);
  const actualVotedOff = clean(body.actualVotedOff);
  const actualTechnicalLoser = clean(body.actualTechnicalLoser);

  const handshakes: Record<string, number> =
    body.handshakes && typeof body.handshakes === "object" && !Array.isArray(body.handshakes)
      ? Object.fromEntries(
          Object.entries(body.handshakes as Record<string, unknown>)
            .map(([name, count]): [string, number] => [name, Math.max(0, Math.round(Number(count)) || 0)])
            .filter(([, count]) => count > 0)
        )
      : {};

  const result = await prisma.leagueTemplateWeeklyResult.upsert({
    where: { templateId_week: { templateId: params.id, week } },
    update: { actualStarBaker, actualTechnicalWinner, actualVotedOff, actualTechnicalLoser, handshakes },
    create: {
      templateId: params.id,
      week,
      actualStarBaker,
      actualTechnicalWinner,
      actualVotedOff,
      actualTechnicalLoser,
      handshakes,
    },
  });

  return NextResponse.json(result);
}
