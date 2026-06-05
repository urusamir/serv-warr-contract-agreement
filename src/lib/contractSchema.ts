export type ContractType = "service" | "warranty";

export type FieldDef =
  | { kind: "text"; id: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "date"; id: string; label: string; required?: boolean }
  | { kind: "number"; id: string; label: string; unit?: string; required?: boolean }
  | { kind: "select"; id: string; label: string; options: string[]; required?: boolean };

export type Step =
  | { kind: "contract-type"; id: string }
  | { kind: "page"; id: string; section: string; title: string; subtitle?: string; fields: FieldDef[] }
  | { kind: "terms"; id: string }
  | { kind: "signature"; id: string };

export const SERVICE_PACKAGES = [
  "UC-SC-1YR-10KM",
  "UC-SC-1YR-20KM",
  "UC-SC-2YR-20KM",
  "UC-SC-2YR-30KM",
  "UC-SC-3YR-30KM",
];

export const SERVICE_INTERVALS = "6 months / 10,000 KM whichever comes first";

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  service: "Service Contract",
  warranty: "Warranty Contract",
};

export const steps: Step[] = [
  { kind: "contract-type", id: "contract-type" },

  {
    kind: "page",
    id: "p-agreement",
    section: "Agreement",
    title: "Agreement details",
    fields: [
      { kind: "date", id: "agreement.date", label: "Agreement Date" },
      { kind: "text", id: "agreement.car_id", label: "Car ID", placeholder: "e.g. DXB24942-S", required: true },
    ],
  },

  {
    kind: "page",
    id: "p-customer",
    section: "Customer Details",
    title: "Customer details",
    fields: [
      { kind: "text", id: "customer.name", label: "Full Name", placeholder: "e.g. John Doe" },
      { kind: "text", id: "customer.email", label: "Email Address", placeholder: "e.g. john@example.com" },
      { kind: "text", id: "customer.mobile", label: "Mobile Number", placeholder: "e.g. 971501234567" },
    ],
  },

  {
    kind: "page",
    id: "p-vehicle",
    section: "Vehicle Details",
    title: "Vehicle details",
    fields: [
      { kind: "text", id: "vehicle.vin", label: "VIN", placeholder: "e.g. W1NFB5KB9LA176147" },
      { kind: "text", id: "vehicle.make", label: "Vehicle Make", placeholder: "e.g. Mercedes Benz" },
      { kind: "text", id: "vehicle.model", label: "Vehicle Model", placeholder: "e.g. GLE 450 3.0L 6Cyl 362hp" },
    ],
  },

  {
    kind: "page",
    id: "p-contract-period",
    section: "Contract Period",
    title: "Contract period",
    fields: [
      { kind: "date", id: "contract.from_date", label: "From Date" },
      { kind: "number", id: "contract.from_km", label: "From KM", unit: "km" },
      { kind: "date", id: "contract.end_date", label: "End Date" },
      { kind: "number", id: "contract.end_km", label: "End KM", unit: "km" },
      { kind: "select", id: "contract.package", label: "Package", options: SERVICE_PACKAGES },
    ],
  },

  { kind: "terms", id: "terms" },
  { kind: "signature", id: "signature" },
];
