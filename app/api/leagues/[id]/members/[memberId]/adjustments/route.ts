import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MODES = new Set(["ADD", "SUBTRACT", "SET"]);

// Owner-only manual score adjustment — a flat delta stored on top of
// whatever the scoring engine computes, so it survives future scoring
// changes (re-entered contestant scores, rule edits) without needing to
// be redone. "amount" is what the commissioner typed; "points" is the
// signed delta actually applied. Both are computed client-side against
// the total the commissioner was already looking at — trusted here
// because only the commissioner who owns this league can call this route.
export async function POST(request: Request, { params }: { params: { id: string; memberId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league || league.deletedAt) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the commissioner can adjust scores" }, { status: 403 });
  }

  const member = await prisma.leagueMember.findUnique({ where: { id: params.memberId } });
  if (!member || member.leagueId !== league.id) {
    return NextResponse.json({ error: "That member isn't in this league" }, { status: 400 });
  }

  const body = await request.json();
  const mode = typeof body.mode === "string" ? body.mode : "";
  const amount = Number(body.amount);
  const points = Number(body.points);
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!MODES.has(mode) || !Number.isFinite(amount) || !Number.isFinite(points) || !note) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const adjustment = await prisma.leagueMemberAdjustment.create({
    data: { memberId: member.id, mode, amount: Math.round(amount), points: Math.round(points), note },
  });

  return NextResponse.json(adjustment);
}
