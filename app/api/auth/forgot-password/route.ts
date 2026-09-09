import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendPasswordReset } from "@/lib/password-reset";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  // Per-email limit stops someone from email-bombing one inbox with reset
  // links; per-IP limit stops one script from doing that across many
  // addresses.
  if (
    !rateLimit(`forgot:ip:${clientIp(request)}`, 10, 60 * 60 * 1000) ||
    !rateLimit(`forgot:email:${normalizedEmail}`, 3, 60 * 60 * 1000)
  ) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    await createAndSendPasswordReset(user);
  }

  // Always return the same response so we don't reveal which emails have accounts.
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
