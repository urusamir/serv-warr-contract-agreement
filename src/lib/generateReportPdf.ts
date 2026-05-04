import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  allFieldSteps as fields,
  SECTIONS,
  SERVICE_TIER_LABEL,
  getActionsForTier,
  type ServiceTier,
} from "./reportSchema";
import logoWhiteOnBlue from "@/assets/kavak-logo-white-on-blue.png";

type Answers = Record<string, any>;

const KAVAK_BLUE: [number, number, number] = [0, 39, 255];

function v(answers: Answers, id: string, fallback = ""): string {
  const val = answers[id];
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") {
    if ("actions" in val) {
      const acts = (val.actions as string[])?.join(", ") || "";
      const notes = (val as any).notes ? ` — ${(val as any).notes}` : "";
      return `${acts}${notes}`;
    }
    return Object.entries(val)
      .map(([k, vv]) => `${k.toUpperCase()}: ${vv}`)
      .join("  ");
  }
  return String(val);
}

// Load an image asset URL into a data URL so jsPDF can embed it.
async function loadImageDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function drawCoverPage(doc: jsPDF, logoDataUrl: string | null, tierLabel: string, generatedAt: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Full-bleed Kavak blue cover
  doc.setFillColor(...KAVAK_BLUE);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Logo (centered upper third)
  if (logoDataUrl) {
    const logoW = 220;
    const logoH = 80;
    try {
      doc.addImage(logoDataUrl, "PNG", (pageWidth - logoW) / 2, pageHeight * 0.28, logoW, logoH, undefined, "FAST");
    } catch {
      // fallback to text wordmark
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(48);
      doc.text("KAVAK", pageWidth / 2, pageHeight * 0.35, { align: "center" });
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(48);
    doc.text("KAVAK", pageWidth / 2, pageHeight * 0.35, { align: "center" });
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Periodic Service", pageWidth / 2, pageHeight * 0.55, { align: "center" });
  doc.text("Maintenance Check List", pageWidth / 2, pageHeight * 0.55 + 34, { align: "center" });

  // Tier
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(tierLabel, pageWidth / 2, pageHeight * 0.7, { align: "center" });

  // Footer line
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${generatedAt}`, pageWidth / 2, pageHeight - 50, { align: "center" });
  doc.text("Quality · Trust · Speed", pageWidth / 2, pageHeight - 32, { align: "center" });
}

export async function generateReportPdf(answers: Answers): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const tier: ServiceTier | undefined = answers["service.type"];
  const tierLabel = tier ? SERVICE_TIER_LABEL[tier] : "—";

  // Auto-fill date/time from current moment
  const now = new Date();
  const generatedAt = now.toLocaleString();

  // ===== Cover page =====
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageDataUrl(logoWhiteOnBlue);
  } catch {
    logoDataUrl = null;
  }
  drawCoverPage(doc, logoDataUrl, tierLabel, generatedAt);

  // ===== Report body on a new page =====
  doc.addPage();

  // Header band on body page
  doc.setFillColor(...KAVAK_BLUE);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("KAVAK", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Periodic Service Maintenance Check List", margin, 50);

  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 30, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`Service Type: ${tierLabel}`, pageWidth - margin, 50, { align: "right" });

  doc.setTextColor(0, 0, 0);
  let cursorY = 90;

  // Vehicle & Customer summary (auto-filled date/time, no service plan)
  const vehicleRows: [string, string][] = [
    ["Vehicle make & model", v(answers, "vehicle.make_model")],
    ["Registration number", v(answers, "vehicle.registration_number")],
    ["VIN", v(answers, "vehicle.vin")],
    ["Service type / mileage", v(answers, "vehicle.service_type_mileage")],
    ["Customer name", v(answers, "customer.name")],
    ["Customer contact", v(answers, "customer.contact")],
    ["Service advisor", v(answers, "service_advisor.name")],
    ["Service date", now.toLocaleDateString()],
    ["Service time", now.toLocaleTimeString()],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        {
          content: SECTIONS.vehicle,
          colSpan: 2,
          styles: { fillColor: KAVAK_BLUE, textColor: 255, halign: "left" },
        },
      ],
    ],
    body: vehicleRows,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 180 }, 1: { cellWidth: "auto" } },
    margin: { left: margin, right: margin },
  });
  cursorY = (doc as any).lastAutoTable.finalY + 16;

  const renderInspectionSection = (sectionLabel: string) => {
    const sectionFields = fields.filter((f) => f.section === sectionLabel);
    if (sectionFields.length === 0) return;

    const body = sectionFields.map((f) => {
      const ans = answers[f.id];
      const label = f.label;
      let action = "";
      let observations = "";

      if (f.kind === "checklist") {
        const tierActions = getActionsForTier(f, tier);
        if (tierActions.length === 0) {
          action = "Not applicable";
        } else {
          const performed: string[] = ans?.actions ?? [];
          action = tierActions
            .map((a) => `${performed.includes(a) ? "[x]" : "[ ]"} ${a}`)
            .join("\n");
        }
        observations = ans?.notes ?? "";
      } else if (f.kind === "multinumber") {
        action = "Measure";
        observations = f.fields
          .map((mf) => {
            const val = ans?.[mf.id];
            return val !== undefined && val !== "" ? `${mf.label}: ${val}${f.unit ?? ""}` : null;
          })
          .filter(Boolean)
          .join("  ·  ");
      }
      return [label, action, observations];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          {
            content: sectionLabel,
            colSpan: 3,
            styles: { fillColor: KAVAK_BLUE, textColor: 255, halign: "left" },
          },
        ],
        [
          { content: "Item", styles: { fillColor: [240, 240, 240], textColor: 0 } },
          { content: "Action", styles: { fillColor: [240, 240, 240], textColor: 0 } },
          { content: "Observations / Remarks", styles: { fillColor: [240, 240, 240], textColor: 0 } },
        ],
      ],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      columnStyles: {
        0: { cellWidth: 200, fontStyle: "bold" },
        1: { cellWidth: 130 },
        2: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 16;
  };

  // Order matches the source PDF
  renderInspectionSection(SECTIONS.interior);
  renderInspectionSection(SECTIONS.exterior);
  renderInspectionSection(SECTIONS.chassis);
  renderInspectionSection(SECTIONS.wheel);
  renderInspectionSection(SECTIONS.engine);
  renderInspectionSection(SECTIONS.final);

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Kavak Service Report  •  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 18,
      { align: "center" },
    );
  }

  return doc;
}

export function downloadReportPdf(answers: Answers) {
  const doc = generateReportPdf(answers);
  const reg = (answers["vehicle.registration_number"] as string) || "report";
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`kavak-service-report-${reg.replace(/[^A-Za-z0-9]+/g, "-")}-${date}.pdf`);
}
