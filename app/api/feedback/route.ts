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
  const formName = typeof body.name === "string" ? body.name.trim() : "";
  const formEmail = typeof body.email === "string" ? body.email.trim() : "";
  const name = formName || user?.name || "";
  const email = formEmail || user?.email || "";

  await sendFeedbackEmail(text, name || email ? { name: name || "Someone", email } : null);

  return NextResponse.json({ ok: true });
}
