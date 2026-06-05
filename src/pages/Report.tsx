import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronRight, ExternalLink, FileText, Loader2 } from "lucide-react";
import logoBlack from "@/assets/kavak-logo-black.png";
import companyStamp from "@/assets/company-stamp.png";
import { steps, WARRANTY_PACKAGES, SERVICE_PACKAGES, type ContractType, type FieldDef } from "@/lib/contractSchema";
import { generateContractPdf, saveContractPdf } from "@/lib/generateContractPdf";
import { SignaturePad } from "@/components/SignaturePad";
import { TCModal } from "@/components/TCModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Answers = Record<string, any>;

function parsePackage(pkg: string): { years: number; kmToAdd: number } | null {
  // Service format: OKM-SC-2YR-30KM, UC-SC-1YR-20KM
  const svc = pkg.match(/(\d+)YR[^/]*?(\d+)KM/);
  if (svc) return { years: parseInt(svc[1]), kmToAdd: parseInt(svc[2]) * 1000 };
  // Warranty format: Plus Warranty-12MNTS/30KM
  const warr = pkg.match(/(\d+)MNTS\/(\d+)KM/);
  if (warr) return { years: Math.round(parseInt(warr[1]) / 12), kmToAdd: parseInt(warr[2]) * 1000 };
  return null;
}

const variants = {
  enter: (dir: number) => ({ y: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -50 : 50, opacity: 0 }),
};

const Report = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [contractType, setContractType] = useState<ContractType | undefined>();
  const [answers, setAnswers] = useState<Answers>({
    "agreement.date": new Date().toISOString().slice(0, 10),
    "contract.from_date": new Date().toISOString().slice(0, 10),
    "signature.stamp": companyStamp,
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [tcOpen, setTcOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = steps.length;
  const step = steps[index];
  const progress = ((index + 1) / total) * 100;

  const setAnswer = (id: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const carId = (answers["agreement.car_id"] ?? "").trim();
    if (!carId) return;
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("serv_warr_customers")
        .select("customer_name, customer_phone, customer_email, vin_no, car_detail")
        .eq("car_id", carId)
        .maybeSingle();
      if (!data) return;
      const parts = (data.car_detail ?? "").split(" ");
      setAnswers((prev) => ({
        ...prev,
        "customer.name": data.customer_name ?? prev["customer.name"] ?? "",
        "customer.mobile": data.customer_phone ?? prev["customer.mobile"] ?? "",
        "customer.email": data.customer_email ?? prev["customer.email"] ?? "",
        "vehicle.vin": data.vin_no ?? prev["vehicle.vin"] ?? "",
        "vehicle.car": data.car_detail || prev["vehicle.car"] || "",
      }));
    }, 600);
    return () => clearTimeout(timer);
  }, [answers["agreement.car_id"]]);

  useEffect(() => {
    const pkg = answers["contract.package"];
    const fromKm = Number(answers["contract.from_km"] ?? 0);
    if (!pkg) return;
    const parsed = parsePackage(pkg);
    if (!parsed) return;
    const { years, kmToAdd } = parsed;
    const fromDate = answers["contract.from_date"] ?? new Date().toISOString().slice(0, 10);
    const endDate = new Date(fromDate);
    endDate.setFullYear(endDate.getFullYear() + years);
    setAnswers((prev) => ({
      ...prev,
      "contract.end_date": endDate.toISOString().slice(0, 10),
      "contract.end_km": fromKm + kmToAdd,
    }));
  }, [answers["contract.package"], answers["contract.from_km"]]);

  const canAdvance = useCallback((): boolean => {
    if (step.kind === "contract-type") return !!contractType;
    if (step.kind === "page") {
      return step.fields
        .filter((f) => f.required)
        .every((f) => {
          const val = answers[f.id];
          return val !== undefined && val !== null && String(val).trim() !== "";
        });
    }
    if (step.kind === "terms") return termsAgreed;
    return true;
  }, [step, contractType, answers, termsAgreed]);

  const tryGoNext = useCallback(() => {
    if (!canAdvance()) {
      toast.error("Please fill in all required fields to continue.");
      return;
    }
    goNext();
  }, [canAdvance, goNext, step, contractType]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const doc = await generateContractPdf(answers, contractType ?? "service");
      saveContractPdf(doc, answers);
      toast.success("Agreement submitted and downloaded.");
      navigate("/report/done");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigate]);

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
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step.kind === "contract-type" && (
                <ContractTypeView
                  value={contractType}
                  onChange={setContractType}
                  onNext={tryGoNext}
                />
              )}
              {step.kind === "page" && (
                <PageView
                  step={
                    step.id === "p-contract-period"
                      ? {
                          ...step,
                          fields: step.fields.map((f) =>
                            f.id === "contract.package"
                              ? { ...f, options: contractType === "warranty" ? WARRANTY_PACKAGES : SERVICE_PACKAGES }
                              : f
                          ),
                        }
                      : step
                  }
                  answers={answers}
                  setAnswer={setAnswer}
                  onNext={tryGoNext}
                />
              )}
              {step.kind === "terms" && (
                <TermsView
                  agreed={termsAgreed}
                  onToggle={() => setTermsAgreed((v) => !v)}
                  onOpenTC={() => setTcOpen(true)}
                  onNext={tryGoNext}
                />
              )}
              {step.kind === "signature" && (
                <SignatureView
                  answers={answers}
                  setAnswer={setAnswer}
                  onSubmit={submit}
                  submitting={submitting}
                />
              )}
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
        <div className="flex items-center justify-between px-6 md:px-10 py-3">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-30 transition text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {step.kind !== "signature" && (
            <button
              onClick={tryGoNext}
              disabled={index === total - 1}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition text-sm font-medium"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </footer>

      {tcOpen && <TCModal onClose={() => setTcOpen(false)} />}
    </main>
  );
};

