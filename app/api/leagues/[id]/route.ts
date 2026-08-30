import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== user.id) return NextResponse.json({ error: "Only the commissioner can delete this league" }, { status: 403 });

  await prisma.league.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
