import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await prisma.suppressedEmail.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
