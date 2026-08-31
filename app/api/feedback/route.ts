import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendFeedbackEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Feedback can't be empty" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "That's a lot of feedback — try trimming it a bit" }, { status: 400 });
  }

  const user = await getCurrentUser();
  await sendFeedbackEmail(text, user ? { name: user.name, email: user.email } : null);

  return NextResponse.json({ ok: true });
}
