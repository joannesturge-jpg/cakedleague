import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forwards the current path as a header so Server Components (which don't
// otherwise know the request path) can branch on it — used by
// app/layout.tsx to let /login and /signup through on test.cakedleagues.com
// even though everything else there requires an admin session.
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
