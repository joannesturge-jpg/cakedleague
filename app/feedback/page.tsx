"use client";
import { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't send that — try again?");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that — try again?");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-5 sm:px-10 py-14 sm:py-20 pb-24 flex justify-center">
      <div className="w-full max-w-lg">
        <p className="font-script text-3xl text-pink leading-none mb-1">we're listening</p>
        <h1 className="font-display text-4xl tracking-wide mb-2">SHARE FEEDBACK</h1>
        <p className="text-cream/60 mb-8">Bug, idea, or just a rant about your league. All of it helps.</p>

        <div className="bg-card border border-cream/12 rounded-3xl p-7">
          {sent ? (
            <div className="text-center py-4">
              <p className="font-script text-3xl text-pink leading-none mb-2">got it, thanks</p>
              <p className="text-cream/60 text-sm mb-6">We read every one of these.</p>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition"
              >
                Back home
              </Link>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition resize-none"
              />
              {error && <p className="text-sm text-pink font-medium mt-3">{error}</p>}
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="mt-4 px-6 py-3 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send feedback"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
