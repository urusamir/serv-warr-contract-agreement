export type ContractType = "service" | "warranty";

export type FieldDef =
  | { kind: "text"; id: string; label: string; placeholder?: string; required?: boolean; locked?: boolean }
  | { kind: "date"; id: string; label: string; required?: boolean; locked?: boolean }
  | { kind: "number"; id: string; label: string; unit?: string; required?: boolean; locked?: boolean }
  | { kind: "select"; id: string; label: string; options: string[]; required?: boolean; locked?: boolean };

export type CustomerType = "kavak" | "non-kavak";

export type Step =
  | { kind: "customer-type"; id: string }
  | { kind: "contract-type"; id: string }
  | { kind: "page"; id: string; section: string; title: string; subtitle?: string; fields: FieldDef[] }
  | { kind: "terms"; id: string }
  | { kind: "signature"; id: string };

export const SERVICE_PACKAGES = [
  "OKM-SC-2YR-30KM",
  "UC-SC-2YR-30KM",
  "UC-SC-1YR-20KM",
  "Custom Package",
];

export const WARRANTY_PACKAGES = [
  "Plus Warranty-12MNTS/30KM",
  "Plus Warranty-24MNTS/60KM",
  "Basic Warranty-12MNTS/30KM",
  "Basic Warranty-24MNTS/60KM",
  "Custom Package",
];

export const SERVICE_INTERVALS = "6 months / 10,000 KM whichever comes first";

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  service: "Service Contract",
  warranty: "Warranty Contract",
};

export const steps: Step[] = [
  { kind: "customer-type", id: "customer-type" },
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
      { kind: "text", id: "customer.name", label: "Full Name", placeholder: "e.g. John Doe", locked: true },
      { kind: "text", id: "customer.email", label: "Email Address", placeholder: "e.g. john@example.com", locked: true },
      { kind: "text", id: "customer.mobile", label: "Mobile Number", placeholder: "e.g. 971501234567", locked: true },
    ],
  },

  {
    kind: "page",
    id: "p-vehicle",
    section: "Vehicle Details",
    title: "Vehicle details",
    fields: [
      { kind: "text", id: "vehicle.vin", label: "VIN", placeholder: "e.g. W1NFB5KB9LA176147", locked: true },
      { kind: "text", id: "vehicle.car", label: "Vehicle", placeholder: "e.g. 2021 Suzuki Jimny 1.5L 4Cyl 102hp GL", locked: true },
    ],
  },

  {
    kind: "page",
    id: "p-contract-period",
    section: "Contract Period",
    title: "Contract period",
    fields: [
      { kind: "date", id: "contract.from_date", label: "From Date" },
      { kind: "number", id: "contract.from_km", label: "From KM", unit: "km", required: true },
      { kind: "date", id: "contract.end_date", label: "End Date" },
      { kind: "number", id: "contract.end_km", label: "End KM", unit: "km" },
      { kind: "select", id: "contract.package", label: "Package", options: SERVICE_PACKAGES, required: true },
    ],
  },

  { kind: "terms", id: "terms" },
  { kind: "signature", id: "signature" },
];
