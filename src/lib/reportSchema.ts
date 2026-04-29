// Single source of truth for the report flow.
// Steps are grouped into "pages" so multiple fields render together.

export type ActionOption = "Inspect" | "Lubricate" | "Replace" | "Clean" | "Top-up" | "Adjust" | "Measure" | "Do";

export type FieldStep =
  | { kind: "text"; id: string; label: string; placeholder?: string; defaultValue?: string; section: string; page: string }
  | { kind: "longtext"; id: string; label: string; placeholder?: string; section: string; page: string }
  | { kind: "number"; id: string; label: string; unit?: string; section: string; page: string }
  | { kind: "date"; id: string; label: string; section: string; page: string }
  | { kind: "time"; id: string; label: string; section: string; page: string }
  | { kind: "select"; id: string; label: string; options: string[]; section: string; page: string }
  | { kind: "yesno"; id: string; label: string; section: string; page: string }
  | { kind: "checklist"; id: string; label: string; actions: ActionOption[]; withNotes?: boolean; section: string; page: string }
  | { kind: "multinumber"; id: string; label: string; unit?: string; fields: { id: string; label: string }[]; section: string; page: string }
  | { kind: "multiselect"; id: string; label: string; options: string[]; section: string; page: string };

export type Step =
  | { kind: "intro"; id: string; title: string; subtitle?: string }
  | { kind: "page"; id: string; section: string; title: string; subtitle?: string; fields: FieldStep[] }
  | { kind: "review"; id: string };

const ACT_INSPECT: ActionOption[] = ["Inspect"];
const ACT_LUBE: ActionOption[] = ["Lubricate"];
const ACT_INSPECT_LUBE: ActionOption[] = ["Inspect", "Lubricate"];
const ACT_INSPECT_TOPUP: ActionOption[] = ["Inspect", "Top-up"];
const ACT_INSPECT_CLEAN: ActionOption[] = ["Inspect", "Clean"];
const ACT_INSPECT_REPLACE: ActionOption[] = ["Inspect", "Replace"];
const ACT_INSPECT_ADJUST: ActionOption[] = ["Inspect", "Adjust"];

export const SECTIONS = {
  vehicle: "Vehicle & Customer",
  exterior: "Exterior",
  interior: "Interior",
  chassis: "Under Chassis",
  engine: "Engine Room",
  final: "Final Check & Test Drive",
  refurb: "Suggested Refurb",
} as const;

// Helper to declare a page
const page = (
  id: string,
  section: string,
  title: string,
  fields: FieldStep[],
  subtitle?: string,
): Step => ({ kind: "page", id, section, title, subtitle, fields });

