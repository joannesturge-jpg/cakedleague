"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center px-10 py-14 min-h-[calc(100vh-62px)]">
      <div className="w-full max-w-[400px]">
        <h1 className="font-display text-3xl tracking-wide text-center mb-6">ADMIN</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-cream/10 rounded-3xl px-8 py-8 flex flex-col gap-3.5"
        >
          <div>
            <label className="block text-[11px] font-bold tracking-widest text-cream/45 mb-1.5">EMAIL</label>
            <input
              type="email"
              className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold tracking-widest text-cream/45 mb-1.5">PASSWORD</label>
            <input
              type="password"
              className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-pink font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3.5 rounded-full bg-pink text-ink font-extrabold text-base mt-1 hover:bg-cream transition disabled:opacity-60"
          >
            {loading ? "Please wait…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
