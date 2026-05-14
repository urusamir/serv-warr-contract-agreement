import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, Loader2, Send } from "lucide-react";
import logoBlack from "@/assets/kavak-logo-black.png";
import {
  steps,
  allFieldSteps,
  type Step,
  type FieldStep,
  type ServiceTier,
  SERVICE_TIER_LABEL,
  getActionsForTier,
} from "@/lib/reportSchema";
import { buildPayload } from "@/lib/buildPayload";
import { generateReportPdf, saveGeneratedPdf } from "@/lib/generateReportPdf";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { sendReportWebhook } from "@/lib/sendReportWebhook";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [inquiryAutoFilled, setInquiryAutoFilled] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const inquiryId = (answers["vehicle.inquiry_id"] as string)?.trim();
    if (!inquiryId) {
      setInquiryStatus("idle");
      setInquiryAutoFilled(new Set());
      return;
    }
    setInquiryAutoFilled(new Set());
    setInquiryStatus("loading");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("service_reports_vehicle_customers")
        .select("vin_no,car_detail,car_id,no_plate,customer_name,customer_phone,customer_email,service_advisor")
        .eq("inquiry_id", inquiryId)
        .maybeSingle();
      if (data) {
        const filled = new Set<string>();
        const patch: Answers = {};
        const map: [string, string][] = [
          ["vin_no",          "vehicle.vin"],
          ["car_detail",      "vehicle.make_model"],
          ["car_id",          "vehicle.registration_number"],
          ["no_plate",        "vehicle.no_plate"],
          ["customer_name",   "customer.name"],
          ["customer_phone",  "customer.contact"],
          ["customer_email",  "customer.email"],
          ["service_advisor", "service_advisor.name"],
        ];
        for (const [col, key] of map) {
          if (data[col]) { patch[key] = data[col]; filled.add(key); }
        }
        setAnswers(prev => ({ ...prev, ...patch }));
        setInquiryAutoFilled(filled);
        setInquiryStatus("found");
      } else {
        setInquiryStatus("not_found");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [answers["vehicle.inquiry_id"]]);

  const total = steps.length;
  const step = steps[index];
  const progress = ((index + 1) / total) * 100;

  const tier: ServiceTier | undefined = answers["service.type"];

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
      const doc = await generateReportPdf(answers);

      try {
        await uploadToSupabase(doc, answers, payload);
      } catch (supabaseErr) {
        console.error("Supabase upload failed", supabaseErr);
        toast.error("Report saved locally, but cloud backup failed.");
      }

      try {
        await sendReportWebhook(doc, answers);
      } catch (webhookErr) {
        console.error("Webhook failed", webhookErr);
        toast.error("Report submitted, but failed to send email to service advisor.");
      }

      saveGeneratedPdf(doc, answers);
      toast.success("Report submitted");
      navigate("/report/done");
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [index]);

  const canAdvance = useCallback(() => {
    if (step.kind === "service-type") return !!tier;
    if (step.kind === "page" && step.id === "p-vehicle-1") {
      return !!(answers["vehicle.inquiry_id"] as string)?.trim();
    }
    return true;
  }, [step, tier, answers]);

  const tryGoNext = useCallback(() => {
    if (!canAdvance()) {
      if (step.kind === "service-type") toast.error("Please select a service type to continue.");
      else toast.error("Inquiry ID is required. Please enter the Inquiry ID to continue.");
      return;
    }
    goNext();
  }, [canAdvance, goNext, step]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable =
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (e.key === "Enter" && !e.shiftKey && !isEditable) {
        e.preventDefault();
        if (step.kind === "review") submit();
        else tryGoNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryGoNext, step, submit]);

  const jumpToField = useCallback((fieldId: string) => {
    const f = allFieldSteps.find((x) => x.id === fieldId);
    if (!f) return;
    const i = steps.findIndex((s) => s.kind === "page" && s.id === f.page);
    if (i >= 0) {
      setDirection(i > index ? 1 : -1);
      setIndex(i);
    }
  }, [index]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
        <Link to="/">
          <img src={logoBlack} alt="Kavak" className="h-6 md:h-7 w-auto" />
        </Link>
        <div className="text-xs md:text-sm text-muted-foreground tabular-nums">
          {index + 1} / {total}
        </div>
      </header>

      <section className="flex-1 flex items-start md:items-center justify-center px-6 md:px-10 py-10">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepView
                step={step}
                tier={tier}
                answers={answers}
                setAnswer={setAnswer}
                onNext={tryGoNext}
                onSubmit={submit}
                submitting={submitting}
                onJumpTo={jumpToField}
                inquiryStatus={inquiryStatus}
                inquiryAutoFilled={inquiryAutoFilled}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <footer className="border-t border-border bg-background sticky bottom-0">
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
              onClick={tryGoNext}
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
  tier,
  answers,
  setAnswer,
  onNext,
  onSubmit,
  submitting,
  onJumpTo,
  inquiryStatus,
  inquiryAutoFilled,
}: {
  step: Step;
  tier: ServiceTier | undefined;
  answers: Answers;
  setAnswer: (id: string, v: any) => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
  onJumpTo: (id: string) => void;
  inquiryStatus: "idle" | "loading" | "found" | "not_found";
  inquiryAutoFilled: ReadonlySet<string>;
}) {
  if (step.kind === "service-type") {
    return (
      <ServiceTypeView
        value={tier}
        onChange={(v) => setAnswer("service.type", v)}
        onNext={onNext}
        title={step.title}
        subtitle={step.subtitle}
      />
    );
  }

  if (step.kind === "review") {
    return (
      <ReviewView
        answers={answers}
        onJumpTo={onJumpTo}
        onSubmit={onSubmit}
        submitting={submitting}
      />
    );
  }

  // Page with multiple fields
  return (
    <div className="py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        {step.section}
        {tier && (
          <span className="ml-2 text-foreground/50 normal-case font-normal">
            · {SERVICE_TIER_LABEL[tier]}
          </span>
        )}
      </div>
      <h2 className="text-2xl md:text-4xl font-black tracking-tight">{step.title}</h2>
      {step.subtitle && <p className="mt-2 text-muted-foreground">{step.subtitle}</p>}

      <div className="mt-8 space-y-8">
        {step.fields.map((f, i) => (
          <FieldRow
            key={f.id}
            field={f}
            tier={tier}
            autoFocus={i === 0}
            value={answers[f.id]}
            onChange={(v) => setAnswer(f.id, v)}
            readOnly={inquiryAutoFilled.has(f.id)}
          />
        ))}
      </div>

      {step.id === "p-vehicle-1" && inquiryStatus !== "idle" && (
        <div className={cn(
          "mt-6 flex items-center gap-2 text-sm rounded-md px-4 py-2.5",
          inquiryStatus === "loading"   && "text-muted-foreground bg-muted",
          inquiryStatus === "found"     && "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950",
          inquiryStatus === "not_found" && "text-muted-foreground bg-muted",
        )}>
          {inquiryStatus === "loading"   && <Loader2 className="h-4 w-4 animate-spin" />}
          {inquiryStatus === "found"     && <Check className="h-4 w-4" />}
          {inquiryStatus === "loading"   && "Looking up Inquiry ID…"}
          {inquiryStatus === "found"     && "Details loaded from Kavak database — fields are locked"}
          {inquiryStatus === "not_found" && "Inquiry ID not found — fill in details manually"}
        </div>
      )}

      <div className="mt-10 flex items-center gap-3">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-6 py-3 font-semibold hover:opacity-90 transition"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground hidden md:inline">
          press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Enter</kbd>
        </span>
      </div>
    </div>
  );
}

