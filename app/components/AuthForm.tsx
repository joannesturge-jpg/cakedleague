"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COPY = {
  signup: {
    script: "let's get you drafting",
    title: "CREATE ACCOUNT",
    sub: "One account, every league. Takes about ten seconds.",
    cta: "Create account",
    swapText: "Already have an account?",
    swapLink: "Log in",
    swapHref: "/login",
  },
  login: {
    script: "welcome back",
    title: "LOG IN",
    sub: "Good to see you again.",
    cta: "Log in",
    swapText: "New here?",
    swapLink: "Sign up free",
    swapHref: "/signup",
  },
};

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push("/dashboard");
      router.refresh();
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
      <div
        className="absolute -bottom-60 -right-36 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(232,91,174,.24), transparent 68%)" }}
      />

      <div className="relative w-full max-w-[452px]">
        <div className="flex items-baseline justify-center gap-3 mb-6">
          <span className="font-display text-5xl tracking-wide">CAKED</span>
          <span className="font-script text-4xl text-pink">leagues</span>
        </div>

        <div className="bg-card border border-cream/10 rounded-3xl px-9 py-9 shadow-2xl">
          <p className="font-script text-3xl text-pink text-center leading-none">{copy.script}</p>
          <h1 className="font-display text-4xl tracking-wide text-center mt-1 mb-2">{copy.title}</h1>
          <p className="text-sm text-cream/60 text-center mb-6 leading-relaxed">{copy.sub}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === "signup" && (
              <Field label="Display name">
                <input
                  className={inputClass}
                  placeholder="What your league sees"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </Field>

            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <Link href="/forgot-password" className="text-[13px] text-cream/50 hover:text-pink transition">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && <p className="text-sm text-pink font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="py-3.5 rounded-full bg-pink text-ink font-extrabold text-base mt-1 hover:bg-cream transition disabled:opacity-60"
            >
              {loading ? "Please wait…" : copy.cta}
            </button>
          </form>
        </div>

        <p className="text-[14.5px] text-cream/55 text-center mt-5">
          {copy.swapText}{" "}
          <Link href={copy.swapHref} className="text-pink font-bold">
            {copy.swapLink}
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-widest text-cream/45 mb-1.5">
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}
