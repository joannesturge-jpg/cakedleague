"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminRuleAward = { id: string; week: number; contestant: string; ruleId: string };
export type AdminScoringRule = { id: string; label: string; points: number; order: number };
export type AdminScoringTemplate = {
  id: string;
  name: string;
  tag: string | null;
  weeks: number;
  contestants: string[];
  eliminatedContestants: string[];
  rules: AdminScoringRule[];
  ruleAwards: AdminRuleAward[];
};

export function AdminScoring({ templates }: { templates: AdminScoringTemplate[] }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [week, setWeek] = useState(1);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const template = templates.find((t) => t.id === templateId) ?? null;
  const activeContestants =
    template?.contestants.filter((c) => !template.eliminatedContestants.includes(c)) ?? [];

  function isAwarded(ruleId: string, contestant: string) {
    return !!template?.ruleAwards.some((a) => a.ruleId === ruleId && a.week === week && a.contestant === contestant);
  }

  async function toggle(ruleId: string, contestant: string) {
    if (!template) return;
    const key = `${ruleId}:${contestant}`;
    setBusyKey(key);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, ruleId, contestant }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Couldn't save that");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that");
    } finally {
      setBusyKey(null);
    }
  }

  if (!template) {
    return (
      <div className="bg-white border border-[#E2E4E9] rounded-lg px-5 py-12 text-center text-sm text-[#6B7280]">
        No templates yet — add one in League Templates first.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">WEEKLY SCORING</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Pick who earned each rule this week — it applies to every league on the {template.tag ?? "matching"}{" "}
            tag automatically.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap p-3.5 bg-white border border-[#E2E4E9] rounded-t-lg">
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setWeek(1);
          }}
          className="px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tag ? `${t.tag} — ${t.name}` : t.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#5B6270]">Week</span>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="px-3 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition"
          >
            {Array.from({ length: template.weeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-[#FDF2F4] border-x border-[#E2E4E9] text-[#C2314E] text-sm">{error}</div>
      )}

      <div className="bg-white border border-[#E2E4E9] rounded-b-lg divide-y divide-[#EDEFF3]">
        {template.rules.map((rule) => (
          <div key={rule.id} className="px-[18px] py-4">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-sm font-semibold">{rule.label}</span>
              <span className="text-xs font-bold text-[#8A909B]">
                {rule.points > 0 ? `+${rule.points}` : rule.points} pts
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeContestants.map((c) => {
                const awarded = isAwarded(rule.id, c);
                const key = `${rule.id}:${c}`;
                return (
                  <button
                    key={c}
                    onClick={() => toggle(rule.id, c)}
                    disabled={busyKey === key}
                    className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition disabled:opacity-50 ${
                      awarded
                        ? "bg-[#EEF8F1] border-[#1E7B45]/40 text-[#1E7B45]"
                        : "bg-white border-[#D6D9E0] text-[#5B6270] hover:border-purple"
                    }`}
                  >
                    {awarded ? "✓ " : ""}
                    {c}
                  </button>
                );
              })}
              {activeContestants.length === 0 && (
                <p className="text-xs text-[#8A909B]">No active contestants — add some in League Templates.</p>
              )}
            </div>
          </div>
        ))}
        {template.rules.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-[#6B7280]">
            This template has no scoring rules yet — add some in League Templates.
          </div>
        )}
      </div>
    </div>
  );
}
