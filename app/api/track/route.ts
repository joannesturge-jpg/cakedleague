import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Fires once per page load from the client Analytics component. Admin
// activity is excluded here, at write time, rather than filtered when the
// admin dashboard reads it back — so an admin's own browsing never counts
// toward "visitors," "hours on site," or page traffic.
export async function POST(request: Request) {
  const host = headers().get("host") || "";
  if (host.startsWith("admin.")) return NextResponse.json({ ok: true });

  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.slice(0, 300) : null;
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const visitorId = cookies().get("visitor_id")?.value;
  if (!visitorId) return NextResponse.json({ ok: true });

  const user = await getCurrentUser();
  if (user?.isAdmin) return NextResponse.json({ ok: true });

  await prisma.pageView.create({
    data: { path, visitorId, userId: user?.id ?? null },
  });

  return NextResponse.json({ ok: true });
}
