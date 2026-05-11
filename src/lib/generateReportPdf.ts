import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  allFieldSteps as fields,
  SECTIONS,
  SERVICE_TIER_LABEL,
  getActionsForTier,
  type ServiceTier,
} from "./reportSchema";
import logoWhite from "@/assets/kavak-logo-white.png";
import coverCar from "@/assets/kavak-cover-car.png";

type Answers = Record<string, any>;

// Brand color used across PDF section headers and accents.
// Switched from Kavak blue to black for consistency with the cover page.
const KAVAK_BLACK: [number, number, number] = [0, 0, 0];

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

function drawCoverPage(
  doc: jsPDF,
  _logo: { dataUrl: string; width: number; height: number } | null,
  car: { dataUrl: string; width: number; height: number } | null,
  tierLabel: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Full-bleed black cover
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // The cover artwork already contains the KAVAK logo, "Car Service Report"
  // title, and a hero car. Render it full-bleed, preserving aspect ratio
  // and centering vertically so nothing is stretched.
  if (car) {
    const aspect = car.height / car.width;
    let imgW = pageWidth;
    let imgH = pageWidth * aspect;
    if (imgH > pageHeight) {
      imgH = pageHeight;
      imgW = pageHeight / aspect;
    }
    const imgX = (pageWidth - imgW) / 2;
    const imgY = (pageHeight - imgH) / 2;
    try {
      doc.addImage(car.dataUrl, "PNG", imgX, imgY, imgW, imgH, undefined, "FAST");
    } catch {
      // fallback: keep black background only
    }
  }

  // The artwork has a static "Minor Service" subtitle baked in just below
  // "Car Service Report" (roughly 34%-37% of the page height). Cover that
  // exact band with black, then draw the dynamic tier label centered on it.
  const stripY = pageHeight * 0.335;
  const stripH = pageHeight * 0.045;
  doc.setFillColor(0, 0, 0);
  doc.rect(0, stripY, pageWidth, stripH, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(tierLabel, pageWidth / 2, stripY + stripH * 0.72, { align: "center" });

  // Cover the baked-in footer text at the bottom of the artwork with a tall
  // black band, then draw only the correct page number.
  doc.setFillColor(0, 0, 0);
  doc.rect(0, pageHeight - 90, pageWidth, 90, "F");

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  const totalPages = (doc as any).internal.getNumberOfPages
    ? (doc as any).internal.getNumberOfPages()
    : 4;
  doc.text(
    `Kavak Service Report  •  Page 1 of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 30,
    { align: "center" },
  );
}

async function loadImageWithSize(
  url: string,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const dataUrl = await loadImageDataUrl(url);
  const { width, height } = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    },
  );
  return { dataUrl, width, height };
}

export async function generateReportPdf(answers: Answers): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const tier: ServiceTier | undefined = answers["service.type"];
  const tierLabel = tier ? SERVICE_TIER_LABEL[tier] : "—";

  const now = new Date();

  // ===== Cover page =====
  let logo: { dataUrl: string; width: number; height: number } | null = null;
  let car: { dataUrl: string; width: number; height: number } | null = null;
  try {
    logo = await loadImageWithSize(logoWhite);
  } catch {
    logo = null;
  }
  try {
    car = await loadImageWithSize(coverCar);
  } catch {
    car = null;
  }
  drawCoverPage(doc, logo, car, tierLabel);

  // ===== Report body on a new page =====
  doc.addPage();

  // Header band on body page — KAVAK + Car Service Report centered on the same row
  doc.setFillColor(...KAVAK_BLACK);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const kavakText = "KAVAK";
  const separator = "  |  ";
  const titleText = "Car Service Report";
  const kavakWidth = doc.getTextWidth(kavakText);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  const sepWidth = doc.getTextWidth(separator);
  const titleWidth = doc.getTextWidth(titleText);
  const totalWidth = kavakWidth + sepWidth + titleWidth;
  const startX = (pageWidth - totalWidth) / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(kavakText, startX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(separator + titleText, startX + kavakWidth, 42);

  doc.setTextColor(0, 0, 0);
  let cursorY = 90;

  // Vehicle & Customer summary (auto-filled date/time, no service plan)
  const vehicleRows: [string, string][] = [
    ["Vehicle make & model", v(answers, "vehicle.make_model")],
    ["Car ID", v(answers, "vehicle.registration_number")],
    ["VIN", v(answers, "vehicle.vin")],
    ["Mileage", (() => { const m = v(answers, "vehicle.service_type_mileage"); if (!m) return ""; const stripped = m.replace(/\s*KM$/i, "").trim(); return `${stripped} KM`; })()],
    ["Customer name", v(answers, "customer.name")],
    ["Customer contact", v(answers, "customer.contact")],
    ["Customer email", v(answers, "customer.email")],
    ["Service advisor", v(answers, "service_advisor.name")],
    ["Service date", now.toLocaleDateString()],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        {
          content: SECTIONS.vehicle,
          colSpan: 2,
          styles: { fillColor: KAVAK_BLACK, textColor: 255, halign: "left" },
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

    type RowMeta =
      | { kind: "checklist"; tierActions: string[]; performed: string[] }
      | { kind: "notApplicable" }
      | { kind: "multinumber" }
      | { kind: "other" };

    const body: [string, string, string][] = [];
    const rowMeta: RowMeta[] = [];

    for (const f of sectionFields) {
      const ans = answers[f.id];

      if (f.kind === "checklist") {
        const tierActions = getActionsForTier(f, tier);
        if (tierActions.length === 0) {
          body.push([f.label, "", ""]);
          rowMeta.push({ kind: "notApplicable" });
        } else {
          const performed: string[] = ans?.actions ?? [];
          body.push([f.label, "", ans?.notes ?? ""]);
          rowMeta.push({ kind: "checklist", tierActions, performed });
        }
        continue;
      }

      if (f.kind === "multinumber") {
        const parts = (f.fields as { id: string; label: string }[])
          .map((mf) => {
            const val = ans?.[mf.id];
            return val !== undefined && val !== "" ? `${mf.label}: ${val}${f.unit ?? ""}` : null;
          })
          .filter(Boolean) as string[];
        body.push([f.label, "Measure", parts.join("  ·  ")]);
        rowMeta.push({ kind: "multinumber" });
        continue;
      }

      rowMeta.push({ kind: "other" });
    }

    autoTable(doc, {
      startY: cursorY,
      rowPageBreak: "avoid",
      head: [
        [
          {
            content: sectionLabel,
            colSpan: 3,
            styles: { fillColor: KAVAK_BLACK, textColor: 255, halign: "left" },
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
      didParseCell: (data: any) => {
        if (data.section !== "body") return;
        const meta = rowMeta[data.row.index];

        // Column 1: set min height based on selected action count and clear default text
        if (data.column.index === 1 && meta?.kind === "checklist") {
          const selectedCount = meta.tierActions.filter((a) =>
            meta.performed.includes(a),
          ).length;
          if (selectedCount > 0) {
            data.cell.styles.minCellHeight = selectedCount * 26 + 10;
          }
          data.cell.text = [""];
        }
      },
      didDrawCell: (data: any) => {
        if (data.section !== "body") return;
        const meta = rowMeta[data.row.index];

        // Column 1: render selected actions as compact pill buttons; skip unselected
        if (data.column.index === 1 && meta?.kind === "checklist") {
          const selectedActions = meta.tierActions.filter((a) =>
            meta.performed.includes(a),
          );
          const lineBase = data.cell.y + 6;
          const lineH = 26;

          selectedActions.forEach((action, i) => {
            const btnY = lineBase + i * lineH;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            const tw = doc.getTextWidth(action);
            const btnW = tw + 16;
            const btnH = 18;
            doc.setFillColor(224, 231, 255);
            doc.roundedRect(data.cell.x + 5, btnY, btnW, btnH, 4, 4, "F");
            doc.setTextColor(67, 56, 202);
            doc.text(action, data.cell.x + 13, btnY + 12);
            doc.setFont("helvetica", "normal");
          });
          doc.setTextColor(0, 0, 0);
        }

        if (data.column.index === 1 && meta?.kind === "notApplicable") {
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.text("Not applicable", data.cell.x + 5, data.cell.y + data.cell.height / 2 + 3);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
        }
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

  // Footer page numbers — skip page 1 (cover) so we don't fight the cover artwork
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
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

export function buildReportFilename(answers: Answers): string {
  const reg = (answers["vehicle.registration_number"] as string) || "report";
  const date = new Date().toISOString().slice(0, 10);
  return `kavak-service-report-${reg.replace(/[^A-Za-z0-9]+/g, "-")}-${date}.pdf`;
}

export function saveGeneratedPdf(doc: jsPDF, answers: Answers) {
  doc.save(buildReportFilename(answers));
}

export async function downloadReportPdf(answers: Answers) {
  const doc = await generateReportPdf(answers);
  doc.save(buildReportFilename(answers));
}
