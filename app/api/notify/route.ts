import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const templateId = typeof body.templateId === "string" ? body.templateId : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  // Not filtered to isActive — an inactive ("coming soon") template still
  // needs to accept notify signups, since that's the whole point of
  // listing it as coming soon.
  const template = await prisma.leagueTemplate.findFirst({ where: { id: templateId } });
  if (!template) {
    return NextResponse.json({ error: "Pick a show to be notified about" }, { status: 400 });
  }

  await prisma.notifySignup.upsert({
    where: { email_templateId: { email, templateId } },
    update: {},
    create: { email, templateId },
  });

  return NextResponse.json({ ok: true });
}
