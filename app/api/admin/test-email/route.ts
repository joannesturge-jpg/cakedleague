import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { sendTestSignupEmail, sendTestLeagueCreatedEmail } from "@/lib/email";

// One-off admin tool for seeing a template draft render in a real inbox
// before it replaces a live one. Always sends to the caller's own
// account email — no recipient parameter, so this can't be used to email
// anyone else. Pass ?template=signup (default) or ?template=league-created.
export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const template = new URL(request.url).searchParams.get("template") ?? "signup";

  if (template === "league-created") {
    await sendTestLeagueCreatedEmail(admin.email, admin.id);
  } else {
    await sendTestSignupEmail(admin.email, admin.id);
  }

  return NextResponse.json({ ok: true, template, sentTo: admin.email });
}
