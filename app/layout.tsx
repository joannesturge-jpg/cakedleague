import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/app/components/LogoutButton";
import { FeedbackModal } from "@/app/components/FeedbackModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caked Leagues",
  description: "Draft anything. Even the weird stuff.",
};

// Routes an admin needs to reach before they're logged in — everything
// else on test.cakedleagues.com is blocked until they are.
const PUBLIC_ON_TEST_HOST = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get("host") || "";
  const isAdminHost = host.startsWith("admin.");
  const isTestHost = host.startsWith("test.");

  if (isAdminHost) {
    // The admin panel (app/admin/AdminDashboard.tsx) is its own fully
    // light-themed page with its own header — don't wrap it in the dark
    // consumer nav.
    return (
      <html lang="en">
        <body className="font-sans">{children}</body>
      </html>
    );
  }

  const user = await getCurrentUser();

  if (isTestHost) {
    const pathname = headers().get("x-pathname") || "";
    const isPublicRoute = PUBLIC_ON_TEST_HOST.some((p) => pathname.startsWith(p));
    if (!isPublicRoute && !user?.isAdmin) {
      return (
        <html lang="en">
          <body className="bg-ink text-cream font-sans flex items-center justify-center min-h-screen px-6 text-center">
            <div>
              <h1 className="font-display text-3xl tracking-wide mb-3">STAGING — ADMIN ONLY</h1>
              <p className="text-cream/60 mb-6 max-w-sm">
                This is a testing environment for upcoming features. Log in with an admin account to continue.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full border border-cream/20 text-sm font-semibold hover:border-cream transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 rounded-full bg-pink text-ink text-sm font-bold hover:bg-cream transition"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </body>
        </html>
      );
    }
  }

  return (
    <html lang="en">
      <body className="bg-ink text-cream font-sans">
        {isTestHost && (
          <div className="px-4 py-1.5 text-center text-[11px] font-bold tracking-widest bg-pink text-ink">
            TESTING ENVIRONMENT — not visible to real users
          </div>
        )}
        <header className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap px-5 sm:px-7 py-3 bg-ink/90 backdrop-blur-md border-b border-cream/10">
          <Link href="/" className="flex items-baseline gap-2 flex-none">
            <span className="font-display text-2xl tracking-wide">CAKED</span>
            <span className="font-script text-2xl text-pink">leagues</span>
          </Link>

          <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-full text-sm font-semibold text-cream/55 hover:text-cream transition whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              href={user ? "/dashboard" : "/leagues"}
              className="px-3.5 py-2 rounded-full text-sm font-semibold text-cream/55 hover:text-cream transition whitespace-nowrap"
            >
              {user ? "My Leagues" : "Leagues"}
            </Link>
            <a
              href="https://buymeacoffee.com/cakedfantasy"
              target="_blank"
              rel="noopener"
              className="px-3.5 py-2 rounded-full text-sm font-semibold text-cream/55 hover:text-cream transition whitespace-nowrap"
            >
              ☕ Buy me a coffee
            </a>
            <FeedbackModal />
          </nav>

          <div className="flex items-center gap-2.5 flex-none">
            {user ? (
              <>
                <Link
                  href="/settings"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-cream/80 hover:text-cream transition whitespace-nowrap"
                >
                  Settings
                </Link>
                <LogoutButton className="px-4 py-2 rounded-full text-sm font-semibold border border-cream/20 hover:border-cream transition whitespace-nowrap" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-cream/20 hover:border-cream transition whitespace-nowrap"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 rounded-full text-sm font-bold text-ink bg-pink hover:bg-cream transition whitespace-nowrap"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
