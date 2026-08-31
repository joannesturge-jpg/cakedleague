"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DUE_DAYS,
  DUE_DAY_LABELS,
  DRAFT_MODES,
  PAY_METHODS,
  LEAGUE_EMOJIS,
} from "@/lib/leagues";

type TemplateRule = { id: string; label: string; points: number };
type Template = {
  id: string;
  name: string;
  subject: string;
  glyph: string;
  weeks: number;
  scoringPerWeek: number;
  dueDay: string;
  draftMode: string;
  description: string | null;
  rules: TemplateRule[];
};

type Rule = { label: string; points: number };
type PrizeRow = { place: string; type: "flat" | "pct"; value: number };

const PLACE_LABELS = ["1st", "2nd", "3rd", "4th"];

// Matches the design: picking a template skips the Drafting step
// entirely (the template already defines its drafting mechanic) — it
// only appears when starting a league from scratch.
const TEMPLATE_STEPS = [
  { key: "basics", label: "Basics" },
  { key: "scoring", label: "Scoring" },
  { key: "money", label: "Money" },
  { key: "review", label: "Review" },
];
const SCRATCH_STEPS = [
  { key: "basics", label: "Basics" },
  { key: "scoring", label: "Scoring" },
  { key: "money", label: "Money" },
  { key: "draft", label: "Drafting" },
  { key: "review", label: "Review" },
];

