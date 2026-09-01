import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Wipes every drafted pick across every league on this template — for
// clearing out test picks before real contestants are entered.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { count } = await prisma.leagueMemberPick.deleteMany({
    where: { league: { templateId: params.id } },
  });
  return NextResponse.json({ ok: true, cleared: count });
}
