import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const template = await prisma.leagueTemplate.create({
    data: {
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "New template",
      subject: typeof body.subject === "string" ? body.subject.trim() : "",
      glyph: typeof body.glyph === "string" && body.glyph ? body.glyph : "🎬",
    },
  });

  return NextResponse.json(template);
}
