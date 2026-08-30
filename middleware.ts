import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const isAdminHost = hostname.startsWith("admin.");

  if (isAdminHost) {
    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/fonts")) {
      return NextResponse.next();
    }
    if (pathname !== "/admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // The admin dashboard is only reachable at admin.cakedleagues.com — never
  // on the main site, even if someone guesses the path. Local dev is exempt
  // so you don't need a real subdomain to work on it.
  if (pathname.startsWith("/admin") && process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
