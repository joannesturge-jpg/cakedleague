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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get("host") || "";
  const isAdminHost = host.startsWith("admin.");

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

  return (
    <html lang="en">
      <body className="bg-ink text-cream font-sans">
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
