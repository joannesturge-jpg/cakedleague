"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DUE_DAYS, DUE_DAY_LABELS, DRAFT_MODES, LEAGUE_EMOJIS } from "@/lib/leagues";

export type AdminTemplateRule = { id: string; label: string; points: number; order: number };
export type AdminTemplateRow = {
  id: string;
  name: string;
  subject: string;
  glyph: string;
  weeks: number;
  scoringPerWeek: number;
  dueDay: string;
  draftMode: string;
  description: string | null;
  isActive: boolean;
  rules: AdminTemplateRule[];
  contestants: string[];
  eliminatedContestants: string[];
  tag: string | null;
  draftOpenDay: string | null;
  draftOpenTime: string | null;
};

export function AdminTemplates({
  templates,
  publicLeagueByTemplate,
}: {
  templates: AdminTemplateRow[];
  publicLeagueByTemplate: Record<string, string>;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function addTemplate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New template", subject: "" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Couldn't create the template (${res.status}).`);
      }
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">LEAGUE TEMPLATES</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {templates.length} {templates.length === 1 ? "template" : "templates"} — these are what members pick
            from when they create a league.
          </p>
        </div>
        <button
          onClick={addTemplate}
          disabled={creating}
          className="px-5 py-2.5 rounded-md bg-purple text-white font-bold text-sm hover:bg-[#6a1fe0] transition disabled:opacity-60"
        >
          + New template
        </button>
      </div>

      {error && <p className="text-sm text-[#C2314E] font-medium mb-3">{error}</p>}

      <div className="flex flex-col gap-2.5">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} publicLeagueId={publicLeagueByTemplate[t.id] ?? null} />
        ))}
        {templates.length === 0 && (
          <div className="bg-white border border-[#E2E4E9] rounded-lg px-5 py-12 text-center text-sm text-[#6B7280]">
            No templates yet. Add one so members have something to pick from when creating a league.
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template, publicLeagueId }: { template: AdminTemplateRow; publicLeagueId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [glyphPicker, setGlyphPicker] = useState(false);
  const [creatingLeague, setCreatingLeague] = useState(false);
  const [leagueId, setLeagueId] = useState(publicLeagueId);

  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [tag, setTag] = useState(template.tag ?? "");
  const [glyph, setGlyph] = useState(template.glyph);
  const [weeks, setWeeks] = useState(template.weeks);
  const [scoringPerWeek, setScoringPerWeek] = useState(template.scoringPerWeek);
  const [dueDay, setDueDay] = useState(template.dueDay);
  const [draftMode, setDraftMode] = useState(template.draftMode);
  const [description, setDescription] = useState(template.description ?? "");
  const [isActive, setIsActive] = useState(template.isActive);
  const [rules, setRules] = useState(template.rules.map((r) => ({ label: r.label, points: r.points })));
  const [ruleDraft, setRuleDraft] = useState("");
  const [contestants, setContestants] = useState(template.contestants);
  const [contestantDraft, setContestantDraft] = useState("");
  const [eliminated, setEliminated] = useState(template.eliminatedContestants);
  const [draftOpenDay, setDraftOpenDay] = useState(template.draftOpenDay ?? "");
  const [draftOpenTime, setDraftOpenTime] = useState(template.draftOpenTime ?? "");
  const [error, setError] = useState("");

  function toggleEliminated(name: string) {
    setEliminated((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function addRule() {
    if (!ruleDraft.trim()) return;
    setRules((r) => [...r, { label: ruleDraft.trim(), points: 1 }]);
    setRuleDraft("");
  }

  function addContestant() {
    if (!contestantDraft.trim()) return;
    setContestants((c) => [...c, contestantDraft.trim()]);
    setContestantDraft("");
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          tag,
          glyph,
          weeks,
          scoringPerWeek,
          dueDay,
          draftMode,
          description,
          isActive,
          rules,
          contestants,
          eliminatedContestants: eliminated,
          draftOpenDay,
          draftOpenTime,
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Couldn't save (${res.status}).`);
      }
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    const next = !isActive;
    setIsActive(next);
    await fetch(`/api/admin/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete "${template.name}"? Leagues already using it keep their own copy of the rules.`)) return;
    const res = await fetch(`/api/admin/templates/${template.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function createPublicLeague() {
    setCreatingLeague(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/create-league`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Couldn't create the league (${res.status}).`);
      setLeagueId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the league");
    } finally {
      setCreatingLeague(false);
    }
  }

  function publicLeagueUrl(id: string) {
    if (typeof window === "undefined") return "#";
    return `${window.location.protocol}//${window.location.host.replace(/^admin\./, "")}/leagues/${id}`;
  }

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-lg overflow-hidden">
      <div className="flex items-center gap-3.5 flex-wrap px-[18px] py-4">
        <div className="relative flex-none">
          <button
            onClick={() => setGlyphPicker((v) => !v)}
            className="text-2xl w-9 h-9 flex items-center justify-center rounded hover:bg-[#F4F5F7] transition"
          >
            {glyph}
          </button>
          {glyphPicker && (
            <div className="absolute top-10 left-0 z-20 grid grid-cols-6 gap-1 p-2 bg-white border border-[#D6D9E0] rounded-lg shadow-lg w-56">
              {LEAGUE_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setGlyph(e);
                    setGlyphPicker(false);
                  }}
                  className="text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-[#F4F5F7]"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm font-semibold outline-none focus:border-purple transition"
        />
        <div className="flex items-center gap-2 flex-none">
          <span className="text-xs text-[#8A909B] font-semibold">WEEKS</span>
          <Stepper value={weeks} onChange={setWeeks} min={1} />
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide ${
            isActive ? "bg-[#EAFBF1] text-[#1F9D55]" : "bg-[#F1F2F5] text-[#8A909B]"
          }`}
        >
          {isActive ? "LIVE" : "DRAFT"}
        </span>
        <button
          onClick={toggleActive}
          className="px-3.5 py-2 rounded-md border border-[#D6D9E0] text-[13.5px] font-semibold hover:border-purple hover:text-purple transition flex-none"
        >
          {isActive ? "Unpublish" : "Publish"}
        </button>
        {leagueId ? (
          <a
            href={publicLeagueUrl(leagueId)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-md border border-[#C9E9D6] bg-[#EAFBF1] text-[13.5px] font-semibold text-[#1F9D55] hover:bg-[#DCF6E7] transition flex-none"
          >
            View public league
          </a>
        ) : (
          <button
            onClick={createPublicLeague}
            disabled={creatingLeague}
            className="px-3.5 py-2 rounded-md border border-[#D6D9E0] text-[13.5px] font-semibold hover:border-purple hover:text-purple transition flex-none disabled:opacity-60"
          >
            {creatingLeague ? "Creating…" : "Create public league"}
          </button>
        )}
        <button
          onClick={remove}
          className="px-3.5 py-2 rounded-md border border-[#EBD3D9] bg-[#FDF2F4] text-[13.5px] font-semibold text-[#C2314E] hover:bg-[#F9E2E7] transition flex-none"
        >
          Delete
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-md border border-[#D6D9E0] flex items-center justify-center text-sm text-[#5B6270] hover:border-purple hover:text-purple transition flex-none"
        >
          {open ? "−" : "+"}
        </button>
      </div>

      {open && (
        <div className="px-[18px] pb-[18px] pt-1 border-t border-[#EDEFF3]">
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mt-3.5 mb-2.5">TEMPLATE DETAILS</div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            <Field label="Show or subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="The Great British Bake Off, S16"
                className={fieldInput}
              />
            </Field>
            <Field label="Tag">
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="GBBO"
                className={fieldInput}
              />
            </Field>
            <Field label="Scoring per week">
              <ChipGroup
                options={[1, 2, 3].map((n) => ({ id: String(n), label: String(n) }))}
                value={String(scoringPerWeek)}
                onChange={(v) => setScoringPerWeek(Number(v))}
              />
            </Field>
            <Field label="Picks due">
              <ChipGroup
                options={DUE_DAYS.map((d) => ({ id: d, label: DUE_DAY_LABELS[d] }))}
                value={dueDay}
                onChange={setDueDay}
              />
            </Field>
            <Field label="Drafting">
              <ChipGroup
                options={DRAFT_MODES.map((d) => ({ id: d.id, label: d.name }))}
                value={draftMode}
                onChange={setDraftMode}
              />
            </Field>
            <Field label="Draft opens (Pacific time)">
              <div className="flex items-center gap-2">
                <select
                  value={draftOpenDay}
                  onChange={(e) => setDraftOpenDay(e.target.value)}
                  className={fieldInput}
                >
                  <option value="">No day set</option>
                  {DUE_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {DUE_DAY_LABELS[d]}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={draftOpenTime}
                  onChange={(e) => setDraftOpenTime(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </Field>
          </div>

          <Field label="Description shown to commissioners">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Draft bakers, score signature, technical, and showstopper."
              className={`${fieldInput} resize-y mt-3.5`}
            />
          </Field>

          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mt-5 mb-1">
            CONTESTANTS ({contestants.length})
          </div>
          <p className="text-xs text-[#8A909B] mb-2.5">
            Mark someone eliminated once they&apos;re out — they stay listed for history but won&apos;t be
            selectable in the following week&apos;s draft.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {contestants.map((c, i) => {
              const isOut = eliminated.includes(c);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-md border ${
                    isOut ? "bg-[#FDF2F4] border-[#F3C6CF]" : "bg-[#F8F9FB] border-[#EDEFF3]"
                  }`}
                >
                  <input
                    value={c}
                    onChange={(e) => setContestants((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    className={`w-32 py-0.5 bg-transparent border-none text-sm outline-none ${
                      isOut ? "line-through text-[#C2314E]" : ""
                    }`}
                  />
                  <button
                    onClick={() => toggleEliminated(c)}
                    className={`px-2 py-1 rounded text-[11px] font-bold tracking-wide flex-none ${
                      isOut ? "bg-[#C2314E] text-white" : "bg-[#EDEFF3] text-[#5B6270] hover:bg-[#E2E4E9]"
                    }`}
                  >
                    {isOut ? "OUT" : "Eliminate"}
                  </button>
                  <button
                    onClick={() => setContestants((prev) => prev.filter((_, j) => j !== i))}
                    className="text-[#A7ADB8] hover:text-[#C2314E] text-base px-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {contestants.length === 0 && <p className="text-sm text-[#8A909B]">No contestants added yet.</p>}
          </div>
          <div className="flex gap-2 flex-wrap mb-1">
            <input
              value={contestantDraft}
              onChange={(e) => setContestantDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addContestant())}
              placeholder="Add a contestant name"
              className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-sm outline-none focus:border-purple transition"
            />
            <button
              onClick={addContestant}
              className="px-5 py-2.5 rounded-md bg-[#16181D] text-white font-semibold text-[13.5px] hover:bg-black transition"
            >
              Add contestant
            </button>
          </div>

          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mt-5 mb-2.5">SCORING RULES</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md bg-[#F8F9FB] border border-[#EDEFF3]">
                <input
                  value={r.label}
                  onChange={(e) =>
                    setRules((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                  }
                  className="flex-1 min-w-0 py-1.5 bg-transparent border-none text-sm outline-none"
                />
                <Stepper
                  value={r.points}
                  onChange={(v) => setRules((prev) => prev.map((x, j) => (j === i ? { ...x, points: v } : x)))}
                />
                <button
                  onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))}
                  className="text-[#A7ADB8] hover:text-[#C2314E] text-base px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              value={ruleDraft}
              onChange={(e) => setRuleDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRule())}
              placeholder="Add a rule"
              className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-sm outline-none focus:border-purple transition"
            />
            <button
              onClick={addRule}
              className="px-5 py-2.5 rounded-md bg-[#16181D] text-white font-semibold text-[13.5px] hover:bg-black transition"
            >
              Add rule
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 mt-5">
            {error && <p className="text-sm text-[#C2314E] font-medium">{error}</p>}
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 rounded-md bg-purple text-white font-bold text-sm hover:bg-[#6a1fe0] transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldInput =
  "w-full px-3 py-2.5 rounded-md border border-[#D6D9E0] bg-white text-[#16181D] font-sans text-sm outline-none focus:border-purple transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] text-[#6B7280] font-semibold mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Stepper({ value, onChange, min }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(min ?? -999, value - 1))}
        className="w-6 h-6 rounded border border-[#D6D9E0] flex items-center justify-center text-sm text-[#5B6270] hover:border-purple"
      >
        −
      </button>
      <span className="text-sm font-bold min-w-[28px] text-center">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded border border-[#D6D9E0] flex items-center justify-center text-sm text-[#5B6270] hover:border-purple"
      >
        +
      </button>
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition ${
            value === o.id
              ? "bg-purple text-white border-purple"
              : "bg-white text-[#5B6270] border-[#D6D9E0] hover:border-purple"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
