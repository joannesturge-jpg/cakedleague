"use client";
import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/app/components/LogoutButton";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center text-cream"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 bg-ink border-b border-cream/10 shadow-xl max-h-[calc(100vh-72px)] overflow-y-auto">
          <nav className="flex flex-col px-5 py-4">
            <Link href="/" onClick={close} className="px-2 py-3.5 text-base font-semibold text-cream/85 border-b border-cream/10">
              Home
            </Link>
            <Link href="/leagues" onClick={close} className="px-2 py-3.5 text-base font-semibold text-cream/85 border-b border-cream/10">
              Public Leagues
            </Link>
            {isLoggedIn && (
              <Link href="/dashboard" onClick={close} className="px-2 py-3.5 text-base font-semibold text-cream/85 border-b border-cream/10">
                My Leagues
              </Link>
            )}
            <a
              href="https://buymeacoffee.com/cakedfantasy"
              target="_blank"
              rel="noopener"
              onClick={close}
              className="px-2 py-3.5 text-base font-semibold text-cream/85 border-b border-cream/10"
            >
              ☕ Buy me a coffee
            </a>
            <Link href="/feedback" onClick={close} className="px-2 py-3.5 text-base font-semibold text-cream/85 border-b border-cream/10">
              Share feedback
            </Link>

            {isLoggedIn ? (
              <>
                <Link href="/settings" onClick={close} className="px-2 py-3.5 text-base font-semibold text-cream/85 border-b border-cream/10">
                  Settings
                </Link>
                <LogoutButton className="px-2 py-3.5 text-left text-base font-semibold text-cream/85" />
              </>
            ) : (
              <div className="flex gap-3 pt-5">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex-1 text-center px-4 py-3 rounded-full text-sm font-semibold border border-cream/20"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="flex-1 text-center px-5 py-3 rounded-full text-sm font-bold text-ink bg-pink"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
