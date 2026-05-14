import type jsPDF from "jspdf";
import { buildReportFilename } from "./generateReportPdf";
import { SERVICE_TIER_LABEL, type ServiceTier } from "./reportSchema";

type Answers = Record<string, any>;

const ADVISOR_EMAILS: Record<string, string> = {
  "Jino Varghese":    "jino.varghese@kavak.com",
  "Hassan Ishaque":   "hassan.ishaque@kavak.com",
  "Yaseen Ustad":     "yaseen.ustad@kavak.com",
  "Salman Alblooshi": "salman.alblooshi@kavak.com",
  "Rashith Mooliyil": "rashith.mooliyil@kavak.com",
};

const WEBHOOK_URL = "https://kavakgccdev.app.n8n.cloud/webhook/service-report";

export async function sendReportWebhook(doc: jsPDF, answers: Answers): Promise<void> {
  const advisorName = (answers["service_advisor.name"] as string) ?? "";
  const advisorEmail = ADVISOR_EMAILS[advisorName] ?? "rashith.mooliyil@kavak.com";
  const tier = answers["service.type"] as ServiceTier | undefined;
  const filename = buildReportFilename(answers);

  const formData = new FormData();
  formData.append("pdf", doc.output("blob"), filename);
  formData.append("advisor_name",       advisorName);
  formData.append("advisor_email",      advisorEmail);
  formData.append("customer_name",      answers["customer.name"]      ?? "");
  formData.append("customer_email",     answers["customer.email"]     ?? "");
  formData.append("vehicle_make_model", answers["vehicle.make_model"] ?? "");
  formData.append("vin",                answers["vehicle.vin"]        ?? "");
  formData.append("service_date",       new Date().toLocaleDateString());
  formData.append("service_type",       tier ? SERVICE_TIER_LABEL[tier] : "");

  const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });

  if (!res.ok) {
    throw new Error(`Webhook responded with ${res.status}`);
  }
}
