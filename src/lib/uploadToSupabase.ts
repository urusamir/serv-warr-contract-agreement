import type jsPDF from "jspdf";
import { supabase } from "./supabase";
import { buildReportFilename } from "./generateReportPdf";

type Answers = Record<string, any>;

function buildStoragePath(answers: Answers, filename: string): string {
  const vin = (answers["vehicle.vin"] as string) || "unknown";
  const safeVin = vin.replace(/[^A-Za-z0-9]+/g, "-");
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, "-");
  return `${safeVin}/${date}/${time}-${filename}`;
}

export async function uploadToSupabase(
  doc: jsPDF,
  answers: Answers,
  payload: Record<string, any>
): Promise<void> {
  const filename = buildReportFilename(answers);
  const storagePath = buildStoragePath(answers, filename);

  const pdfBlob = doc.output("blob");

  const { error: storageError } = await supabase.storage
    .from("service-report-pdfs")
    .upload(storagePath, pdfBlob, { contentType: "application/pdf", upsert: false });

  if (storageError) {
    throw new Error(`PDF upload failed: ${storageError.message}`);
  }

  const { error: dbError } = await supabase.from("service_reports").insert({
    submitted_at: payload.submitted_at ?? new Date().toISOString(),
    service_type: answers["service.type"] ?? null,
    make_model: answers["vehicle.make_model"] ?? null,
    registration_number: answers["vehicle.registration_number"] ?? null,
    vin: answers["vehicle.vin"] ?? null,
    service_mileage: answers["vehicle.service_type_mileage"] ?? null,
    customer_name: answers["customer.name"] ?? null,
    customer_contact: answers["customer.contact"] ?? null,
    customer_email: answers["customer.email"] ?? null,
    service_advisor: answers["service_advisor.name"] ?? null,
    payload,
    pdf_storage_path: storagePath,
  });

  if (dbError) {
    throw new Error(`Database insert failed: ${dbError.message}`);
  }
}
