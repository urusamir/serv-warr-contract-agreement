# Kavak Service Report Platform

A two-page web app that lets a Kavak service advisor capture all data from a vehicle service report and POST it to the n8n webhook.

## Brand

- **Palette:** Kavak Blue `#0027FF` (primary), Black `#000000`, White `#FFFFFF` only.
- **Logos provided:** white-on-blue, black-on-white, white-on-black. Used contextually:
  - Landing hero (blue background) → white logo
  - Form flow (white background) → black logo
  - Success screen (black background) → white logo
- Typography: bold geometric sans (Inter) with tight tracking to echo the wordmark.

## Page 1 — Landing

- Full-bleed Kavak Blue background, white KAVAK logo top-left
- Centered headline: "Service Completion Report"
- Sub: "Capture every check, every measurement, every note."
- Large white pill CTA: **Begin Report** → `/report`
- Subtle motion (fade/scale in) on load

## Page 2 — Typeform-style Report Flow (`/report`)

White canvas, black logo top-left, blue accents (active field underline, progress bar, OK button). One question on screen at a time. Smooth slide+fade transitions via framer-motion. Bottom thin progress bar in Kavak Blue. Keyboard: `Enter` to advance, `Shift+Enter` newline, `↑/↓` to navigate. Floating blue "OK" button per step. Persist answers in local state; back/forward supported.

### Sections & fields

**1. Vehicle & Customer**
- Vehicle Make/Model (default "Honda Accord")
- Registration Number, VIN
- Customer Name, Customer Contact
- Service Advisor Name, Service Advisor Number
- Service Date, Service Time
- Service Plan (select: Comprehensive Contract / Basic / Other)
- Service Type / Mileage (e.g. "20,000 KM")

**2. Exterior** — each item: Action(s) (multi-select Inspect/Lubricate/Replace/Clean) + Notes
- Front and Rear Windshield & All Lights
- All Door Hinges and Locks
- Hood Stay, Hood Lock
- Trunk Stay, Trunk Lock
- Front and Rear Wiper Blades

**3. Interior**
- All Seats and Seat Belt Operation
- Power Window, Mirror, Sunroof
- Interior Lights, Horn and Gauges
- Parking Brake Operation
- Windshield Washer and Wiper
- A/C Performance check
- A/C Condenser Exterior
- A/C Temperature — Centre AC vent grill (number, °C)
- Remove and clean A/C Filter (notes)

**4. Under Chassis**
- Engine Oil and Oil Filter
- Automatic/Manual Transmission Fluid
- Coolant condition
- Brake Pipe and Hoses
- Fuel Lines
- Steering Boots
- Propeller Shaft
- Drive Shaft Boots
- Ball Joint & Boots
- Front & Rear Shock Absorbers
- Front & Rear Suspension
- Wheel Bearing
- Exhaust Pipe and Mountings
- Engine and Transmission Mounts
- Tyre Condition & Tyre Pressure
- Tyre tread depth (mm) — 4 inputs: FRLH, FRRH, RRLH, RRRH
- Tyre pressure adjusted to spec (yes/no)
- Front brake pads FR / RR (mm)
- Brake discs FR / RR (mm)
- Wheel balancing performed (yes/no)

**5. Engine Room**
- Battery condition & terminals
- Air Filter (action + notes)
- Spark Plug
- Brake Fluid
- Power Steering Fluid
- Windshield Washer Fluid
- Drive Belt

**6. Final Check & Test Drive**
- Service Reminder Reset (yes/no)
- All Fluid Levels
- All Covers, Connectors, Under Shield
- Test Drive observations (notes)
- Complimentary Wash done (yes/no)

**7. Suggested Refurb Services** (multi-select + notes)
- Car Performance Package, Engine Flushing, AC Antibacterial Treatment, Fuel Injector, VAS-PACK
- AC Filter Replace + condition note
- Air Filter Replace + condition note
- Other recommendations (free text)

**8. Review & Submit**
- Compact summary of all answers, edit-on-click
- Submit → POST to webhook → success screen (black bg, white logo, "Start new report")

## Webhook payload

`POST https://samirdoesai.app.n8n.cloud/webhook/service-report` — JSON, every value clearly labeled with stable `snake_case` keys grouped by section:

```json
{
  "submitted_at": "2026-04-29T...Z",
  "vehicle": {
    "make_model": "...", "registration_number": "...", "vin": "...",
    "service_date": "...", "service_time": "...",
    "service_plan": "...", "service_type_mileage": "..."
  },
  "customer": { "name": "...", "contact": "..." },
  "service_advisor": { "name": "...", "number": "..." },
  "exterior": {
    "windshield_and_lights": { "actions": ["Inspect"], "notes": "" },
    "door_hinges_and_locks": { "actions": ["Lubricate"], "notes": "" }
  },
  "interior": { "ac_vent_temperature_c": 7.2 },
  "under_chassis": {
    "tyre_tread_depth_mm": { "fr_lh": 5, "fr_rh": 5, "rr_lh": 5, "rr_rh": 5 },
    "front_brake_pads_mm": { "fr": null, "rr": null },
    "brake_discs_mm": { "fr": null, "rr": null }
  },
  "engine_room": {},
  "final_check": {},
  "test_drive": { "performed": true, "notes": "WHEEL ALIGNMENT REQUIRED" },
  "complimentary_wash_done": true,
  "suggested_refurb": {
    "selected": ["Car Performance Package", "AC Filter Replace"],
    "ac_filter_condition": "Moderately clogged",
    "air_filter_condition": "Dusty",
    "other": ""
  }
}
```

Submit uses `fetch` POST with `Content-Type: application/json`; `no-cors` fallback so the user always gets a clean success/error toast.

## Technical notes

- Routes: `/` (Landing), `/report` (flow), `/report/done` (success)
- `framer-motion` for transitions; `react-hook-form` + `zod` for validation
- Steps defined in one typed config array so adding/removing fields is trivial
- All three logos copied to `src/assets/` and imported per page
