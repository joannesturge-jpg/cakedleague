"use client";
import { useState } from "react";

export function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setSent(false);
    setError("");
    setText("");
  }

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
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3.5 py-2 rounded-full text-sm font-semibold text-cream/55 hover:text-cream transition whitespace-nowrap"
      >
        Share feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5 bg-ink/70" onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-cream/12 rounded-3xl p-7"
          >
            {sent ? (
              <div className="text-center py-4">
                <p className="font-script text-3xl text-pink leading-none mb-2">got it, thanks</p>
                <p className="text-cream/60 text-sm mb-6">We read every one of these.</p>
                <button
                  onClick={close}
                  className="px-6 py-2.5 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl tracking-wide mb-1">SHARE FEEDBACK</h3>
                <p className="text-sm text-cream/55 mb-4">Bug, idea, or just a rant about your league. All of it helps.</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition resize-none"
                />
                {error && <p className="text-sm text-pink font-medium mt-3">{error}</p>}
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button onClick={close} className="text-sm font-semibold text-cream/50 hover:text-cream transition">
                    Cancel
                  </button>
                  <button
                    onClick={send}
                    disabled={sending || !text.trim()}
                    className="px-6 py-2.5 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
