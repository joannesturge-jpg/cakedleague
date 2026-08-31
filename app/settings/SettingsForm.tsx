"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  name: initialName,
  email,
  notifyPicksDue: initialPicksDue,
  notifyScoring: initialScoring,
  notifyInvites: initialInvites,
}: {
  name: string;
  email: string;
  notifyPicksDue: boolean;
  notifyScoring: boolean;
  notifyInvites: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [notifyPicksDue, setNotifyPicksDue] = useState(initialPicksDue);
  const [notifyScoring, setNotifyScoring] = useState(initialScoring);
  const [notifyInvites, setNotifyInvites] = useState(initialInvites);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, notifyPicksDue, notifyScoring, notifyInvites }),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 sm:px-10 py-10 sm:py-14 pb-20 max-w-xl mx-auto">
      <p className="font-script text-3xl sm:text-4xl text-pink leading-none">your corner</p>
      <h1 className="font-display text-4xl sm:text-5xl tracking-wide mb-7">SETTINGS</h1>

      <div className="bg-card border border-cream/12 rounded-3xl p-7 flex flex-col gap-5">
        <div className="flex items-center gap-[18px]">
          <span
            className="w-[70px] h-[70px] rounded-full flex items-center justify-center font-display text-2xl flex-none"
            style={{ background: "linear-gradient(140deg,#7B2CF5,#E85BAE)" }}
          >
            {initials}
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-2">DISPLAY NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream text-[15px] outline-none focus:border-pink transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-2">EMAIL</label>
          <input
            value={email}
            disabled
            className="w-full px-4 py-3.5 rounded-xl bg-ink/40 border border-cream/10 text-cream/50 text-[15px] outline-none cursor-not-allowed"
          />
          <p className="text-xs text-cream/35 mt-1.5">Contact support to change the email on your account.</p>
        </div>

        <div className="border-t border-cream/10 pt-5">
          <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-3">EMAIL ME WHEN</label>
          <div className="flex flex-col gap-2.5">
            <NotifyRow label="A round's picks are due soon" on={notifyPicksDue} onToggle={() => setNotifyPicksDue((v) => !v)} />
            <NotifyRow label="A commissioner posts new scores" on={notifyScoring} onToggle={() => setNotifyScoring((v) => !v)} />
            <NotifyRow label="Someone joins a league I run" on={notifyInvites} onToggle={() => setNotifyInvites((v) => !v)} />
          </div>
          <p className="text-xs text-cream/35 mt-3">
            This is the master switch for picks-due reminders. You can also turn them off for one league at a time
            from that league&apos;s page.
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="py-3.5 rounded-full bg-pink text-ink font-extrabold text-[15.5px] hover:bg-cream transition disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function NotifyRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-3 text-left">
      <span className={`w-10 h-6 rounded-full relative transition flex-none ${on ? "bg-pink" : "bg-cream/15"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span className="text-[14.5px] text-cream/75">{label}</span>
    </button>
  );
}
