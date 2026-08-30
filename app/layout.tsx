import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/app/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caked Leagues",
  description: "Draft anything. Even the weird stuff.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="bg-ink text-cream font-sans">
        <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-7 py-3 bg-ink/90 backdrop-blur-md border-b border-cream/10">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-wide">CAKED</span>
            <span className="font-script text-2xl text-pink">leagues</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-cream/80 hover:text-cream transition"
                >
                  My Leagues
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-cream/80 hover:text-cream transition"
                >
                  Settings
                </Link>
                <LogoutButton className="px-4 py-2 rounded-full text-sm font-semibold border border-cream/20 hover:border-cream transition" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-cream/20 hover:border-cream transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 rounded-full text-sm font-bold text-ink bg-pink hover:bg-cream transition"
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
