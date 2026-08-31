import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, isAdminEmail, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { sendSignupConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email, name, password } = await request.json();

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: await hashPassword(password),
      isAdmin: isAdminEmail(normalizedEmail),
    },
  });

  await sendSignupConfirmationEmail(user.email, user.name);

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
