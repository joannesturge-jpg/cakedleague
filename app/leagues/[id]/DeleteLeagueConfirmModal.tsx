"use client";
import { useState } from "react";
import { createPortal } from "react-dom";

export function DeleteLeagueConfirmModal({
  leagueName,
  busy,
  onConfirm,
  onCancel,
}: {
  leagueName: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="relative bg-card border border-cream/12 rounded-3xl max-w-sm w-full p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/60 hover:text-cream hover:bg-cream/10 transition text-xl"
        >
          ×
        </button>
        <p className="font-script text-2xl text-pink leading-none mb-1">delete league</p>
        <h2 className="font-display text-xl tracking-wide mb-4 truncate pr-8">{leagueName.toUpperCase()}</h2>

        <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 flex-none w-4 h-4 accent-pink"
          />
          <span className="text-sm text-cream/80">
            I understand my league will be deleted and I won&apos;t be able to access it in the future.
          </span>
        </label>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full border border-cream/20 text-cream/70 text-sm font-semibold hover:border-cream/40 hover:text-cream transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!acknowledged || busy}
            className="flex-1 py-2.5 rounded-full bg-pink text-ink text-sm font-bold disabled:opacity-40 transition"
          >
            {busy ? "Deleting…" : "Delete league"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
