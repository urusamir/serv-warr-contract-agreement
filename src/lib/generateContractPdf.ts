import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoBlack from "@/assets/kavak-logo-black.png";
import { SERVICE_INTERVALS } from "./contractSchema";

type Answers = Record<string, any>;

const BLACK: [number, number, number] = [0, 0, 0];
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];

function v(answers: Answers, id: string, fallback = "—"): string {
  const val = answers[id];
  if (val === undefined || val === null || val === "") return fallback;
  return String(val);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function loadImageDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const LEGAL_CLAUSES = `1. Provision of Services.
Kavak agrees during the term to diligently and professionally carry out and supply the periodic services for the vehicle, as outlined in the Annexure attached herewith. Customer is required to follow the maintenance schedule as per the maintenance requirements. Customer agrees to have periodic services performed every 6 months / 10000 kilometers of the scheduled service intervals, whichever comes first, and to have all services performed by Kavak and in Kavak workshops. This Agreement shall only apply to the vehicle listed above.

2. Exclusions.
The following shall be excluded from the scope and/or definition of the Services:
a) Any loss caused by negligence, misuse, abuse, or failure by the Customer to perform required servicing or any mechanical failure caused by the lack of proper and necessary amounts of coolant or lubricants.
b) Any loss or damage resulting from, related to, or arising out of an accident, a collision, falling objects, theft, vandalism, riot, fire, explosion, earthquake, sandstorm, thunderstorm, flood, or from any other acts of God.
c) Any mechanical breakdown which is the direct result of a mechanical or structural defect.
d) Any loss or repair if the vehicle has been used for competitive driving or racing.
e) Any loss, repair or replacement if the odometer has been tampered with, altered, or broken, after the effective date of this Agreement.
f) Repairs and/or replacements not authorized by Kavak or loss due to any mechanical alterations to the vehicle.
g) Any further damage to the vehicle due to the failure to protect it shall not be recoverable. Continued operation of the vehicle after a Mechanical Breakdown occurs shall be considered failure to protect the vehicle.
h) Repair of any body work or paint work.
i) Replacement or repair of any glass fittings including windscreens, headlamps, sealed beam units, taillights or reversing lights.
j) Replacement of tyres or repair of punctures.
k) Any loss or expense for adjustments, tune-ups, alignments, towing, road service or assistance, or for repairs to or replacement of any parts not covered in this Agreement.
l) Any mechanical breakdown occurring outside the United Arab Emirates.
m) Maintenance which is carried out or completed at the request of the Customer outside of normal working hours, which for this purpose shall be 8:00 am to 6:00 pm, Monday to Saturday, public and general holidays excepted.
n) Any additional costs for services or maintenance services not specifically covered by this Agreement.

3. Service Validity.
a) Periodic Service at 10,000KM / 6 months whichever comes first.
b) Service contract will be valid as per the package.
c) Services after the End KM or End Date will be chargeable to the customer.

4. Customer's Covenants.
The Customer hereby agrees to take proper care of the vehicle and shall (i) regularly check the oil and water and other fluid levels of the Vehicle in accordance with the recommendations as stated in the owner's manual; (ii) not use the Vehicle or allow it to be used for any purpose for which it is not designed; and (iii) use the vehicle in a proper and responsible manner. Customer hereby agrees to take a prior appointment with KAVAK to perform the periodic service / any additional services.

5. Collection & Delivery.
a) Customer shall at their own cost to deliver the vehicle to and collect the vehicle from the workshops.
b) Vehicle must be collected by the customer within 48 hours from the Ready message from the workshop, if fails to do so Customer will be imposed with a parking charges of AED:75/- per day.
c) Customer can choose the delivery options like pick up & drop facility on chargeable basis.

6. Contract Transfer Option.
Should the customer sell the vehicle within the period of service contract, it can be transferred to the new owner (individual only) with a transfer fee of AED:200/-, no refund on the existing contract is applicable to the existing customer.

7. Warranty and Limitation of Liability.
Kavak offers a six-month or a ten thousand kilometers workmanship warranty, whichever occurs first, with respect to any repairs or services provided by Kavak under this Agreement. Kavak's liability towards the Customer cannot exceed the fee/price paid by the Customer for the Agreement less any maintenance services redeemed on the Vehicle.

8. No Third-Party Workshops.
The Customer shall ensure that no servicing, routine maintenance, or repairs are carried out upon the vehicle or any part thereof by any person or any workshop other than Kavak, provided however that in a case of emergency and the Customer being unable to deliver the vehicle to Kavak, minor repairs of an emergency nature may be carried out by a competent repairer but at the sole cost of the Customer.

9. Notices.
All notices and other communications hereunder shall be in writing and be given by email, or hand delivery to the other party or by registered mail addressed and sent to the party's address as set on the first page of this Agreement.

10. Governing Law.
This Agreement is governed by and shall be construed in accordance with the applicable laws of the United Arab Emirates. Any disputes arising out of or in connection with this Agreement shall be referred to and finally resolved by the Courts of Dubai.

11. Miscellaneous.
The Customer may not assign, transfer or delegate any of its rights or obligations under this Agreement without the prior written consent of Kavak. This Agreement embodies the entire Agreement between the parties relating to the subject matter hereof. This Agreement may be amended only by an agreement in writing signed by Kavak and the Customer.`;

export async function generateContractPdf(answers: Answers): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // ----- Logo -----
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageDataUrl(logoBlack);
  } catch {
    logoDataUrl = null;
  }

  // ----- Header -----
  if (logoDataUrl) {
    try {
      const dims = await getImageDimensions(logoDataUrl);
      const logoH = 28;
      const logoW = (dims.width / dims.height) * logoH;
      doc.addImage(logoDataUrl, "PNG", margin, 28, logoW, logoH);
    } catch {
      // skip logo
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text("SERVICE CONTRACT AGREEMENT", pageWidth / 2, 46, { align: "center" });

  // Opening paragraph
  const agreementDate = formatDate(v(answers, "agreement.date", ""));
  const openingText = `"THIS VEHICLE SERVICE AGREEMENT (this "Agreement") is made and entered into as of the ${agreementDate}, by and between KAVAK CAR SERVICE LLC, a company registered in Dubai under Commercial License No. 1185462, having its registered offices at 32, 17b Str., Al Quoz Industrial Area 2, Dubai, Telephone: 600-528251, email: customer.uae@kavak.com (hereinafter referred to as "KAVAK"); and"`;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const openingLines = doc.splitTextToSize(openingText, contentWidth);
  doc.text(openingLines, margin, 70);

  let cursorY = 70 + openingLines.length * 10 + 10;

  // ----- Agreement Date | Car ID -----
  autoTable(doc, {
    startY: cursorY,
    body: [
      [
        { content: "Agreement Date", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        { content: formatDate(v(answers, "agreement.date", "")), styles: { fillColor: [255, 255, 255] as [number, number, number] } },
        { content: "Car ID", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        { content: v(answers, "agreement.car_id"), styles: { fillColor: [255, 255, 255] as [number, number, number] } },
      ],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.15 },
      1: { cellWidth: contentWidth * 0.35 },
      2: { cellWidth: contentWidth * 0.15 },
      3: { cellWidth: contentWidth * 0.35 },
    },
    margin: { left: margin, right: margin },
  });
  cursorY = (doc as any).lastAutoTable.finalY;

  // ----- Customer Details | Vehicle Details -----
  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        { content: "Customer Details", styles: { fillColor: BLACK, textColor: 255, fontStyle: "bold", halign: "left" } },
        { content: "Vehicle Details", styles: { fillColor: BLACK, textColor: 255, fontStyle: "bold", halign: "left" } },
      ],
    ],
    body: [
      [
        `Name: ${v(answers, "customer.name")}`,
        `VIN: ${v(answers, "vehicle.vin")}`,
      ],
      [
        `Mail ID: ${v(answers, "customer.email")}`,
        `Vehicle: ${v(answers, "vehicle.car")}`,
      ],
      [
        `Mobile no: ${v(answers, "customer.mobile")}`,
        ``,
      ],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 },
    },
    margin: { left: margin, right: margin },
  });
  cursorY = (doc as any).lastAutoTable.finalY;

  // ----- Contract Period -----
  const fromKm = v(answers, "contract.from_km");
  const endKm = v(answers, "contract.end_km");

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        {
          content: "Contract Period",
          colSpan: 4,
          styles: { fillColor: BLACK, textColor: 255, fontStyle: "bold", halign: "left" },
        },
      ],
    ],
    body: [
      [
        { content: "From Date", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        formatDate(v(answers, "contract.from_date", "")),
        { content: "From KM", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        fromKm !== "—" ? `${fromKm} km` : "—",
      ],
      [
        { content: "End Date", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        formatDate(v(answers, "contract.end_date", "")),
        { content: "End KM", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        endKm !== "—" ? `${endKm} km` : "—",
      ],
      [
        { content: "Service Intervals", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        { content: SERVICE_INTERVALS, colSpan: 1 },
        { content: "Package", styles: { fontStyle: "bold", fillColor: LIGHT_GRAY } },
        v(answers, "contract.package"),
      ],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.15 },
      1: { cellWidth: contentWidth * 0.35 },
      2: { cellWidth: contentWidth * 0.15 },
      3: { cellWidth: contentWidth * 0.35 },
    },
    margin: { left: margin, right: margin },
  });
  cursorY = (doc as any).lastAutoTable.finalY + 14;

  // ----- Legal preamble -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  const preamble = "Kavak has agreed to enter into this Agreement with the Customer to provide the periodic services to the Vehicle upon the terms and conditions set forth herein:";
  const preambleLines = doc.splitTextToSize(preamble, contentWidth);
  doc.text(preambleLines, margin, cursorY);
  cursorY += preambleLines.length * 11 + 8;

  // ----- Legal clauses -----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const clauseParagraphs = LEGAL_CLAUSES.split("\n\n");
  for (const para of clauseParagraphs) {
    const lines = doc.splitTextToSize(para, contentWidth);
    const blockHeight = lines.length * 10;

    if (cursorY + blockHeight > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      cursorY = 40;
    }

    // Bold the clause heading (first line if it matches "N. Title.")
    const firstLine = lines[0] as string;
    if (/^\d+\./.test(firstLine)) {
      doc.setFont("helvetica", "bold");
      doc.text(firstLine, margin, cursorY);
      doc.setFont("helvetica", "normal");
      if (lines.length > 1) {
        doc.text(lines.slice(1), margin, cursorY + 10);
      }
    } else {
      doc.text(lines, margin, cursorY);
    }

    cursorY += blockHeight + 6;
  }

  // ----- Acknowledgment -----
  cursorY += 4;
  const ack =
    "I ACKNOWLEDGE AND AGREE TO THE TERMS, CONDITIONS, LIMITATIONS AND PROVISIONS DETAILED HEREIN AND OVERLEAF. I hereby declare that I have not relied upon the statements or promises of any person unless those statements or promises are expressly set forth in this Agreement. I understand that I am required to schedule services and routine maintenance whenever alerted by my Vehicle or as per the advised schedule by Kavak to keep this Agreement in force.";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const ackLines = doc.splitTextToSize(ack, contentWidth);
  const ackHeight = ackLines.length * 10;
  if (cursorY + ackHeight > doc.internal.pageSize.getHeight() - 180) {
    doc.addPage();
    cursorY = 40;
  }
  doc.text(ackLines, margin, cursorY);
  cursorY += ackHeight + 14;

  // ----- IN WITNESS WHEREOF -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const witness = "IN WITNESS WHEREOF, Kavak and the Customer have executed this Service Agreement as of the day and year first above written.";
  const witnessLines = doc.splitTextToSize(witness, contentWidth);
  if (cursorY + witnessLines.length * 11 + 180 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    cursorY = 40;
  }
  doc.text(witnessLines, margin, cursorY);
  cursorY += witnessLines.length * 11 + 16;

  // ----- Signature section -----
  const staffName = v(answers, "signature.staff_name", "");
  const customerName = v(answers, "signature.customer_name", "");
  const staffSig: string = answers["signature.staff"] ?? "";
  const customerSig: string = answers["signature.customer"] ?? "";
  const stampDataUrl: string = answers["signature.stamp"] ?? "";

  // Names row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Staff Name: ${staffName}`, margin, cursorY);
  doc.text(`Customer Name: ${customerName}`, margin + contentWidth / 2, cursorY);
  cursorY += 14;

  // Signature boxes
  const sigBoxW = (contentWidth - 10) / 2;
  const sigBoxH = 80;

  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, cursorY, sigBoxW, sigBoxH);
  doc.rect(margin + sigBoxW + 10, cursorY, sigBoxW, sigBoxH);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Signature:", margin + 4, cursorY + 12);
  doc.text("Signature:", margin + sigBoxW + 14, cursorY + 12);
  doc.setTextColor(...BLACK);

  const embedSig = async (dataUrl: string, x: number, y: number, w: number, h: number) => {
    if (!dataUrl) return;
    try {
      const dims = await getImageDimensions(dataUrl);
      const aspect = dims.width / dims.height;
      const padX = 8;
      const padY = 18;
      const maxW = w - padX * 2;
      const maxH = h - padY - 8;
      let imgW = maxW;
      let imgH = imgW / aspect;
      if (imgH > maxH) { imgH = maxH; imgW = imgH * aspect; }
      const imgX = x + (w - imgW) / 2;
      const imgY = y + padY + (maxH - imgH) / 2;
      const ext = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(dataUrl, ext, imgX, imgY, imgW, imgH);
    } catch {
      // skip
    }
  };

  await embedSig(staffSig, margin, cursorY, sigBoxW, sigBoxH);
  await embedSig(customerSig, margin + sigBoxW + 10, cursorY, sigBoxW, sigBoxH);

  cursorY += sigBoxH + 14;

  // Company stamp
  const stampBoxH = 90;
  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, cursorY, contentWidth, stampBoxH);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Company Stamp", margin + 4, cursorY + 12);
  doc.setTextColor(...BLACK);

  if (stampDataUrl) {
    try {
      const dims = await getImageDimensions(stampDataUrl);
      const aspect = dims.width / dims.height;
      const padX = 8;
      const padY = 18;
      const maxW = contentWidth - padX * 2;
      const maxH = stampBoxH - padY - 8;
      let imgW = maxW;
      let imgH = imgW / aspect;
      if (imgH > maxH) { imgH = maxH; imgW = imgH * aspect; }
      const imgX = margin + (contentWidth - imgW) / 2;
      const imgY = cursorY + padY + (maxH - imgH) / 2;
      const ext = stampDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(stampDataUrl, ext, imgX, imgY, imgW, imgH);
    } catch {
      // skip
    }
  }

  // Page footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Kavak Service Contract Agreement  •  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 16,
      { align: "center" }
    );
  }

  return doc;
}

export function saveContractPdf(doc: jsPDF, answers: Answers) {
  const carId = (answers["agreement.car_id"] as string) || "contract";
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`kavak-service-contract-${carId.replace(/[^A-Za-z0-9]+/g, "-")}-${date}.pdf`);
}
