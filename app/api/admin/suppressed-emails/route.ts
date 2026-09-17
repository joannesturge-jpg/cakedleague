import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Accepts one address or a whole pasted block — split on any whitespace
// or comma so a list copied from somewhere else (like a Resend export)
// just works.
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();
  const raw = typeof body.emails === "string" ? body.emails : "";
  const emails = Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((e: string) => e.trim().toLowerCase())
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );

  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid email addresses found" }, { status: 400 });
  }

  await prisma.suppressedEmail.createMany({
    data: emails.map((email) => ({ email })),
    skipDuplicates: true,
  });

  const all = await prisma.suppressedEmail.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(all);
}
