import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const invalid = () => NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user) return invalid();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return invalid();

  if (user.isBlocked) {
    return NextResponse.json({ error: "This account has been blocked. Contact support if that seems wrong." }, { status: 403 });
  }

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