export default Report;

/* ─── Contract Type ─── */

function ContractTypeView({
  value,
  onChange,
  onNext,
}: {
  value: ContractType | undefined;
  onChange: (v: ContractType) => void;
  onNext: () => void;
}) {
  const options: { key: ContractType; label: string; description: string; available: boolean }[] = [
    {
      key: "service",
      label: "Service Contract",
      description: "Periodic maintenance and service agreement for your vehicle.",
      available: true,
    },
    {
      key: "warranty",
      label: "Warranty Contract",
      description: "Extended warranty coverage for mechanical components.",
      available: true,
    },
  ];

  return (
    <div className="py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        Step 1
      </div>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight">
        What type of contract agreement?
      </h2>
      <p className="mt-3 text-muted-foreground">Select the contract type to proceed.</p>

      <div className="mt-8 grid gap-3 max-w-xl">
        {options.map((o) => {
          const selected = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              disabled={!o.available}
              onClick={() => o.available && onChange(o.key)}
              className={cn(
                "flex items-start gap-4 text-left px-5 py-4 rounded-md border-2 transition",
                selected
                  ? "border-primary bg-primary/5"
                  : o.available
                  ? "border-border hover:border-primary/50"
                  : "border-border opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "h-8 w-8 inline-flex items-center justify-center rounded border shrink-0 mt-0.5",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border"
                )}
              >
                {selected ? <Check className="h-4 w-4" /> : null}
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">
                  {o.label}
                </span>
                <span className="block text-sm text-muted-foreground mt-0.5">
                  {o.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
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

/* ─── Page (form fields) ─── */

function PageView({
  step,
  answers,
  setAnswer,
  onNext,
}: {
  step: Extract<(typeof steps)[number], { kind: "page" }>;
  answers: Answers;
  setAnswer: (id: string, v: any) => void;
  onNext: () => void;
}) {
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        {step.section}
      </div>
      <h2 className="text-2xl md:text-4xl font-black tracking-tight">{step.title}</h2>
      {step.subtitle && <p className="mt-2 text-muted-foreground">{step.subtitle}</p>}

      <div className="mt-8 space-y-6">
        {step.fields.map((field, i) => (
          <FieldRow
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(v) => setAnswer(field.id, v)}
            autoFocus={i === 0}
            inputRef={i === 0 ? firstInputRef : undefined}
          />
        ))}
      </div>

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

function FieldRow({
  field,
  value,
  onChange,
  autoFocus,
  inputRef,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  autoFocus?: boolean;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <label className="block text-base md:text-lg font-semibold text-foreground mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
        {field.kind === "number" && field.unit && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">({field.unit})</span>
        )}
      </label>
      <FieldInput field={field} value={value} onChange={onChange} autoFocus={autoFocus} inputRef={inputRef} />
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  autoFocus,
  inputRef,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  autoFocus?: boolean;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
}) {
  const baseInput =
    "w-full bg-transparent border-0 border-b-2 border-border focus:border-primary focus:outline-none text-lg font-medium py-2 transition-colors placeholder:text-muted-foreground/50";

  switch (field.kind) {
    case "text":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          className={baseInput}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "Type your answer…"}
          autoFocus={autoFocus}
        />
      );
    case "date": {
      const locked = ["agreement.date", "contract.from_date", "contract.end_date"].includes(field.id);
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          className={cn(baseInput, "max-w-xs", locked && "opacity-50 cursor-not-allowed")}
          value={value ?? ""}
          onChange={(e) => { if (!locked) onChange(e.target.value); }}
          readOnly={locked}
          autoFocus={autoFocus && !locked}
        />
      );
    }
    case "number": {
      const locked = field.id === "contract.end_km";
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          inputMode="numeric"
          className={cn(baseInput, "max-w-xs", locked && "opacity-50 cursor-not-allowed")}
          value={value ?? ""}
          onChange={(e) => { if (!locked) onChange(e.target.value === "" ? "" : Number(e.target.value)); }}
          placeholder="0"
          autoFocus={autoFocus && !locked}
          readOnly={locked}
        />
      );
    }
    case "select":
      return (
        <div className="grid gap-2 max-w-sm mt-1">
          {field.options.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={cn(
                  "flex items-center gap-3 text-left px-4 py-3 rounded-md border-2 transition",
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded border inline-flex items-center justify-center shrink-0",
                    selected ? "bg-primary border-primary" : "bg-muted border-border"
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                </span>
                <span className="font-medium text-sm">{opt}</span>
              </button>
            );
          })}
        </div>
      );
  }
}