export const steps: Step[] = [
  // ===== Vehicle & Customer (3 pages) =====
  page("p-vehicle-1", SECTIONS.vehicle, "Vehicle details", [
    { kind: "text", id: "vehicle.make_model", label: "Vehicle make & model", defaultValue: "Honda Accord", section: SECTIONS.vehicle, page: "p-vehicle-1" },
    { kind: "text", id: "vehicle.registration_number", label: "Registration number", placeholder: "DD/59068", section: SECTIONS.vehicle, page: "p-vehicle-1" },
    { kind: "text", id: "vehicle.vin", label: "VIN", placeholder: "1HGCY1695PA600617", section: SECTIONS.vehicle, page: "p-vehicle-1" },
    { kind: "text", id: "vehicle.service_type_mileage", label: "Service type / mileage", placeholder: "20,000 KM", section: SECTIONS.vehicle, page: "p-vehicle-1" },
  ]),
  page("p-vehicle-2", SECTIONS.vehicle, "Customer & advisor", [
    { kind: "text", id: "customer.name", label: "Customer name", placeholder: "Azlan Ijaz", section: SECTIONS.vehicle, page: "p-vehicle-2" },
    { kind: "text", id: "customer.contact", label: "Customer contact", placeholder: "521311518", section: SECTIONS.vehicle, page: "p-vehicle-2" },
    { kind: "text", id: "service_advisor.name", label: "Service advisor name", placeholder: "Shaikh Tarique", section: SECTIONS.vehicle, page: "p-vehicle-2" },
    { kind: "text", id: "service_advisor.number", label: "Service advisor number", section: SECTIONS.vehicle, page: "p-vehicle-2" },
  ]),
  page("p-vehicle-3", SECTIONS.vehicle, "Service appointment", [
    { kind: "date", id: "vehicle.service_date", label: "Service date", section: SECTIONS.vehicle, page: "p-vehicle-3" },
    { kind: "time", id: "vehicle.service_time", label: "Service time", section: SECTIONS.vehicle, page: "p-vehicle-3" },
    { kind: "select", id: "vehicle.service_plan", label: "Service plan", options: ["Comprehensive Contract", "Basic", "Other"], section: SECTIONS.vehicle, page: "p-vehicle-3" },
  ]),

  // ===== Exterior (1 page) =====
  page("p-exterior", SECTIONS.exterior, "Exterior checks", [
    { kind: "checklist", id: "exterior.windshield_and_lights", label: "Front & rear windshield and all lights", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.exterior, page: "p-exterior" },
    { kind: "checklist", id: "exterior.door_hinges_and_locks", label: "All door hinges and locks", actions: ACT_LUBE, withNotes: true, section: SECTIONS.exterior, page: "p-exterior" },
    { kind: "checklist", id: "exterior.hood_stay_lock", label: "Hood stay & hood lock", actions: ACT_LUBE, withNotes: true, section: SECTIONS.exterior, page: "p-exterior" },
    { kind: "checklist", id: "exterior.trunk_stay_lock", label: "Trunk stay & trunk lock", actions: ACT_LUBE, withNotes: true, section: SECTIONS.exterior, page: "p-exterior" },
    { kind: "checklist", id: "exterior.wiper_blades", label: "Front & rear wiper blades", actions: ACT_INSPECT_REPLACE, withNotes: true, section: SECTIONS.exterior, page: "p-exterior" },
  ]),

  // ===== Interior (2 pages) =====
  page("p-interior-1", SECTIONS.interior, "Interior checks", [
    { kind: "checklist", id: "interior.seats_and_belts", label: "All seats & seat belt operation", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.interior, page: "p-interior-1" },
    { kind: "checklist", id: "interior.power_window_mirror_sunroof", label: "Power window, mirror, sunroof", actions: ACT_INSPECT_LUBE, withNotes: true, section: SECTIONS.interior, page: "p-interior-1" },
    { kind: "checklist", id: "interior.lights_horn_gauges", label: "Interior lights, horn and gauges", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.interior, page: "p-interior-1" },
    { kind: "checklist", id: "interior.parking_brake", label: "Parking brake operation", actions: ACT_INSPECT_ADJUST, withNotes: true, section: SECTIONS.interior, page: "p-interior-1" },
    { kind: "checklist", id: "interior.washer_wiper", label: "Windshield washer & wiper", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.interior, page: "p-interior-1" },
  ]),
  page("p-interior-2", SECTIONS.interior, "Air conditioning", [
    { kind: "checklist", id: "interior.ac_performance", label: "A/C performance check", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.interior, page: "p-interior-2" },
    { kind: "checklist", id: "interior.ac_condenser_exterior", label: "A/C condenser exterior", actions: ACT_INSPECT_CLEAN, withNotes: true, section: SECTIONS.interior, page: "p-interior-2" },
    { kind: "number", id: "interior.ac_vent_temperature_c", label: "A/C temperature — centre vent grill", unit: "°C", section: SECTIONS.interior, page: "p-interior-2" },
    { kind: "longtext", id: "interior.ac_filter_notes", label: "Remove & clean A/C filter — notes", placeholder: "e.g. AC cabin filter dusty and bad", section: SECTIONS.interior, page: "p-interior-2" },
  ]),

  // ===== Under Chassis (5 pages) =====
  page("p-chassis-1", SECTIONS.chassis, "Fluids & lines", [
    { kind: "checklist", id: "chassis.engine_oil_filter", label: "Engine oil & oil filter", actions: ["Replace"], withNotes: true, section: SECTIONS.chassis, page: "p-chassis-1" },
    { kind: "checklist", id: "chassis.transmission_fluid", label: "Automatic / manual transmission fluid", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-1" },
    { kind: "checklist", id: "chassis.coolant", label: "Coolant condition", actions: ACT_INSPECT_TOPUP, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-1" },
    { kind: "checklist", id: "chassis.brake_pipe_hoses", label: "Brake pipe and hoses", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-1" },
    { kind: "checklist", id: "chassis.fuel_lines", label: "Fuel lines", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-1" },
  ]),
  page("p-chassis-2", SECTIONS.chassis, "Steering & drivetrain", [
    { kind: "checklist", id: "chassis.steering_boots", label: "Steering boots condition", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-2" },
    { kind: "checklist", id: "chassis.propeller_shaft", label: "Propeller shaft", actions: ACT_INSPECT_LUBE, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-2" },
    { kind: "checklist", id: "chassis.drive_shaft_boots", label: "Drive shaft boots", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-2" },
    { kind: "checklist", id: "chassis.ball_joint_boots", label: "Ball joint & boots", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-2" },
  ]),
  page("p-chassis-3", SECTIONS.chassis, "Suspension & mounts", [
    { kind: "checklist", id: "chassis.shock_absorbers", label: "Front & rear shock absorbers", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-3" },
    { kind: "checklist", id: "chassis.suspension", label: "Front & rear suspension", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-3" },
    { kind: "checklist", id: "chassis.wheel_bearing", label: "Wheel bearing", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-3" },
    { kind: "checklist", id: "chassis.exhaust", label: "Exhaust pipe & mountings", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-3" },
    { kind: "checklist", id: "chassis.engine_transmission_mounts", label: "Engine and transmission mounts", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-3" },
  ]),
  page("p-chassis-4", SECTIONS.chassis, "Tyres", [
    { kind: "checklist", id: "chassis.tyre_condition_pressure", label: "Tyre condition & pressure", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.chassis, page: "p-chassis-4" },
    {
      kind: "multinumber",
      id: "chassis.tyre_tread_depth_mm",
      label: "Tyre tread depth",
      unit: "mm",
      section: SECTIONS.chassis,
      page: "p-chassis-4",
      fields: [
        { id: "fr_lh", label: "Front Left" },
        { id: "fr_rh", label: "Front Right" },
        { id: "rr_lh", label: "Rear Left" },
        { id: "rr_rh", label: "Rear Right" },
      ],
    },
    { kind: "yesno", id: "chassis.tyre_pressure_adjusted", label: "Tyre pressure adjusted to spec?", section: SECTIONS.chassis, page: "p-chassis-4" },
    { kind: "yesno", id: "chassis.wheel_balancing_done", label: "Wheel balancing performed?", section: SECTIONS.chassis, page: "p-chassis-4" },
  ]),
  page("p-chassis-5", SECTIONS.chassis, "Brakes", [
    {
      kind: "multinumber",
      id: "chassis.front_brake_pads_mm",
      label: "Front brake pads",
      unit: "mm",
      section: SECTIONS.chassis,
      page: "p-chassis-5",
      fields: [
        { id: "fr", label: "Front" },
        { id: "rr", label: "Rear" },
      ],
    },
    {
      kind: "multinumber",
      id: "chassis.brake_discs_mm",
      label: "Brake discs",
      unit: "mm",
      section: SECTIONS.chassis,
      page: "p-chassis-5",
      fields: [
        { id: "fr", label: "Front" },
        { id: "rr", label: "Rear" },
      ],
    },
  ]),

  // ===== Engine Room (2 pages) =====
  page("p-engine-1", SECTIONS.engine, "Engine bay — inspection", [
    { kind: "checklist", id: "engine.battery", label: "Battery condition & terminals", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.engine, page: "p-engine-1" },
    { kind: "checklist", id: "engine.air_filter", label: "Air filter", actions: ACT_INSPECT_CLEAN, withNotes: true, section: SECTIONS.engine, page: "p-engine-1" },
    { kind: "checklist", id: "engine.spark_plug", label: "Spark plug", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.engine, page: "p-engine-1" },
    { kind: "checklist", id: "engine.drive_belt", label: "Drive belt", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.engine, page: "p-engine-1" },
  ]),
  page("p-engine-2", SECTIONS.engine, "Engine bay — fluids", [
    { kind: "checklist", id: "engine.brake_fluid", label: "Brake fluid", actions: ACT_INSPECT_TOPUP, withNotes: true, section: SECTIONS.engine, page: "p-engine-2" },
    { kind: "checklist", id: "engine.power_steering_fluid", label: "Power steering fluid", actions: ACT_INSPECT_TOPUP, withNotes: true, section: SECTIONS.engine, page: "p-engine-2" },
    { kind: "checklist", id: "engine.washer_fluid", label: "Windshield washer fluid", actions: ACT_INSPECT_TOPUP, withNotes: true, section: SECTIONS.engine, page: "p-engine-2" },
  ]),

  // ===== Final & Test Drive (1 page) =====
  page("p-final", SECTIONS.final, "Final check & test drive", [
    { kind: "yesno", id: "final.service_reminder_reset", label: "Service reminder reset done?", section: SECTIONS.final, page: "p-final" },
    { kind: "checklist", id: "final.fluid_levels", label: "All fluid levels", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.final, page: "p-final" },
    { kind: "checklist", id: "final.covers_connectors_undershield", label: "All covers, connectors, under shield", actions: ACT_INSPECT, withNotes: true, section: SECTIONS.final, page: "p-final" },
    { kind: "longtext", id: "test_drive.notes", label: "Test drive observations", placeholder: "e.g. Wheel alignment required", section: SECTIONS.final, page: "p-final" },
    { kind: "yesno", id: "complimentary_wash_done", label: "Complimentary wash done?", section: SECTIONS.final, page: "p-final" },
  ]),

  // ===== Suggested Refurb (1 page) =====
  page("p-refurb", SECTIONS.refurb, "Suggested refurb", [
    {
      kind: "multiselect",
      id: "refurb.selected",
      label: "Suggested refurb services",
      options: [
        "Car Performance Package",
        "Engine Flushing",
        "AC Antibacterial Treatment",
        "Fuel Injector",
        "VAS-PACK",
        "AC Filter Replace",
        "Air Filter Replace",
      ],
      section: SECTIONS.refurb,
      page: "p-refurb",
    },
    { kind: "text", id: "refurb.ac_filter_condition", label: "A/C filter condition", placeholder: "e.g. Moderately clogged", section: SECTIONS.refurb, page: "p-refurb" },
    { kind: "text", id: "refurb.air_filter_condition", label: "Air filter condition", placeholder: "e.g. Dusty", section: SECTIONS.refurb, page: "p-refurb" },
    { kind: "longtext", id: "refurb.other", label: "Other recommendations", section: SECTIONS.refurb, page: "p-refurb" },
  ]),

  { kind: "review", id: "review" },
];

// Flat list of all field steps (used by review/payload/PDF)
export const allFieldSteps: FieldStep[] = steps.flatMap((s) =>
  s.kind === "page" ? s.fields : [],
);
