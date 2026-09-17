"use client";
import { createPortal } from "react-dom";
import type { DwtsScoreGroup } from "@/lib/dwts-scoring";

export function ScoreBreakdownModal({
  memberName,
  totalPoints,
  groups,
  onClose,
}: {
  memberName: string;
  totalPoints: number;
  groups: DwtsScoreGroup[];
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-cream/12 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/60 hover:text-cream hover:bg-cream/10 transition text-xl z-10"
        >
          ×
        </button>
        <div className="flex-none px-6 sm:px-8 pt-6 sm:pt-8 pb-1">
          <p className="font-script text-3xl text-pink leading-none mb-1">the breakdown</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide">{memberName.toUpperCase()}</h2>
          <p className="text-sm text-cream/55 mt-1.5">{totalPoints} points total</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 pt-4 pb-6">
          {groups.length === 0 ? (
            <p className="text-sm text-cream/45">No points yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((g) => (
                <div key={g.key} className="bg-ink/40 border border-cream/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-cream/10">
                    <span className="font-display text-base tracking-wide">{g.title}</span>
                    <span className={`font-display text-base ${g.total >= 0 ? "text-pink" : "text-pink/70"}`}>
                      {g.total > 0 ? `+${g.total}` : g.total}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {g.lines.map((line, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm border-b border-cream/[0.06] last:border-b-0"
                      >
                        <span className="text-cream/75">{line.label}</span>
                        <span className="font-semibold text-cream/85 flex-none">
                          {line.points > 0 ? `+${line.points}` : line.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
