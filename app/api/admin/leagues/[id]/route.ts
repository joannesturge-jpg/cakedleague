import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin-only restore of a soft-deleted league (the member-facing delete
// in app/api/leagues/[id]/route.ts only ever sets deletedAt, never
// erases the row, so this just clears it back).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  if (body.restore !== true) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  await prisma.league.update({ where: { id: params.id }, data: { deletedAt: null } });
  return NextResponse.json({ ok: true });
}
