import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { sendTestSignupEmail } from "@/lib/email";

// One-off admin tool for seeing a template draft render in a real inbox
// before it replaces a live one. Always sends to the caller's own
// account email — no recipient parameter, so this can't be used to email
// anyone else.
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await sendTestSignupEmail(admin.email, admin.id);
  return NextResponse.json({ ok: true, sentTo: admin.email });
}
