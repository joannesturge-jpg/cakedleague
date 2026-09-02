"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Season-specific cast photos — update this list (and the files under
// public/dwts-cast/) when a new DWTS season's cast is announced.
const DWTS_CAST = [
  { name: "Jackson Olson", photo: "/dwts-cast/jackson-olson.avif" },
  { name: "Ciara Miller", photo: "/dwts-cast/ciara-miller.avif" },
  { name: "Maura Higgins", photo: "/dwts-cast/maura-higgins.avif" },
  { name: "Guillermo Rodriguez", photo: "/dwts-cast/guillermo-rodriguez.avif" },
  { name: "Conner Leavitt", photo: "/dwts-cast/conner-leavitt.avif" },
  { name: "Harry Shum Jr.", photo: "/dwts-cast/harry-shum-jr.avif" },
  { name: "Giada DeLaurentiis", photo: "/dwts-cast/giada-delaurentiis.avif" },
  { name: "Tyler Cameron", photo: "/dwts-cast/tyler-cameron.avif" },
  { name: "Sarah Jane Nader", photo: "/dwts-cast/sarah-jane-nader.avif" },
  { name: "Connor Wood", photo: "/dwts-cast/connor-wood.avif" },
  { name: "Amber Glenn", photo: "/dwts-cast/amber-glenn.avif" },
  { name: "Ezra Frech", photo: "/dwts-cast/ezra-frech.avif" },
  { name: "Taylor Hanson", photo: "/dwts-cast/taylor-hanson.avif" },
  { name: "Tatyana Ali", photo: "/dwts-cast/tatyana-ali.avif" },
  { name: "Jenna Dewan", photo: "/dwts-cast/jennadewan.avif" },
  { name: "Julia Stiles", photo: "/dwts-cast/julia-stiles.avif" },
];

export function ContestantsModal({ contestants, onClose }: { contestants: string[]; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Prefer the actual contestant entry (which may read "Name with Pro
  // Partner") if it matches this cast member; otherwise just their name.
  function captionFor(name: string) {
    return contestants.find((c) => c.toLowerCase().includes(name.toLowerCase())) ?? name;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-ink/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-cream/12 rounded-3xl max-w-3xl w-full my-8 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/60 hover:text-cream hover:bg-cream/10 transition text-xl"
        >
          ×
        </button>
        <p className="font-script text-3xl text-pink leading-none mb-1">meet the cast</p>
        <h2 className="font-display text-2xl sm:text-3xl tracking-wide mb-6">THE PAIRINGS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {DWTS_CAST.map((person) => (
            <div key={person.name} className="flex flex-col items-center text-center gap-2.5">
              <img
                src={person.photo}
                alt={person.name}
                className="w-full aspect-square object-cover rounded-2xl border border-cream/10"
              />
              <p className="text-sm font-semibold text-cream/85">{captionFor(person.name)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
