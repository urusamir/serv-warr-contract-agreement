import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, Loader2, Send } from "lucide-react";
import logoBlack from "@/assets/kavak-logo-black.png";
import { steps, type Step } from "@/lib/reportSchema";
import { buildPayload } from "@/lib/buildPayload";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WEBHOOK_URL = "https://samirdoesai.app.n8n.cloud/webhook/service-report";

type Answers = Record<string, any>;

const variants = {
  enter: (dir: number) => ({ y: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -60 : 60, opacity: 0 }),
};

const Report = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>(() => {
    const init: Answers = {};
    for (const s of steps) {
      if (s.kind === "text" && s.defaultValue) init[s.id] = s.defaultValue;
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);

  const total = steps.length;
  const step = steps[index];
  const progress = ((index + 1) / total) * 100;

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);
  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const setAnswer = (id: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const submit = useCallback(async () => {
    setSubmitting(true);
    const payload = buildPayload(answers);
    try {
      // 1. POST to webhook
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      // 2. Generate & download the PDF in the original format
      try {
        downloadReportPdf(answers);
      } catch (pdfErr) {
        console.error("PDF generation failed", pdfErr);
        toast.error("Report submitted, but PDF generation failed.");
      }

      toast.success("Report submitted");
      navigate("/report/done");
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTextarea = target?.tagName === "TEXTAREA";
      if (e.key === "ArrowDown" && !isTextarea) {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" && !isTextarea) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Enter" && !e.shiftKey && !isTextarea) {
        e.preventDefault();
        if (step.kind === "review") submit();
        else goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, step, submit]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
        <Link to="/">
          <img src={logoBlack} alt="Kavak" className="h-6 md:h-7 w-auto" />
        </Link>
        <div className="text-xs md:text-sm text-muted-foreground tabular-nums">
          {index + 1} / {total}
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-10">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepView
                step={step}
                answer={answers[step.id]}
                answers={answers}
                onChange={(v) => setAnswer(step.id, v)}
                onNext={goNext}
                onSubmit={submit}
                submitting={submitting}
                onJumpTo={(id) => {
                  const i = steps.findIndex((s) => s.id === id);
                  if (i >= 0) {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Bottom controls + progress */}
      <footer className="border-t border-border bg-background">
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between px-6 md:px-10 py-3 gap-3">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-30 transition text-sm font-medium"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="text-xs text-muted-foreground hidden md:block">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Enter</kbd> to continue
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="h-9 w-9 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-30 transition flex items-center justify-center"
              aria-label="Previous"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              disabled={index === total - 1}
              className="h-9 w-9 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-30 transition flex items-center justify-center"
              aria-label="Next"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Report;

/* ---------------- Step renderer ---------------- */

function StepView({
  step,
  answer,
  answers,
  onChange,
  onNext,
  onSubmit,
  submitting,
  onJumpTo,
}: {
  step: Step;
  answer: any;
  answers: Answers;
  onChange: (v: any) => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
  onJumpTo: (id: string) => void;
}) {
  if (step.kind === "intro") {
    return (
      <div className="text-center py-10">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{step.title}</h1>
        {step.subtitle && (
          <p className="mt-5 text-lg md:text-xl text-muted-foreground">{step.subtitle}</p>
        )}
        <button
          onClick={onNext}
          className="mt-10 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 font-semibold hover:opacity-90 transition"
        >
          Start <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  if (step.kind === "section") {
    return (
      <div className="py-10">
        <div className="text-sm font-semibold uppercase tracking-widest text-primary">
          Section
        </div>
        <h2 className="mt-3 text-4xl md:text-6xl font-black tracking-tight">{step.title}</h2>
        {step.subtitle && (
          <p className="mt-4 text-lg text-muted-foreground">{step.subtitle}</p>
        )}
        <OkButton onClick={onNext} label="Continue" />
      </div>
    );
  }

  if (step.kind === "review") {
    return <ReviewView answers={answers} onJumpTo={onJumpTo} onSubmit={onSubmit} submitting={submitting} />;
  }

  // "Field" steps share a layout
  return (
    <FieldShell label={"label" in step ? step.label : ""} section={step.section}>
      {step.kind === "text" && (
        <TextField value={answer ?? ""} onChange={onChange} onEnter={onNext} placeholder={step.placeholder} />
      )}
      {step.kind === "longtext" && (
        <LongTextField value={answer ?? ""} onChange={onChange} placeholder={step.placeholder} />
      )}
      {step.kind === "number" && (
        <NumberField value={answer ?? ""} onChange={onChange} onEnter={onNext} unit={step.unit} />
      )}
      {step.kind === "date" && (
        <DateTimeField type="date" value={answer ?? ""} onChange={onChange} onEnter={onNext} />
      )}
      {step.kind === "time" && (
        <DateTimeField type="time" value={answer ?? ""} onChange={onChange} onEnter={onNext} />
      )}
      {step.kind === "select" && (
        <SelectField value={answer ?? ""} onChange={(v) => { onChange(v); setTimeout(onNext, 200); }} options={step.options} />
      )}
      {step.kind === "yesno" && (
        <YesNoField value={answer} onChange={(v) => { onChange(v); setTimeout(onNext, 200); }} />
      )}
      {step.kind === "checklist" && (
        <ChecklistField value={answer} onChange={onChange} actions={step.actions} withNotes={!!step.withNotes} />
      )}
      {step.kind === "multinumber" && (
        <MultiNumberField value={answer} onChange={onChange} fields={step.fields} unit={step.unit} />
      )}
      {step.kind === "multiselect" && (
        <MultiSelectField value={answer} onChange={onChange} options={step.options} />
      )}

      {step.kind !== "select" && step.kind !== "yesno" && (
        <OkButton onClick={onNext} />
      )}
    </FieldShell>
  );
}

/* ---------------- Layout primitives ---------------- */

function FieldShell({ label, section, children }: { label: string; section?: string; children: React.ReactNode }) {
  return (
    <div className="py-6">
      {section && (
        <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          {section}
        </div>
      )}
      <h3 className="text-2xl md:text-4xl font-bold tracking-tight leading-snug">{label}</h3>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function OkButton({ onClick, label = "OK" }: { onClick: () => void; label?: string }) {
  return (
    <div className="mt-10 flex items-center gap-3">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-6 py-3 font-semibold hover:opacity-90 transition"
      >
        {label}
        <Check className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground hidden md:inline">
        press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Enter</kbd>
      </span>
    </div>
  );
}

/* ---------------- Field components ---------------- */

function TextField({
  value, onChange, onEnter, placeholder,
}: { value: string; onChange: (v: string) => void; onEnter: () => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <input
      ref={ref}
      className="kavak-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
      placeholder={placeholder ?? "Type your answer..."}
    />
  );
}

function LongTextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <textarea
      ref={ref}
      className="kavak-textarea"
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Type your answer... (Shift+Enter for newline)"}
    />
  );
}

function NumberField({
  value, onChange, onEnter, unit,
}: { value: string | number; onChange: (v: number | "") => void; onEnter: () => void; unit?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="flex items-baseline gap-3">
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        className="kavak-input flex-1"
        value={value as any}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
        placeholder="0"
      />
      {unit && <span className="text-xl md:text-2xl text-muted-foreground">{unit}</span>}
    </div>
  );
}

function DateTimeField({
  type, value, onChange, onEnter,
}: { type: "date" | "time"; value: string; onChange: (v: string) => void; onEnter: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <input
      ref={ref}
      type={type}
      className="kavak-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
    />
  );
}

function SelectField({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="grid gap-2 max-w-lg">
      {options.map((opt, i) => {
        const selected = value === opt;
        const key = String.fromCharCode(65 + i);
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "group flex items-center gap-3 text-left px-4 py-3 rounded-md border-2 transition",
              selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <span className={cn(
              "h-6 w-6 inline-flex items-center justify-center rounded text-xs font-bold border",
              selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"
            )}>{key}</span>
            <span className="text-base md:text-lg font-medium">{opt}</span>
            {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
          </button>
        );
      })}
    </div>
  );
}

function YesNoField({ value, onChange }: { value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[
        { label: "Yes", v: true, key: "Y" },
        { label: "No", v: false, key: "N" },
      ].map((o) => {
        const selected = value === o.v;
        return (
          <button
            key={o.label}
            onClick={() => onChange(o.v)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-md border-2 transition font-semibold",
              selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <span className={cn(
              "h-6 w-6 inline-flex items-center justify-center rounded text-xs font-bold border",
              selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"
            )}>{o.key}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type ChecklistValue = { actions: string[]; notes: string };
function ChecklistField({
  value, onChange, actions, withNotes,
}: { value: ChecklistValue | undefined; onChange: (v: ChecklistValue) => void; actions: string[]; withNotes: boolean }) {
  const v: ChecklistValue = value ?? { actions: [], notes: "" };
  const toggle = (a: string) => {
    const has = v.actions.includes(a);
    onChange({ ...v, actions: has ? v.actions.filter((x) => x !== a) : [...v.actions, a] });
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const selected = v.actions.includes(a);
          return (
            <button
              key={a}
              onClick={() => toggle(a)}
              className={cn(
                "px-4 py-2 rounded-full border-2 text-sm font-semibold transition",
                selected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
              )}
            >
              {selected && <Check className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />}
              {a}
            </button>
          );
        })}
      </div>
      {withNotes && (
        <textarea
          className="kavak-textarea text-base md:text-lg"
          rows={2}
          placeholder="Notes (optional)"
          value={v.notes}
          onChange={(e) => onChange({ ...v, notes: e.target.value })}
        />
      )}
    </div>
  );
}

function MultiNumberField({
  value, onChange, fields, unit,
}: { value: Record<string, number> | undefined; onChange: (v: Record<string, number>) => void; fields: { id: string; label: string }[]; unit?: string }) {
  const v = value ?? {};
  return (
    <div className="grid grid-cols-2 gap-4 max-w-xl">
      {fields.map((f) => (
        <label key={f.id} className="block">
          <span className="text-sm text-muted-foreground">{f.label}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <input
              type="number"
              inputMode="decimal"
              className="w-full bg-transparent border-0 border-b-2 border-border focus:border-primary focus:outline-none text-2xl md:text-3xl font-medium py-2 transition-colors"
              value={(v[f.id] as any) ?? ""}
              onChange={(e) =>
                onChange({ ...v, [f.id]: e.target.value === "" ? (undefined as any) : Number(e.target.value) })
              }
              placeholder="0"
            />
            {unit && <span className="text-base text-muted-foreground">{unit}</span>}
          </div>
        </label>
      ))}
    </div>
  );
}

function MultiSelectField({
  value, onChange, options,
}: { value: string[] | undefined; onChange: (v: string[]) => void; options: string[] }) {
  const v = value ?? [];
  const toggle = (o: string) => {
    onChange(v.includes(o) ? v.filter((x) => x !== o) : [...v, o]);
  };
  return (
    <div className="grid gap-2 max-w-xl">
      {options.map((o) => {
        const selected = v.includes(o);
        return (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={cn(
              "flex items-center gap-3 text-left px-4 py-3 rounded-md border-2 transition",
              selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <span className={cn(
              "h-5 w-5 rounded border-2 inline-flex items-center justify-center",
              selected ? "bg-primary border-primary" : "border-border"
            )}>
              {selected && <Check className="h-3 w-3 text-primary-foreground" />}
            </span>
            <span className="font-medium">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Review ---------------- */

function ReviewView({
  answers, onJumpTo, onSubmit, submitting,
}: { answers: Answers; onJumpTo: (id: string) => void; onSubmit: () => void; submitting: boolean }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; label: string; value: any }[]>();
    for (const s of steps) {
      if (!("section" in s)) continue;
      const sec = (s as any).section as string;
      const arr = map.get(sec) ?? [];
      arr.push({ id: s.id, label: (s as any).label, value: answers[s.id] });
      map.set(sec, arr);
    }
    return Array.from(map.entries());
  }, [answers]);

  return (
    <div className="py-6">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
        Review
      </div>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight">
        Looks good? Submit your report.
      </h2>
      <p className="mt-3 text-muted-foreground">Click any answer to edit it.</p>

      <div className="mt-8 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
        {grouped.map(([section, items]) => (
          <div key={section}>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70 mb-2">
              {section}
            </h3>
            <ul className="divide-y divide-border border border-border rounded-md">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => onJumpTo(it.id)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/60 transition flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{it.label}</div>
                      <div className="text-sm font-medium truncate">
                        {formatValue(it.value)}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="mt-10 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 font-bold hover:opacity-90 transition disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {submitting ? "Submitting..." : "Submit report"}
      </button>
    </div>
  );
}

function formatValue(v: any): string {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") {
    if ("actions" in v || "notes" in v) {
      const acts = (v.actions ?? []).join(", ");
      const notes = v.notes ? ` · ${v.notes}` : "";
      return (acts || "—") + notes;
    }
    return Object.entries(v)
      .map(([k, val]) => `${k}: ${val ?? "—"}`)
      .join(" · ");
  }
  return String(v);
}