/* ---------------- Service Type ---------------- */

function ServiceTypeView({
  value,
  onChange,
  onNext,
  title,
  subtitle,
}: {
  value: ServiceTier | undefined;
  onChange: (v: ServiceTier) => void;
  onNext: () => void;
  title: string;
  subtitle?: string;
}) {
  const options: { key: ServiceTier; label: string; description: string }[] = [
    { key: "minor", label: "Minor Service", description: "Routine quick service items." },
    { key: "intermediate", label: "Intermediate Service", description: "Mid-tier inspection & part replacements." },
    { key: "major", label: "Major Service", description: "Comprehensive service incl. timing belt." },
  ];

  return (
    <div className="py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Step 1</div>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}

      <div className="mt-8 grid gap-3 max-w-xl">
        {options.map((o, i) => {
          const selected = value === o.key;
          const key = String.fromCharCode(65 + i);
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={cn(
                "flex items-start gap-4 text-left px-5 py-4 rounded-md border-2 transition",
                selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              <span className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded text-sm font-bold border shrink-0",
                selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border",
              )}>{key}</span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">{o.label}</span>
                <span className="block text-sm text-muted-foreground">{o.description}</span>
              </span>
              {selected && <Check className="h-5 w-5 text-primary mt-1" />}
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center gap-3">
        <button
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-6 py-3 font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Field row ---------------- */

function FieldRow({
  field,
  tier,
  value,
  onChange,
  autoFocus,
  readOnly,
}: {
  field: FieldStep;
  tier: ServiceTier | undefined;
  value: any;
  onChange: (v: any) => void;
  autoFocus?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-base md:text-lg font-semibold text-foreground mb-3">
        {field.label}
        {"unit" in field && field.unit ? (
          <span className="ml-2 text-sm font-normal text-muted-foreground">({field.unit})</span>
        ) : null}
      </label>
      <FieldInput field={field} tier={tier} value={value} onChange={onChange} autoFocus={autoFocus} readOnly={readOnly} />
    </div>
  );
}

function FieldInput({
  field,
  tier,
  value,
  onChange,
  autoFocus,
  readOnly,
}: {
  field: FieldStep;
  tier: ServiceTier | undefined;
  value: any;
  onChange: (v: any) => void;
  autoFocus?: boolean;
  readOnly?: boolean;
}) {
  switch (field.kind) {
    case "text":
      if (field.id === "vehicle.inquiry_id") {
        return <InquiryIdAutocompleteField value={value ?? ""} onChange={onChange} autoFocus={autoFocus} />;
      }
      return <TextField value={value ?? ""} onChange={onChange} placeholder={field.placeholder} suffix={field.suffix} autoFocus={autoFocus} readOnly={readOnly} />;
    case "longtext":
      return <LongTextField value={value ?? ""} onChange={onChange} placeholder={field.placeholder} />;
    case "number":
      return <NumberField value={value ?? ""} onChange={onChange} unit={field.unit} autoFocus={autoFocus} />;
    case "date":
      return <DateTimeField type="date" value={value ?? ""} onChange={onChange} />;
    case "time":
      return <DateTimeField type="time" value={value ?? ""} onChange={onChange} />;
    case "select":
      return <SelectField value={value ?? ""} onChange={onChange} options={field.options} />;
    case "yesno":
      return <YesNoField value={value} onChange={onChange} />;
    case "checklist": {
      const actions = getActionsForTier(field, tier);
      return (
        <ChecklistField
          value={value}
          onChange={onChange}
          actions={actions}
          withNotes={!!field.withNotes}
        />
      );
    }
    case "multinumber":
      return <MultiNumberField value={value} onChange={onChange} fields={field.fields} unit={field.unit} />;
  }
}

/* ---------------- Field components ---------------- */

function TextField({
  value, onChange, placeholder, suffix, autoFocus, readOnly,
}: { value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string; autoFocus?: boolean; readOnly?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus && !readOnly) ref.current?.focus(); }, [autoFocus, readOnly]);
  if (readOnly) {
    return (
      <div className="flex items-baseline gap-3">
        <div className="kavak-input flex-1 bg-muted text-muted-foreground cursor-not-allowed select-none">
          {value || <span className="opacity-40">—</span>}
        </div>
        {suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-3">
      <input
        ref={ref}
        className="kavak-input flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Type your answer..."}
      />
      {suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function LongTextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      className="kavak-textarea"
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Type your answer..."}
    />
  );
}

function NumberField({
  value, onChange, unit, autoFocus,
}: { value: string | number; onChange: (v: number | "") => void; unit?: string; autoFocus?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <div className="flex items-baseline gap-3">
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        className="kavak-input flex-1"
        value={value as any}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder="0"
      />
      {unit && <span className="text-base text-muted-foreground">{unit}</span>}
    </div>
  );
}

function DateTimeField({
  type, value, onChange,
}: { type: "date" | "time"; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type={type}
      className="kavak-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "group flex items-center gap-3 text-left px-4 py-3 rounded-md border-2 transition",
              selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <span className={cn(
              "h-6 w-6 inline-flex items-center justify-center rounded text-xs font-bold border",
              selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border",
            )}>{key}</span>
            <span className="text-base font-medium">{opt}</span>
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
        { label: "Yes", v: true },
        { label: "No", v: false },
      ].map((o) => {
        const selected = value === o.v;
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "px-6 py-2.5 rounded-md border-2 transition font-semibold",
              selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50",
            )}
          >
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

  if (actions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-sm font-medium border border-border">
          Not part of this service
        </div>
        {withNotes && (
          <textarea
            className="kavak-textarea text-sm"
            rows={2}
            placeholder="Notes (optional)"
            value={v.notes}
            onChange={(e) => onChange({ ...v, notes: e.target.value })}
          />
        )}
      </div>
    );
  }

  const toggle = (a: string) => {
    const has = v.actions.includes(a);
    onChange({ ...v, actions: has ? v.actions.filter((x) => x !== a) : [...v.actions, a] });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const selected = v.actions.includes(a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              className={cn(
                "px-3.5 py-1.5 rounded-full border-2 text-sm font-semibold transition",
                selected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50",
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
          className="kavak-textarea text-sm"
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl">
      {fields.map((f) => (
        <label key={f.id} className="block">
          <span className="text-xs text-muted-foreground">{f.label}</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <input
              type="number"
              inputMode="decimal"
              className="w-full bg-transparent border-0 border-b-2 border-border focus:border-primary focus:outline-none text-xl font-medium py-1.5 transition-colors"
              value={(v[f.id] as any) ?? ""}
              onChange={(e) =>
                onChange({ ...v, [f.id]: e.target.value === "" ? (undefined as any) : Number(e.target.value) })
              }
              placeholder="0"
            />
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
        </label>
      ))}
    </div>
  );
}

/* ---------------- Review ---------------- */

function ReviewView({
  answers, onJumpTo, onSubmit, submitting,
}: { answers: Answers; onJumpTo: (id: string) => void; onSubmit: () => void; submitting: boolean }) {
  const tier: ServiceTier | undefined = answers["service.type"];
  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; label: string; value: any }[]>();
    for (const f of allFieldSteps) {
      const arr = map.get(f.section) ?? [];
      arr.push({ id: f.id, label: f.label, value: answers[f.id] });
      map.set(f.section, arr);
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
      <p className="mt-3 text-muted-foreground">
        {tier ? `Service type: ${SERVICE_TIER_LABEL[tier]}. ` : ""}
        Click any answer to edit it.
      </p>

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

function InquiryIdAutocompleteField({
  value, onChange, autoFocus,
}: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 3) { setSuggestions([]); setOpen(false); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("service_reports_vehicle_customers")
        .select("inquiry_id")
        .ilike("inquiry_id", `%${trimmed}%`)
        .limit(10);
      const ids = (data ?? []).map((r: any) => r.inquiry_id as string).filter(Boolean);
      setSuggestions(ids);
      setOpen(ids.length > 0);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const select = (id: string) => {
    setInputValue(id);
    setSuggestions([]);
    setOpen(false);
    onChange(id);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      if (inputValue.trim()) onChange(inputValue.trim());
    }
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="kavak-input flex items-center gap-2">
        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type Inquiry ID…"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && suggestions.length === 1) { e.preventDefault(); select(suggestions[0]); }
          }}
        />
        {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-50 bg-background border border-border rounded-md shadow-lg overflow-hidden">
          {suggestions.map((id) => (
            <li key={id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-muted transition"
                onMouseDown={(e) => { e.preventDefault(); select(id); }}
              >
                {id}
              </button>
            </li>
          ))}
        </ul>
      )}
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
