"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center px-10 py-14 min-h-[calc(100vh-62px)] overflow-hidden">
      <div
        className="absolute -top-44 left-1/2 -ml-96 w-[760px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(123,44,245,.38), transparent 66%)" }}
      />

      <div className="relative w-full max-w-[452px]">
        <div className="flex items-baseline justify-center gap-3 mb-6">
          <span className="font-display text-5xl tracking-wide">CAKED</span>
          <span className="font-script text-4xl text-pink">leagues</span>
        </div>

        <div className="bg-card border border-cream/10 rounded-3xl px-9 py-9 shadow-2xl">
          <p className="font-script text-3xl text-pink text-center leading-none">happens to everyone</p>
          <h1 className="font-display text-4xl tracking-wide text-center mt-1 mb-2">RESET PASSWORD</h1>
          <p className="text-sm text-cream/60 text-center mb-6 leading-relaxed">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>

          {message ? (
            <p className="text-sm text-cream/80 text-center leading-relaxed">{message}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-cream/45 mb-1.5">EMAIL</label>
                <input
                  type="email"
                  className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-pink font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="py-3.5 rounded-full bg-pink text-ink font-extrabold text-base mt-1 hover:bg-cream transition disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-[14.5px] text-cream/55 text-center mt-5">
          <Link href="/login" className="text-pink font-bold">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
