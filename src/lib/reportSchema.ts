// Single source of truth for the report flow.
// Steps are grouped into "pages"; checklist actions vary by service tier.

export type ServiceTier = "minor" | "intermediate" | "major";

// Action codes used in the source PDF and their full names
export const ACTION_NAMES: Record<string, string> = {
  I: "Inspection",
  L: "Lubricate",
  A: "Adjust",
  C: "Clean",
  R: "Replace",
  T: "Torque",
};

export type ActionsByTier = {
  minor: string[];      // empty array = Not Applicable for this tier
  intermediate: string[];
  major: string[];
};

export type FieldStep =
  | { kind: "text"; id: string; label: string; placeholder?: string; section: string; page: string }
  | { kind: "longtext"; id: string; label: string; placeholder?: string; section: string; page: string }
  | { kind: "number"; id: string; label: string; unit?: string; section: string; page: string }
  | { kind: "date"; id: string; label: string; section: string; page: string }
  | { kind: "time"; id: string; label: string; section: string; page: string }
  | { kind: "select"; id: string; label: string; options: string[]; section: string; page: string }
  | { kind: "yesno"; id: string; label: string; section: string; page: string }
  | {
      kind: "checklist";
      id: string;
      label: string;
      actionsByTier: ActionsByTier;
      withNotes?: boolean;
      section: string;
      page: string;
    }
  | {
      kind: "multinumber";
      id: string;
      label: string;
      unit?: string;
      fields: { id: string; label: string }[];
      section: string;
      page: string;
    };

export type Step =
  | { kind: "service-type"; id: string; title: string; subtitle?: string }
  | { kind: "page"; id: string; section: string; title: string; subtitle?: string; fields: FieldStep[] }
  | { kind: "review"; id: string };

export const SECTIONS = {
  vehicle: "Vehicle & Customer",
  interior: "Interior",
  exterior: "Exterior",
  chassis: "Under Chassis",
  wheel: "Wheel Area",
  engine: "Engine Room",
  final: "Final Check",
} as const;

// ---------- Helpers ----------
const page = (
  id: string,
  section: string,
  title: string,
  fields: FieldStep[],
  subtitle?: string,
): Step => ({ kind: "page", id, section, title, subtitle, fields });

// Convert action codes (e.g. "I/L", "I&L", "I/T", "C/L") into full names per tier.
const codes = (s: string): string[] => {
  if (!s) return [];
  return s
    .split(/[/&]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ACTION_NAMES[c] ?? c);
};

const tier = (minor: string, intermediate: string, major: string): ActionsByTier => ({
  minor: codes(minor),
  intermediate: codes(intermediate),
  major: codes(major),
});

const checklist = (
  id: string,
  label: string,
  section: string,
  pageId: string,
  actionsByTier: ActionsByTier,
): FieldStep => ({
  kind: "checklist",
  id,
  label,
  section,
  page: pageId,
  actionsByTier,
  withNotes: true,
});