export function CreateLeagueWizard({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [glyph, setGlyph] = useState(LEAGUE_EMOJIS[0]);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleDraft, setRuleDraft] = useState("");
  const template = templates.find((t) => t.id === templateId) ?? null;
  const steps = template ? TEMPLATE_STEPS : SCRATCH_STEPS;
  const safeStep = Math.min(step, steps.length - 1);
  const currentKey = steps[safeStep].key;

  const [weeks, setWeeks] = useState(8);
  const [startDate, setStartDate] = useState("");
  const [scoringPerWeek, setScoringPerWeek] = useState(1);
  const [dueDay, setDueDay] = useState("SUNDAY");
  const [dueTime, setDueTime] = useState("20:00");

  const [draftMode, setDraftMode] = useState("SNAKE");
  const [draftModeDescription, setDraftModeDescription] = useState("");

  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFeeAmount, setEntryFeeAmount] = useState(20);
  const [entryFeePayMethod, setEntryFeePayMethod] = useState(PAY_METHODS[0] as string);
  const [entryFeeHandle, setEntryFeeHandle] = useState("");

  const [prizeEnabled, setPrizeEnabled] = useState(false);
  const [prizePlaces, setPrizePlaces] = useState(1);
  const [prizeRules, setPrizeRules] = useState<PrizeRow[]>([{ place: "1st", type: "pct", value: 100 }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; inviteCode: string } | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy link");

  function selectTemplate(t: Template) {
    setTemplateId(t.id);
    setRules(t.rules.map((r) => ({ label: r.label, points: r.points })));
    setWeeks(t.weeks);
    setScoringPerWeek(t.scoringPerWeek);
    setDueDay(t.dueDay);
    setDraftMode(t.draftMode);
  }

  function selectNoTemplate() {
    setTemplateId(null);
    setRules([]);
  }

  function addRule() {
    if (!ruleDraft.trim()) return;
    setRules((r) => [...r, { label: ruleDraft.trim(), points: 1 }]);
    setRuleDraft("");
  }

  function setPrizePlacesCount(n: number) {
    setPrizePlaces(n);
    setPrizeRules((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ place: PLACE_LABELS[next.length] ?? `${next.length + 1}th`, type: "pct", value: 0 });
      return next.slice(0, n);
    });
  }

  async function handleCreate() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          glyph,
          description,
          visibility,
          templateId,
          rules,
          weeks: template ? null : weeks,
          startDate: template ? null : startDate || null,
          scoringPerWeek: template ? null : scoringPerWeek,
          dueDay,
          dueTime,
          draftMode,
          draftModeDescription,
          entryFeeEnabled,
          entryFeeAmount,
          entryFeePayMethod,
          entryFeeHandle,
          prizeEnabled,
          prizePlaces,
          prizeRules,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function copyInvite() {
    if (!result) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${result.inviteCode}`);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy link"), 1500);
  }

  if (result) {
    return (
      <div className="px-5 sm:px-10 py-14 max-w-2xl mx-auto text-center">
        <div
          className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center text-5xl"
          style={{ background: "linear-gradient(140deg,#7B2CF5,#E85BAE)" }}
        >
          {glyph}
        </div>
        <p className="font-script text-4xl text-pink leading-none">it is alive</p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wide mt-2 mb-2">{name}</h1>
        <p className="text-cream/60 mb-7">Your league is ready. Share the link below to bring people in.</p>

        <div className="flex items-center gap-2.5 max-w-md mx-auto mb-4">
          <div className="flex-1 px-[18px] py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-sm text-cream/70 text-left truncate">
            {typeof window !== "undefined" ? `${window.location.origin}/join/${result.inviteCode}` : result.inviteCode}
          </div>
          <button
            onClick={copyInvite}
            className="px-5 py-3.5 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition whitespace-nowrap"
          >
            {copyLabel}
          </button>
        </div>
        <p className="text-xs text-cream/45 mb-6">
          {visibility === "PRIVATE"
            ? "Anyone with this link can join. Private leagues never appear on a public page."
            : "Anyone with this link can join."}
        </p>
        <button
          onClick={() => router.push(`/leagues/${result.id}`)}
          className="px-8 py-4 rounded-full bg-purple text-cream font-extrabold text-base hover:bg-[#8f47ff] transition shadow-[0_12px_30px_rgba(123,44,245,.34)]"
        >
          View league
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-10 py-10 sm:py-14 pb-20 max-w-3xl mx-auto">
      <p className="font-script text-3xl sm:text-4xl text-pink leading-none">let&apos;s build it</p>
      <h1 className="font-display text-4xl sm:text-5xl tracking-wide mb-6">START A LEAGUE</h1>

      <div className="flex gap-2 flex-wrap mb-7">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold transition ${
              i === safeStep ? "bg-pink text-ink" : "bg-card text-cream/60 hover:text-cream"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                i === safeStep ? "bg-ink/20" : "bg-cream/10"
              }`}
            >
              {i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-cream/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {currentKey === "basics" && (
          <div className="flex flex-col gap-6">
            <Field label="League name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Soggy Bottom Society"
                className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-display text-xl tracking-wide outline-none focus:border-pink transition"
              />
            </Field>

            <Field label="League image">
              <div className="flex gap-5 items-start flex-wrap">
                <div
                  className="w-[76px] h-[76px] rounded-2xl flex-none flex items-center justify-center text-4xl"
                  style={{ background: "linear-gradient(140deg,#7B2CF5,#E85BAE)" }}
                >
                  {glyph}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {LEAGUE_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setGlyph(e)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition ${
                        glyph === e ? "bg-pink/25 border border-pink" : "bg-ink/40 border border-cream/10 hover:border-cream/30"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Who this league is for and what makes it worth joining."
                className="w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm leading-relaxed outline-none focus:border-pink transition resize-y"
              />
            </Field>

            <Field label="Visibility">
              <div className="flex gap-2">
                {(["PRIVATE", "PUBLIC"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition ${
                      visibility === v ? "bg-pink text-ink border-pink" : "border-cream/20 text-cream/70 hover:border-cream/40"
                    }`}
                  >
                    {v === "PRIVATE" ? "Private — invite link only" : "Public — anyone can find it"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {currentKey === "scoring" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-display text-2xl tracking-wide mb-1">START FROM A TEMPLATE</h3>
              <p className="text-sm text-cream/60 mb-4">
                Prebuilt scoring for shows people already argue about. Every rule stays editable after you create the league.
              </p>
              <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`text-left p-4 rounded-2xl border transition ${
                      templateId === t.id ? "border-pink bg-pink/10" : "border-cream/12 bg-ink/30 hover:border-cream/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{t.glyph}</span>
                      {templateId === t.id && <span className="text-pink text-lg">✓</span>}
                    </div>
                    <h4 className="font-display text-lg tracking-wide mb-1">{t.name}</h4>
                    <p className="text-xs text-cream/55 leading-relaxed">{t.description || t.subject}</p>
                  </button>
                ))}
                <button
                  onClick={selectNoTemplate}
                  className={`text-left p-4 rounded-2xl border transition ${
                    templateId === null ? "border-pink bg-pink/10" : "border-cream/12 bg-ink/30 hover:border-cream/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">✨</span>
                    {templateId === null && <span className="text-pink text-lg">✓</span>}
                  </div>
                  <h4 className="font-display text-lg tracking-wide mb-1">START FROM SCRATCH</h4>
                  <p className="text-xs text-cream/55 leading-relaxed">Set your own season length and scoring rules.</p>
                </button>
              </div>
            </div>

            {template ? (
              <div className="border-t border-cream/10 pt-6">
                <h3 className="font-display text-xl tracking-wide mb-1">{template.name} RULES</h3>
                <p className="text-sm text-cream/55 mb-3">
                  {template.weeks} weeks · {template.scoringPerWeek}x scoring per week
                </p>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple/15 border border-purple/40 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-lilac flex-none" />
                  <span className="text-sm text-lilac font-medium">
                    Adjust the points below however you like — nothing here is locked in.
                  </span>
                </div>
                <RuleEditor rules={rules} setRules={setRules} ruleDraft={ruleDraft} setRuleDraft={setRuleDraft} addRule={addRule} />
              </div>
            ) : (
              <div className="border-t border-cream/10 pt-6">
                <h3 className="font-display text-xl tracking-wide mb-1">SCORING FREQUENCY</h3>
                <p className="text-sm text-cream/55 mb-4">Set the rhythm of your season. You can add point rules once the league exists.</p>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                  <Field label="Season length">
                    <NumberStepper value={weeks} onChange={setWeeks} min={1} suffix=" weeks" />
                  </Field>
                  <Field label="Start date">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Scoring per week">
                    <ChipGroup
                      options={[1, 2, 3].map((n) => ({ id: String(n), label: String(n) }))}
                      value={String(scoringPerWeek)}
                      onChange={(v) => setScoringPerWeek(Number(v))}
                    />
                  </Field>
                </div>
                <div className="mt-6">
                  <RuleEditor
                    rules={rules}
                    setRules={setRules}
                    ruleDraft={ruleDraft}
                    setRuleDraft={setRuleDraft}
                    addRule={addRule}
                    label="Point rules (optional)"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-cream/10 pt-6">
              <h3 className="font-display text-xl tracking-wide mb-1">SUBMISSION DUE DATE</h3>
              <p className="text-sm text-cream/55 mb-4">When picks lock each round. Late submissions score zero.</p>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <Field label="Day">
                  <ChipGroup options={DUE_DAYS.map((d) => ({ id: d, label: DUE_DAY_LABELS[d] }))} value={dueDay} onChange={setDueDay} />
                </Field>
                <Field label="Time">
                  <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={inputClass} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {currentKey === "draft" && (
          <div>
            <h3 className="font-display text-2xl tracking-wide mb-1">HOW SHOULD DRAFTING WORK?</h3>
            <p className="text-sm text-cream/58 mb-5">This is the move each member makes.</p>
            <div className="flex flex-col gap-3">
              {DRAFT_MODES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDraftMode(d.id)}
                  className={`text-left flex items-start gap-3.5 p-4 rounded-2xl border transition ${
                    draftMode === d.id ? "border-pink bg-pink/10" : "border-cream/12 bg-ink/30 hover:border-cream/30"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full mt-1 flex-none border-2 ${
                      draftMode === d.id ? "bg-pink border-pink" : "border-cream/30"
                    }`}
                  />
                  <div>
                    <h4 className="font-display text-lg tracking-wide mb-0.5">{d.name}</h4>
                    <p className="text-xs text-cream/55 leading-relaxed">{d.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {draftMode === "AI" && (
              <div className="mt-4">
                <Field label="Describe your format">
                  <textarea
                    value={draftModeDescription}
                    onChange={(e) => setDraftModeDescription(e.target.value)}
                    rows={3}
                    placeholder="Everyone drafts three bakers in a snake order, swaps allowed once mid season…"
                    className={`${inputClass} resize-y`}
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {currentKey === "money" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-display text-2xl tracking-wide mb-1">MONEY RULES</h3>
              <p className="text-sm text-cream/58">Optional. Plenty of leagues run on pride alone.</p>
            </div>

            <ToggleSection
              title="ENTRY FEE"
              desc="Charge each member to join. You collect it, we just tell them where to send it."
              on={entryFeeEnabled}
              onToggle={() => setEntryFeeEnabled((v) => !v)}
            >
              <Field label="Amount per person">
                <NumberStepper value={entryFeeAmount} onChange={setEntryFeeAmount} min={0} prefix="$" />
              </Field>
              <Field label="Where should they send it?">
                <ChipGroup options={PAY_METHODS.map((m) => ({ id: m, label: m }))} value={entryFeePayMethod} onChange={setEntryFeePayMethod} />
              </Field>
              <Field label={`${entryFeePayMethod} handle`}>
                <input
                  value={entryFeeHandle}
                  onChange={(e) => setEntryFeeHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className={inputClass}
                />
              </Field>
            </ToggleSection>

            <ToggleSection
              title="PRIZE WINNINGS"
              desc="Decide who gets paid and how much."
              on={prizeEnabled}
              onToggle={() => setPrizeEnabled((v) => !v)}
            >
              <Field label="How many places pay out?">
                <ChipGroup
                  options={[1, 2, 3, 4].map((n) => ({ id: String(n), label: String(n) }))}
                  value={String(prizePlaces)}
                  onChange={(v) => setPrizePlacesCount(Number(v))}
                />
              </Field>
              <div className="flex flex-col gap-2.5">
                {prizeRules.map((p, i) => (
                  <div key={p.place} className="flex items-center gap-3 flex-wrap p-3.5 rounded-xl bg-ink/50 border border-cream/10">
                    <span className="font-display text-lg min-w-[56px]">{p.place}</span>
                    <div className="flex gap-1.5">
                      {(["flat", "pct"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setPrizeRules((prev) => prev.map((x, j) => (j === i ? { ...x, type } : x)))}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition ${
                            p.type === type ? "bg-pink text-ink" : "bg-ink/60 text-cream/60 border border-cream/15"
                          }`}
                        >
                          {type === "flat" ? "$" : "%"}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2.5 flex-1 justify-end">
                      <NumberStepper
                        value={p.value}
                        onChange={(v) => setPrizeRules((prev) => prev.map((x, j) => (j === i ? { ...x, value: v } : x)))}
                        min={0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ToggleSection>
          </div>
        )}

        {currentKey === "review" && (
          <div>
            <h3 className="font-display text-2xl tracking-wide mb-1">CHECK IT OVER</h3>
            <p className="text-sm text-cream/58 mb-5">Here is your league. Everything stays editable after you create it.</p>

            <div className="flex gap-[18px] items-center p-5 rounded-2xl bg-ink/50 border border-cream/12 mb-3.5">
              <div
                className="w-[70px] h-[70px] rounded-2xl flex-none flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(140deg,#7B2CF5,#E85BAE)" }}
              >
                {glyph}
              </div>
              <div>
                <h4 className="font-display text-2xl tracking-wide mb-1">{name || "Untitled league"}</h4>
                <p className="text-sm text-cream/58">{description || "No description yet."}</p>
              </div>
            </div>

            <div className="grid gap-3 mb-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              <Fact label="Template" value={template ? template.name : "Custom"} />
              <Fact label="Drafting" value={DRAFT_MODES.find((d) => d.id === draftMode)?.name ?? draftMode} />
              <Fact label="Picks due" value={`${DUE_DAY_LABELS[dueDay]}s, ${dueTime}`} />
              <Fact label="Visibility" value={visibility === "PUBLIC" ? "Public" : "Private"} />
              <Fact label="Entry fee" value={entryFeeEnabled ? `$${entryFeeAmount} via ${entryFeePayMethod}` : "None"} />
              <Fact label="Prize" value={prizeEnabled ? `${prizePlaces} place${prizePlaces > 1 ? "s" : ""} pay out` : "None"} />
            </div>

            {rules.length > 0 && (
              <div className="p-5 rounded-2xl bg-ink/50 border border-cream/10">
                <div className="text-[10.5px] tracking-widest text-cream/36 font-bold mb-3">SCORING RULES</div>
                <div className="flex flex-col gap-1.5">
                  {rules.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-cream/72">{r.label}</span>
                      <span className="font-display text-base">{r.points > 0 ? `+${r.points}` : r.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-pink font-medium mt-4">{error}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={safeStep === 0}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-cream/60 hover:text-cream transition disabled:opacity-0"
        >
          Back
        </button>
        {safeStep < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={currentKey === "basics" && !name.trim()}
            className="px-7 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={submitting || !name.trim()}
            className="px-7 py-3 rounded-full bg-pink text-ink font-extrabold text-sm hover:bg-cream transition disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create league"}
          </button>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3.5 rounded-xl bg-ink/60 border border-cream/15 text-cream font-sans text-[15px] outline-none focus:border-pink transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-2">{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-ink/50 border border-cream/10">
      <div className="text-[10.5px] tracking-widest text-cream/36 font-bold mb-1.5">{label.toUpperCase()}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  prefix,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-ink/60 border border-cream/15 max-w-[220px]">
      <button onClick={() => onChange(Math.max(min ?? -Infinity, value - 1))} className="font-display text-xl text-pink">
        −
      </button>
      <span className="flex-1 text-center font-display text-lg">
        {prefix}
        {value}
        {suffix}
      </span>
      <button onClick={() => onChange(value + 1)} className="font-display text-xl text-pink">
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
          className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
            value === o.id ? "bg-pink text-ink border-pink" : "bg-ink/40 text-cream/65 border-cream/15 hover:border-cream/35"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RuleEditor({
  rules,
  setRules,
  ruleDraft,
  setRuleDraft,
  addRule,
  label = "Point rules",
}: {
  rules: Rule[];
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  ruleDraft: string;
  setRuleDraft: (v: string) => void;
  addRule: () => void;
  label?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-widest text-cream/46 mb-2">{label.toUpperCase()}</label>
      <div className="flex flex-col gap-2 mb-3">
        {rules.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-2xl bg-ink/55 border border-cream/10">
            <input
              value={r.label}
              onChange={(e) => setRules((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              className="flex-1 min-w-0 py-2 bg-transparent border-none text-cream text-sm outline-none"
            />
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-cream/5 flex-none">
              <button
                onClick={() => setRules((prev) => prev.map((x, j) => (j === i ? { ...x, points: x.points - 1 } : x)))}
                className="font-display text-lg text-pink px-1"
              >
                −
              </button>
              <span className="font-display text-base min-w-[40px] text-center">{r.points > 0 ? `+${r.points}` : r.points}</span>
              <button
                onClick={() => setRules((prev) => prev.map((x, j) => (j === i ? { ...x, points: x.points + 1 } : x)))}
                className="font-display text-lg text-pink px-1"
              >
                +
              </button>
            </div>
            <button onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))} className="text-cream/32 hover:text-pink text-lg px-1.5">
              ×
            </button>
          </div>
        ))}
        {rules.length === 0 && <p className="text-xs text-cream/40">No rules yet — add one below.</p>}
      </div>
      <div className="flex gap-2.5 flex-wrap">
        <input
          value={ruleDraft}
          onChange={(e) => setRuleDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRule())}
          placeholder="Add a rule, for example Wins the season finale"
          className="flex-1 min-w-[220px] px-4 py-3 rounded-xl bg-ink/60 border border-cream/15 text-cream text-sm outline-none focus:border-pink transition"
        />
        <button onClick={addRule} className="px-5 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition">
          Add rule
        </button>
      </div>
    </div>
  );
}

function ToggleSection({
  title,
  desc,
  on,
  onToggle,
  children,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-cream/12 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3.5 p-5 bg-ink/40 text-left">
        <span className={`w-10 h-6 rounded-full relative transition ${on ? "bg-pink" : "bg-cream/15"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
        </span>
        <div className="flex-1">
          <h4 className="font-display text-xl tracking-wide mb-0.5">{title}</h4>
          <p className="text-xs text-cream/55">{desc}</p>
        </div>
      </button>
      {on && <div className="p-5 border-t border-cream/12 flex flex-col gap-5">{children}</div>}
    </div>
  );
}
