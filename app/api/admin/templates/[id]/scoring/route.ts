import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggles whether a contestant earned a given template rule in a given
// week. This is admin-entered scoring at the template level — it applies
// to every league built off this template, not one league at a time.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const week = Math.round(Number(body.week));
  const ruleId = typeof body.ruleId === "string" ? body.ruleId : "";
  const contestant = typeof body.contestant === "string" ? body.contestant.trim() : "";

  if (!Number.isFinite(week) || week < 1 || !ruleId || !contestant) {
    return NextResponse.json({ error: "Missing week, rule, or contestant" }, { status: 400 });
  }

  const rule = await prisma.leagueTemplateRule.findFirst({ where: { id: ruleId, templateId: params.id } });
  if (!rule) return NextResponse.json({ error: "Rule not found on this template" }, { status: 404 });

  const existing = await prisma.leagueTemplateRuleAward.findUnique({
    where: { ruleId_week_contestant: { ruleId, week, contestant } },
  });

  if (existing) {
    await prisma.leagueTemplateRuleAward.delete({ where: { id: existing.id } });
    return NextResponse.json({ awarded: false });
  }

  await prisma.leagueTemplateRuleAward.create({ data: { templateId: params.id, ruleId, week, contestant } });
  return NextResponse.json({ awarded: true });
}
