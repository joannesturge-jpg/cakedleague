"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function JoinPublicLeagueButton({
  leagueId,
  isLoggedIn,
  isMember,
}: {
  leagueId: string;
  isLoggedIn: boolean;
  isMember: boolean;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  if (isMember) {
    return (
      <Link
        href={`/leagues/${leagueId}`}
        className="mt-auto self-start px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition"
      >
        View league
      </Link>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login?next=/leagues"
        className="mt-auto self-start px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition"
      >
        Log in to join
      </Link>
    );
  }

  async function join() {
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${leagueId}/join`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't join this league");
      router.push(`/leagues/${leagueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join this league");
      setJoining(false);
    }
  }

  return (
    <div className="mt-auto">
      <button
        onClick={join}
        disabled={joining}
        className="self-start px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-60"
      >
        {joining ? "Joining…" : "Join league"}
      </button>
      {error && <p className="text-pink text-xs mt-2">{error}</p>}
    </div>
  );
}
