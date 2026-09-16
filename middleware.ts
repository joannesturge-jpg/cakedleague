import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VISITOR_COOKIE = "visitor_id";

// Anonymous, non-identifying id used only to count unique daily visitors
// and roughly group a visitor's page loads into sessions for time-on-site.
// Set once, here, so it's present before the page's own JS runs.
export function middleware(request: NextRequest) {
  if (request.cookies.get(VISITOR_COOKIE)) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
    maxAge: 60 * 60 * 24 * 365 * 2,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
