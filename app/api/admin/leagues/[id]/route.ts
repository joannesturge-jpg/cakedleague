import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin-only delete/restore of a league — both just toggle deletedAt
// (the member-facing delete in app/api/leagues/[id]/route.ts does the
// same, owner-only), so a delete here is never a hard delete and is
// always undoable with the other action.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const league = await prisma.league.findUnique({ where: { id: params.id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  if (body.restore === true) {
    await prisma.league.update({ where: { id: params.id }, data: { deletedAt: null } });
    return NextResponse.json({ ok: true });
  }
  if (body.delete === true) {
    await prisma.league.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