// ---------- Steps ----------
export const steps: Step[] = [
  // Service type — first thing after Begin Report
  {
    kind: "service-type",
    id: "service-type",
    title: "Type of Service",
    subtitle: "Select the service tier — this drives the checklist for every section.",
  },

  // ===== Vehicle & Customer (3 pages) =====
  page("p-vehicle-1", SECTIONS.vehicle, "Vehicle details", [
    { kind: "text", id: "vehicle.make_model", label: "Vehicle make & model", placeholder: "e.g. Toyota Corolla", section: SECTIONS.vehicle, page: "p-vehicle-1" },
    { kind: "text", id: "vehicle.registration_number", label: "Registration number", placeholder: "e.g. AB/12345", section: SECTIONS.vehicle, page: "p-vehicle-1" },
    { kind: "text", id: "vehicle.vin", label: "VIN", placeholder: "e.g. 1XXXX0000XX000000", section: SECTIONS.vehicle, page: "p-vehicle-1" },
    { kind: "text", id: "vehicle.service_type_mileage", label: "Service type / mileage", placeholder: "e.g. 30,000 KM", section: SECTIONS.vehicle, page: "p-vehicle-1" },
  ]),
  page("p-vehicle-2", SECTIONS.vehicle, "Customer & advisor", [
    { kind: "text", id: "customer.name", label: "Customer name", placeholder: "e.g. John Doe", section: SECTIONS.vehicle, page: "p-vehicle-2" },
    { kind: "text", id: "customer.contact", label: "Customer contact", placeholder: "e.g. 555-0100", section: SECTIONS.vehicle, page: "p-vehicle-2" },
    { kind: "text", id: "service_advisor.name", label: "Service advisor name", placeholder: "e.g. Jane Smith", section: SECTIONS.vehicle, page: "p-vehicle-2" },
  ]),

  // ===== Interior (1 page, 6 items) =====
  page("p-interior", SECTIONS.interior, "Interior", [
    checklist("interior.seats_belts", "All Seats & Seat Belts", SECTIONS.interior, "p-interior", tier("I", "I", "I")),
    checklist("interior.power_window_mirrors_roof", "Power Window, Mirrors & Sliding Roof", SECTIONS.interior, "p-interior", tier("I/L", "I/L", "I/L")),
    checklist("interior.lights_horn_gauges", "Interior Lights, Horn & Gauges", SECTIONS.interior, "p-interior", tier("I", "I", "I")),
    checklist("interior.parking_brake_operation", "Parking Brake Operation", SECTIONS.interior, "p-interior", tier("I/A", "I/A", "I/A")),
    checklist("interior.washer_wipers", "Windshield Washer & Wipers", SECTIONS.interior, "p-interior", tier("I", "I", "I")),
    checklist("interior.ac_operation", "AC Operation", SECTIONS.interior, "p-interior", tier("I", "I", "I")),
  ]),

  // ===== Exterior (1 page, 6 items) =====
  page("p-exterior", SECTIONS.exterior, "Exterior", [
    checklist("exterior.ac_cabin_filter", "AC Filter / Cabin Air Filter", SECTIONS.exterior, "p-exterior", tier("C", "R", "R")),
    checklist("exterior.door_hinges_locks", "All Door Hinges & Locks", SECTIONS.exterior, "p-exterior", tier("L", "L", "L")),
    checklist("exterior.hood_stay_lock", "Engine Hood, Hood Stay & Hood Lock", SECTIONS.exterior, "p-exterior", tier("I/L", "I/L", "I/L")),
    checklist("exterior.trunk_stay_lock", "Trunk Lid, Trunk Stay & Trunk Lock", SECTIONS.exterior, "p-exterior", tier("I/L", "I/L", "I/L")),
    checklist("exterior.wiper_blades", "Front & Rear Wiper Blades", SECTIONS.exterior, "p-exterior", tier("I", "I", "I")),
    checklist("exterior.windshield_lights", "Front & Rear Windshield & Lights", SECTIONS.exterior, "p-exterior", tier("I", "I", "I")),
  ]),

  // ===== Under Chassis (3 pages, 18 items) =====
  page("p-chassis-1", SECTIONS.chassis, "Under Chassis", [
    checklist("chassis.engine_oil_filter", "Engine Oil and Oil Filter", SECTIONS.chassis, "p-chassis-1", tier("R", "R", "R")),
    checklist("chassis.mtm_atm_oil", "MTM/ATM Oil", SECTIONS.chassis, "p-chassis-1", tier("I", "I", "I")),
    checklist("chassis.atm_oil_ws", "ATM Oil (WS)", SECTIONS.chassis, "p-chassis-1", tier("I", "I", "I")),
    checklist("chassis.cvt_oil", "CVT Oil", SECTIONS.chassis, "p-chassis-1", tier("I", "I", "I")),
    checklist("chassis.transfer_box_oil", "Transfer Box Oil", SECTIONS.chassis, "p-chassis-1", tier("I", "I", "I")),
    checklist("chassis.differential_oil", "Differential Oil", SECTIONS.chassis, "p-chassis-1", tier("I", "I", "I")),
    checklist("chassis.coolant", "Coolant", SECTIONS.chassis, "p-chassis-1", tier("I", "I", "I")),
  ]),
  page("p-chassis-2", SECTIONS.chassis, "Under Chassis", [
    checklist("chassis.brake_pipes_hoses", "Brake Pipes & Hoses", SECTIONS.chassis, "p-chassis-2", tier("I", "I", "I")),
    checklist("chassis.fuel_lines_connections", "Fuel Lines & Connections", SECTIONS.chassis, "p-chassis-2", tier("I", "I", "I")),
    checklist("chassis.steering_wear_leaks", "Steering Wear and Leaks", SECTIONS.chassis, "p-chassis-2", tier("I", "I", "I")),
    checklist("chassis.propeller_shaft", "Propeller Shaft", SECTIONS.chassis, "p-chassis-2", tier("I&L", "I&L", "I&L")),
    checklist("chassis.drive_shaft_boots", "Drive Shaft Boots", SECTIONS.chassis, "p-chassis-2", tier("I", "I", "I")),
    checklist("chassis.ball_joints_dust_cover", "Ball Joints and Dust Cover", SECTIONS.chassis, "p-chassis-2", tier("I", "I", "I")),
  ]),
  page("p-chassis-3", SECTIONS.chassis, "Under Chassis", [
    checklist("chassis.shock_absorbers", "Front and Rear Shock Absorber", SECTIONS.chassis, "p-chassis-3", tier("I", "I", "I")),
    checklist("chassis.suspension_bush", "Front and Rear Suspension Bush", SECTIONS.chassis, "p-chassis-3", tier("I", "I", "I")),
    checklist("chassis.wheel_bearings", "Wheel Bearings", SECTIONS.chassis, "p-chassis-3", tier("I", "I", "I")),
    checklist("chassis.exhaust_pipes_mounting", "Exhaust Pipes and Mounting", SECTIONS.chassis, "p-chassis-3", tier("I", "I", "I")),
    checklist("chassis.engine_gearbox_mounting", "Engine and Gear Box Mounting", SECTIONS.chassis, "p-chassis-3", tier("I", "I", "I")),
  ]),

  // ===== Wheel Area (1 page, 4 items + measurements) =====
  page("p-wheel", SECTIONS.wheel, "Wheel Area", [
    checklist("wheel.tyre_condition_pressure", "Tyre Condition and Tyre Pressure", SECTIONS.wheel, "p-wheel", tier("I/A", "I/A", "I/A")),
    {
      kind: "multinumber",
      id: "wheel.tyre_thickness_mm",
      label: "Tyre thickness",
      unit: "mm",
      section: SECTIONS.wheel,
      page: "p-wheel",
      fields: [
        { id: "fr_lh", label: "Front Left" },
        { id: "fr_rh", label: "Front Right" },
        { id: "rr_lh", label: "Rear Left" },
        { id: "rr_rh", label: "Rear Right" },
      ],
    },
    checklist("wheel.front_brake_pads_discs", "Front Brake Pads and Discs", SECTIONS.wheel, "p-wheel", tier("I", "I", "I/C")),
    checklist("wheel.rear_brake_pads_discs", "Rear Brake Pads and Discs", SECTIONS.wheel, "p-wheel", tier("I", "I", "I/C")),
    {
      kind: "multinumber",
      id: "wheel.brake_pad_thickness_mm",
      label: "Brake pad thickness",
      unit: "mm",
      section: SECTIONS.wheel,
      page: "p-wheel",
      fields: [
        { id: "fr_lh", label: "Front Left" },
        { id: "fr_rh", label: "Front Right" },
        { id: "rr_lh", label: "Rear Left" },
        { id: "rr_rh", label: "Rear Right" },
      ],
    },
    checklist("wheel.parking_brake", "Parking Brake", SECTIONS.wheel, "p-wheel", tier("I", "I", "I/A")),
  ]),

  // ===== Engine Room (2 pages, 11 items) =====
  page("p-engine-1", SECTIONS.engine, "Engine Room", [
    checklist("engine.air_filter", "Air Filter", SECTIONS.engine, "p-engine-1", tier("C", "C", "R")),
    checklist("engine.fuel_filter", "Fuel Filter", SECTIONS.engine, "p-engine-1", tier("I", "I", "I")),
    checklist("engine.spark_plugs_normal", "Spark Plugs (Normal)", SECTIONS.engine, "p-engine-1", tier("I", "I", "I")),
    checklist("engine.spark_plugs_platinum_iridium", "Spark Plugs (Platinum/Iridium)", SECTIONS.engine, "p-engine-1", tier("I", "I", "I")),
    checklist("engine.battery_electrolyte_connections", "Battery Electrolyte and Connections", SECTIONS.engine, "p-engine-1", tier("C/L", "C/L", "C/L")),
    checklist("engine.battery_report", "Battery Report", SECTIONS.engine, "p-engine-1", tier("I", "I", "I")),
  ]),
  page("p-engine-2", SECTIONS.engine, "Engine Room — Fluids & Belts", [
    checklist("engine.brake_fluid", "Brake Fluid", SECTIONS.engine, "p-engine-2", tier("I", "I", "R")),
    checklist("engine.windshield_fluid", "Windshield Fluid", SECTIONS.engine, "p-engine-2", tier("I", "I", "I")),
    checklist("engine.power_steering_fluid", "Power Steering Fluid", SECTIONS.engine, "p-engine-2", tier("I", "I", "I")),
    checklist("engine.drive_belts", "Drive Belts", SECTIONS.engine, "p-engine-2", tier("I", "I", "I")),
    // Timing Belt — Not Applicable in Minor / Intermediate
    checklist("engine.timing_belt", "Timing Belt", SECTIONS.engine, "p-engine-2", tier("", "", "R")),
  ]),

  // ===== Final Check (1 page, 3 items) =====
  page("p-final", SECTIONS.final, "Final Check", [
    checklist("final.wheel_nuts_torque", "All Wheel Nuts Torque", SECTIONS.final, "p-final", tier("I/T", "I/T", "I/T")),
    checklist("final.fluids_level", "All Fluids Level", SECTIONS.final, "p-final", tier("I", "I", "I")),
    checklist("final.connection_caps_covers", "Connection Caps and Covers", SECTIONS.final, "p-final", tier("I", "I", "I")),
  ]),

  { kind: "review", id: "review" },
];

// Flat list of all field steps (used by review/payload/PDF)
export const allFieldSteps: FieldStep[] = steps.flatMap((s) =>
  s.kind === "page" ? s.fields : [],
);

// Service tier helpers
export const SERVICE_TIER_LABEL: Record<ServiceTier, string> = {
  minor: "Minor Service",
  intermediate: "Intermediate Service",
  major: "Major Service",
};

export const getActionsForTier = (
  field: Extract<FieldStep, { kind: "checklist" }>,
  tierKey: ServiceTier | undefined,
): string[] => {
  if (!tierKey) return [];
  return field.actionsByTier[tierKey] ?? [];
};
