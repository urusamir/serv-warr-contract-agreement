import { useEffect, useState } from "react";
import { Search, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";

type Report = {
  id: string;
  submitted_at: string;
  service_type: string | null;
  make_model: string | null;
  registration_number: string | null;
  vin: string | null;
  service_mileage: string | null;
  customer_name: string | null;
  customer_contact: string | null;
  service_advisor: string | null;
  payload: Record<string, any>;
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  minor: "Minor",
  intermediate: "Intermediate",
  major: "Major",
};

const SERVICE_TYPE_COLOR: Record<string, string> = {
  minor: "bg-blue-500/20 text-blue-300",
  intermediate: "bg-yellow-500/20 text-yellow-300",
  major: "bg-red-500/20 text-red-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function decodeFieldValue(value: any): { text: string | null; notes?: string } {
  if (typeof value === "object" && value !== null && Array.isArray(value.actions)) {
    if (value.actions.length === 0) return { text: null };
    return { text: value.actions.join(", "), notes: value.notes?.trim() || undefined };
  }
  if (typeof value === "object" && value !== null) {
    const parts = Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
    return parts.length ? { text: parts.join(" · ") } : { text: null };
  }
  const str = value != null ? String(value).trim() : "";
  return str ? { text: str } : { text: null };
}

function formatPayloadSection(sectionKey: string, sectionValue: any): React.ReactNode {
  if (typeof sectionValue !== "object" || sectionValue === null) return null;
  const rows: React.ReactNode[] = [];
  for (const [fieldKey, fieldValue] of Object.entries(sectionValue)) {
    const { text, notes } = decodeFieldValue(fieldValue);
    if (text === null) continue;
    rows.push(
      <div key={fieldKey} className="flex gap-3 text-sm py-2 border-b border-white/5 last:border-0">
        <span className="text-white/50 min-w-[180px] shrink-0 capitalize">{fieldKey.replace(/_/g, " ")}</span>
        <div>
          <span className="text-white">{text}</span>
          {notes && <p className="text-white/40 text-xs mt-0.5">{notes}</p>}
        </div>
      </div>
    );
  }
  if (rows.length === 0) return null;
  return (
    <div key={sectionKey} className="mb-5">
      <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
        {sectionKey.replace(/_/g, " ")}
      </h4>
      <div>{rows}</div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
        <Trash2 className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <p className="text-white font-semibold mb-1">Delete report?</p>
        <p className="text-white/50 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const sections = Object.entries(report.payload).filter(([k]) => !["submitted_at", "source"].includes(k));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="font-bold text-white">{report.vin || "—"}</p>
            <p className="text-sm text-white/50">{report.registration_number} · {formatDate(report.submitted_at)}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 space-y-2">
          {sections.map(([key, value]) => formatPayloadSection(key, value))}
        </div>
      </div>
    </div>
  );
}

function EntriesTab({ reports, onDelete }: { reports: Report[]; onDelete: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const expanded = reports.find((r) => r.id === expandedId) ?? null;
  const confirming = reports.find((r) => r.id === confirmId) ?? null;

  return (
    <>
      {expanded && <EntryModal report={expanded} onClose={() => setExpandedId(null)} />}
      {confirming && (
        <ConfirmModal
          message={`${confirming.vin || confirming.registration_number || "This report"} will be permanently deleted.`}
          onConfirm={() => { setConfirmId(null); onDelete(confirming.id); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
              <th className="text-left py-3 pr-4 font-medium">Submitted</th>
              <th className="text-left py-3 pr-4 font-medium">VIN</th>
              <th className="text-left py-3 pr-4 font-medium">Registration</th>
              <th className="text-left py-3 pr-4 font-medium">Customer</th>
              <th className="text-left py-3 pr-4 font-medium">Service Type</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr><td colSpan={6} className="py-16 text-center text-white/30">No entries found</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4 text-white/60 whitespace-nowrap">{formatDate(r.submitted_at)}</td>
                <td className="py-3 pr-4 font-mono text-white/90">{r.vin || "—"}</td>
                <td className="py-3 pr-4 text-white/70">{r.registration_number || "—"}</td>
                <td className="py-3 pr-4 text-white/70">{r.customer_name || "—"}</td>
                <td className="py-3 pr-4">
                  {r.service_type ? (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SERVICE_TYPE_COLOR[r.service_type] ?? "bg-white/10 text-white/60"}`}>
                      {SERVICE_TYPE_LABEL[r.service_type] ?? r.service_type}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedId(r.id === expandedId ? null : r.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white font-semibold transition-colors"
                    >
                      {r.id === expandedId ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Details
                    </button>
                    <button
                      onClick={() => setConfirmId(r.id)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const History = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    supabase
      .from("service_reports")
      .select("*")
      .gte("submitted_at", threeMonthsAgo.toISOString())
      .order("submitted_at", { ascending: false })
      .then(({ data }) => {
        setReports((data as Report[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    await supabase.from("service_reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = reports.filter((r) =>
    !search || (r.vin ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen w-full bg-black text-white flex flex-col">
      <NavBar />
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <h1 className="text-4xl font-black tracking-tight mb-8">History</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by VIN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-white/30 text-sm">Loading…</p>
        ) : (
          <EntriesTab reports={filtered} onDelete={handleDelete} />
        )}
      </div>
    </main>
  );
};

export default History;
