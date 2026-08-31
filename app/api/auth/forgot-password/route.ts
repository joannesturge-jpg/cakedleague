import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendPasswordReset } from "@/lib/password-reset";

const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (user) {
    await createAndSendPasswordReset(user);
  }

  // Always return the same response so we don't reveal which emails have accounts.
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
