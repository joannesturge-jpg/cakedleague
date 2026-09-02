import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The real-world answer key for a WEEKLY_TOP3 template's pre-season
// predictions (final four + season winner). Each field locks after its
// first save — the admin picks these once, whenever the real result is
// known, and can't change them from here afterward.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const template = await prisma.leagueTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (Array.isArray(body.actualFinalFour)) {
    if (template.actualFinalFour.length > 0) {
      return NextResponse.json({ error: "The final four is already locked in" }, { status: 400 });
    }
    const picks: string[] = body.actualFinalFour.filter(
      (c: unknown): c is string => typeof c === "string" && c.trim().length > 0
    );
    const unique = Array.from(new Set(picks));
    if (unique.length !== 4) {
      return NextResponse.json({ error: "Pick exactly 4 contestants for the final four" }, { status: 400 });
    }
    for (const c of unique) {
      if (!template.contestants.includes(c)) {
        return NextResponse.json({ error: `${c} isn't in this template's contestant pool` }, { status: 400 });
      }
    }
    data.actualFinalFour = unique;
  }

  if (typeof body.actualWinner === "string" && body.actualWinner.trim()) {
    if (template.actualWinner) {
      return NextResponse.json({ error: "The season winner is already locked in" }, { status: 400 });
    }
    const winner = body.actualWinner.trim();
    if (!template.contestants.includes(winner)) {
      return NextResponse.json({ error: `${winner} isn't in this template's contestant pool` }, { status: 400 });
    }
    data.actualWinner = winner;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  const updated = await prisma.leagueTemplate.update({ where: { id: params.id }, data });
  return NextResponse.json({ actualFinalFour: updated.actualFinalFour, actualWinner: updated.actualWinner });
}
