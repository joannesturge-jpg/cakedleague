"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-cream/70 text-center leading-relaxed">
        This reset link is missing its token. Request a new one from{" "}
        <Link href="/forgot-password" className="text-pink font-bold">
          the reset page
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return <p className="text-sm text-cream/80 text-center leading-relaxed">Password updated. Redirecting to log in…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className="block text-[11px] font-bold tracking-widest text-cream/45 mb-1.5">NEW PASSWORD</label>
        <input
          type="password"
          className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold tracking-widest text-cream/45 mb-1.5">CONFIRM PASSWORD</label>
        <input
          type="password"
          className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
        />
      </div>

      {error && <p className="text-sm text-pink font-medium">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="py-3.5 rounded-full bg-pink text-ink font-extrabold text-base mt-1 hover:bg-cream transition disabled:opacity-60"
      >
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
