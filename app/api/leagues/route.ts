import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite";
import { sendLeagueCreatedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "League needs a name" }, { status: 400 });
  }
  if (typeof body.dueDay !== "string" || typeof body.dueTime !== "string") {
    return NextResponse.json({ error: "Missing submission due date" }, { status: 400 });
  }
  if (typeof body.draftMode !== "string") {
    return NextResponse.json({ error: "Missing drafting mechanic" }, { status: 400 });
  }

  // Custom ("from scratch") leagues aren't available yet — every league
  // must be built off one of the active templates (Bake Off / DWTS).
  const template =
    typeof body.templateId === "string"
      ? await prisma.leagueTemplate.findFirst({ where: { id: body.templateId, isActive: true } })
      : null;
  if (!template) {
    return NextResponse.json({ error: "Pick a show template — custom leagues aren't available yet" }, { status: 400 });
  }

  const rules = Array.isArray(body.rules)
    ? body.rules
        .filter((r: unknown): r is { label: string; points: number } =>
          typeof r === "object" && r !== null && typeof (r as { label?: unknown }).label === "string"
        )
        .map((r: { label: string; points: number }, i: number) => ({
          label: r.label.trim(),
          points: Math.round(Number(r.points) || 0),
          order: i,
        }))
    : [];

  const league = await prisma.league.create({
    data: {
      name: body.name.trim(),
      glyph: typeof body.glyph === "string" && body.glyph ? body.glyph : "🎬",
      description: typeof body.description === "string" ? body.description.trim() : null,
      // Public leagues aren't launched yet — every league is created private.
      visibility: "PRIVATE",
      inviteCode: generateInviteCode(),
      ownerId: user.id,
      templateId: template.id,
      weeks: typeof body.weeks === "number" ? body.weeks : null,
      startDate: typeof body.startDate === "string" && body.startDate ? new Date(body.startDate) : null,
      scoringPerWeek: typeof body.scoringPerWeek === "number" ? body.scoringPerWeek : null,
      dueDay: body.dueDay,
      dueTime: body.dueTime,
      draftMode: body.draftMode,
      draftModeDescription:
        typeof body.draftModeDescription === "string" && body.draftModeDescription.trim()
          ? body.draftModeDescription.trim()
          : null,
      entryFeeEnabled: !!body.entryFeeEnabled,
      entryFeeAmount: body.entryFeeEnabled && typeof body.entryFeeAmount === "number" ? body.entryFeeAmount : null,
      entryFeePayMethod: body.entryFeeEnabled && typeof body.entryFeePayMethod === "string" ? body.entryFeePayMethod : null,
      entryFeeHandle: body.entryFeeEnabled && typeof body.entryFeeHandle === "string" ? body.entryFeeHandle.trim() : null,
      prizeEnabled: !!body.prizeEnabled,
      prizePlaces: body.prizeEnabled && typeof body.prizePlaces === "number" ? body.prizePlaces : null,
      prizeRules: body.prizeEnabled && Array.isArray(body.prizeRules) ? body.prizeRules : undefined,
      rules: rules.length ? { create: rules } : undefined,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  await sendLeagueCreatedEmail(user.email, user.name, league.name, league.id);

  return NextResponse.json({ id: league.id, inviteCode: league.inviteCode });
}