/* ─── Terms ─── */

function TermsView({
  agreed,
  onToggle,
  onOpenTC,
  onNext,
}: {
  agreed: boolean;
  onToggle: () => void;
  onOpenTC: () => void;
  onNext: () => void;
}) {
  return (
    <div className="py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        Terms & Conditions
      </div>
      <h2 className="text-2xl md:text-4xl font-black tracking-tight">
        Service Contract Agreement
      </h2>
      <p className="mt-2 text-muted-foreground">
        Please review the agreement terms before completing the service contract.
      </p>

      <div className="mt-8 border border-border rounded-xl p-5 max-w-2xl">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base">Terms & Conditions</p>
            <p className="text-sm text-muted-foreground mt-1">
              I acknowledge and agree to the terms, conditions, limitations, and provisions detailed
              in this Service Contract Agreement. I understand that services must be scheduled as
              advised by Kavak to keep the agreement valid.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenTC}
          className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline"
        >
          <FileText className="h-4 w-4" />
          View full Terms & Conditions
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="flex items-center gap-3 mt-6 cursor-pointer w-fit">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
            agreed ? "bg-primary border-primary" : "border-border bg-background"
          )}
        >
          {agreed && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>
        <span className="text-sm font-medium">
          I have read and agree to the Terms & Conditions
        </span>
      </label>

      <div className="mt-10">
        <button
          onClick={onNext}
          disabled={!agreed}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-6 py-3 font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Signature ─── */

function SignatureView({
  answers,
  setAnswer,
  onSubmit,
  submitting,
}: {
  answers: Answers;
  setAnswer: (id: string, v: any) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const stampDataUrl: string = answers["signature.stamp"] ?? "";

  return (
    <div className="py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        Agreement Acceptance
      </div>
      <h2 className="text-2xl md:text-4xl font-black tracking-tight">Sign the agreement</h2>
      <p className="mt-2 text-muted-foreground">
        Enter names and signatures to finalise the contract.
      </p>

      <div className="mt-8 space-y-8 max-w-2xl">
        {/* Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Staff Name</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter staff name"
              value={answers["signature.staff_name"] ?? ""}
              onChange={(e) => setAnswer("signature.staff_name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Customer Name</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter customer name"
              value={answers["signature.customer_name"] ?? answers["customer.name"] ?? ""}
              onChange={(e) => setAnswer("signature.customer_name", e.target.value)}
            />
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Staff Signature</label>
            <SignaturePad
              value={answers["signature.staff"] ?? ""}
              onChange={(v) => setAnswer("signature.staff", v)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Customer Signature</label>
            <SignaturePad
              value={answers["signature.customer"] ?? ""}
              onChange={(v) => setAnswer("signature.customer", v)}
            />
          </div>
        </div>

        {/* Company Stamp — locked, pre-filled */}
        <div>
          <label className="block text-sm font-semibold mb-2">Company Stamp</label>
          <div className="border-2 border-border rounded-xl overflow-hidden bg-muted/30">
            <img src={stampDataUrl} alt="Company stamp" className="w-full h-40 object-contain" />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 font-bold hover:opacity-90 transition disabled:opacity-60 text-base"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
          {submitting ? "Generating PDF…" : "Submit Agreement"}
        </button>
      </div>
    </div>
  );
}
