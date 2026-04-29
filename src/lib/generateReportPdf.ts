import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { allFieldSteps as steps, SECTIONS } from "./reportSchema";

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

export function generateReportPdf(answers: Answers): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFillColor(...KAVAK_BLUE);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("KAVAK", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Vehicle Service Report", margin, 50);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  const submittedAt = new Date().toLocaleString();
  doc.text(`Generated: ${submittedAt}`, pageWidth - margin, 50, { align: "right" });

  doc.setTextColor(0, 0, 0);
  let cursorY = 90;

  const vehicleRows: [string, string][] = [
    ["Vehicle make & model", v(answers, "vehicle.make_model")],
    ["Registration number", v(answers, "vehicle.registration_number")],
    ["VIN", v(answers, "vehicle.vin")],
    ["Customer name", v(answers, "customer.name")],
    ["Customer contact", v(answers, "customer.contact")],
    ["Service advisor", `${v(answers, "service_advisor.name")} ${v(answers, "service_advisor.number") ? "(" + v(answers, "service_advisor.number") + ")" : ""}`.trim()],
    ["Service date / time", `${v(answers, "vehicle.service_date")} ${v(answers, "vehicle.service_time")}`.trim()],
    ["Service plan", v(answers, "vehicle.service_plan")],
    ["Service type / mileage", v(answers, "vehicle.service_type_mileage")],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [[{ content: SECTIONS.vehicle, colSpan: 2, styles: { fillColor: KAVAK_BLUE, textColor: 255, halign: "left" } }]],
    body: vehicleRows,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 180 }, 1: { cellWidth: "auto" } },
    margin: { left: margin, right: margin },
  });
  cursorY = (doc as any).lastAutoTable.finalY + 16;

  const renderInspectionSection = (sectionLabel: string) => {
    const sectionSteps = steps.filter(
      (s) => "section" in s && (s as any).section === sectionLabel
    );
    if (sectionSteps.length === 0) return;

    const body = sectionSteps.map((s) => {
      const label = (s as any).label as string;
      let action = "";
      let observations = "";
      const ans = answers[(s as any).id];

      if (s.kind === "checklist") {
        action = (ans?.actions ?? []).join(", ");
        observations = ans?.notes ?? "";
      } else if (s.kind === "multinumber") {
        action = "Measure";
        observations = Object.entries(ans ?? {})
          .map(([k, val]) => `${k.toUpperCase()}: ${val}${(s as any).unit ?? ""}`)
          .join("  ");
      } else if (s.kind === "yesno") {
        action = ans === true ? "Yes" : ans === false ? "No" : "";
      } else if (s.kind === "number") {
        observations = ans !== undefined && ans !== "" ? `${ans} ${(s as any).unit ?? ""}` : "";
      } else if (s.kind === "select" || s.kind === "text" || s.kind === "longtext" || s.kind === "date" || s.kind === "time") {
        observations = ans ?? "";
      }
      return [label, action, observations];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          { content: sectionLabel, colSpan: 3, styles: { fillColor: KAVAK_BLUE, textColor: 255, halign: "left" } },
        ],
        [
          { content: "Item", styles: { fillColor: [240, 240, 240], textColor: 0 } },
          { content: "Action", styles: { fillColor: [240, 240, 240], textColor: 0 } },
          { content: "Observations", styles: { fillColor: [240, 240, 240], textColor: 0 } },
        ],
      ],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      columnStyles: {
        0: { cellWidth: 200, fontStyle: "bold" },
        1: { cellWidth: 90 },
        2: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        doc.setFillColor(...KAVAK_BLUE);
        doc.rect(0, 0, pageWidth, 20, "F");
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 16;
  };

  renderInspectionSection(SECTIONS.exterior);
  renderInspectionSection(SECTIONS.interior);
  renderInspectionSection(SECTIONS.chassis);
  renderInspectionSection(SECTIONS.engine);
  renderInspectionSection(SECTIONS.final);

  const refurbRows: [string, string][] = [
    ["Suggested services", v(answers, "refurb.selected")],
    ["A/C filter condition", v(answers, "refurb.ac_filter_condition")],
    ["Air filter condition", v(answers, "refurb.air_filter_condition")],
    ["Other recommendations", v(answers, "refurb.other")],
  ];
  autoTable(doc, {
    startY: cursorY,
    head: [[{ content: SECTIONS.refurb, colSpan: 2, styles: { fillColor: KAVAK_BLUE, textColor: 255, halign: "left" } }]],
    body: refurbRows,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 180 }, 1: { cellWidth: "auto" } },
    margin: { left: margin, right: margin },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Kavak Service Report  •  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 18,
      { align: "center" }
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
