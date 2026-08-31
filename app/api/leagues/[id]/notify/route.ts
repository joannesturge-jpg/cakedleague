import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();
  if (typeof body.notifyPicksDue !== "boolean") {
    return NextResponse.json({ error: "Missing notifyPicksDue" }, { status: 400 });
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });

  await prisma.leagueMember.update({ where: { id: membership.id }, data: { notifyPicksDue: body.notifyPicksDue } });
  return NextResponse.json({ ok: true });
}
