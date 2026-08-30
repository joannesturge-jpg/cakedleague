import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.notifyPicksDue === "boolean") data.notifyPicksDue = body.notifyPicksDue;
  if (typeof body.notifyScoring === "boolean") data.notifyScoring = body.notifyScoring;
  if (typeof body.notifyInvites === "boolean") data.notifyInvites = body.notifyInvites;

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
