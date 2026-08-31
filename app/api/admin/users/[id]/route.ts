import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (params.id === admin.id) {
    return NextResponse.json({ error: "You can't block your own account" }, { status: 400 });
  }

  const body = await request.json();
  if (typeof body.isBlocked !== "boolean") {
    return NextResponse.json({ error: "Missing isBlocked" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.id }, data: { isBlocked: body.isBlocked } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (params.id === admin.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
