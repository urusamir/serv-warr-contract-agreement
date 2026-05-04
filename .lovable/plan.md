
## Goal

Make the platform mirror the attached PDF exactly: ask for **Service Type** first, then show only the items in the PDF, with action options that change based on the chosen tier (Minor / Intermediate / Major).

---

## 1. Landing page tweak

- Remove the line "Capture every check, every measurement, every note." from `src/pages/Landing.tsx`. Keep the Begin Report button and Kavak branding.

## 2. New "Service Type" step (right after Begin Report)

A dedicated page (no intro screen) with three large selectable cards:

- **Minor Service**
- **Intermediate Service**
- **Major Service**

Stored as `service.type`. Required before proceeding. This selection drives every checklist's available actions later in the form.

## 3. Vehicle & Customer section — keep structure, fix data

Keep the existing 3 pages and field labels. Changes:

- Remove the pre-filled default value for "Vehicle make & model" (it currently shows "Honda Accord" — make it empty like every other field).
- Replace all real-looking placeholders with clearly fake samples:
  - Make & model placeholder: `e.g. Toyota Corolla`
  - Registration: `e.g. AB/12345`
  - VIN: `e.g. 1XXXX0000XX000000`
  - Mileage: `e.g. 30,000 KM`
  - Customer name: `e.g. John Doe`
  - Customer contact: `e.g. 555-0100`
  - Service advisor name: `e.g. Jane Smith`

## 4. Rebuild remaining sections to match the PDF EXACTLY

Use the PDF's section order and item list. Anything not in the PDF (A/C performance, A/C condenser exterior, A/C vent temperature, tyre pressure adjusted yes/no, wheel balancing yes/no, brake disc thickness, service reminder reset, complimentary wash, test drive notes, suggested refurb section) gets **removed**.

Order and items (each row will be a checklist field; actions populated dynamically from the chosen service tier):

### Interior (6 items)
1. All Seats & Seat Belts — Minor: I, Inter: I, Major: I
2. Power Window, Mirrors & Sliding Roof — I/L, I/L, I/L
3. Interior Lights, Horn & Gauges — I, I, I
4. Parking Brake Operation — I/A, I/A, I/A
5. Windshield Washer & Wipers — I, I, I
6. AC Operation — I, I, I

### Exterior (6 items)
1. AC Filter / Cabin Air Filter — C, R, R
2. All Door Hinges & Locks — L, L, L
3. Engine Hood, Hood Stay & Hood Lock — I/L, I/L, I/L
4. Trunk Lid, Trunk Stay & Trunk Lock — I/L, I/L, I/L
5. Front & Rear Wiper Blades — I, I, I
6. Front & Rear Windshield & Lights — I, I, I

### Under Chassis (18 items)
Engine Oil and Oil Filter (R/R/R), MTM/ATM Oil (I/I/I), ATM Oil (WS) (I/I/I), CVT Oil (I/I/I), Transfer Box Oil (I/I/I), Differential Oil (I/I/I), Coolant (I/I/I), Brake Pipes & Hoses (I/I/I), Fuel Lines & Connections (I/I/I), Steering Wear and Leaks (I/I/I), Propeller Shaft (I&L/I&L/I&L), Drive Shaft Boots (I/I/I), Ball Joints and Dust Cover (I/I/I), Front and Rear Shock Absorber (I/I/I), Front and Rear Suspension Bush (I/I/I), Wheel Bearings (I/I/I), Exhaust Pipes and Mounting (I/I/I), Engine and Gear Box Mounting (I/I/I).

### Wheel Area (4 items + measurement fields)
1. Tyre Condition and Tyre Pressure — I/A, I/A, I/A
   - Plus four tyre-thickness number inputs: Front Left, Front Right, Rear Left, Rear Right (mm)
2. Front Brake Pads and Discs — I, I, I/C
   - Plus brake-pad-thickness number inputs (Front Left, Front Right, Rear Left, Rear Right) attached to this row per the PDF.
3. Rear Brake Pads and Discs — I, I, I/C
4. Parking Brake — I, I, I/A

### Engine Room (11 items)
Air Filter (C/C/R), Fuel Filter (I/I/I), Spark Plugs Normal (I/I/I), Spark Plugs Platinum/Iridium (I/I/I), Battery Electrolyte and Connections (C/L for all three), Battery Report (I/I/I), Brake Fluid (I/I/R), Windshield Fluid (I/I/I), Power Steering Fluid (I/I/I), Drive Belts (I/I/I), Timing Belt (— / — / R).

For Timing Belt: in Minor and Intermediate the row appears as **Not Applicable** (disabled with a clear "Not part of this service" label) and in Major the action is Replace.

### Final Check (3 items)
1. All Wheel Nuts Torque — I/T, I/T, I/T
2. All Fluids Level — I, I, I
3. Connection Caps and Covers — I, I, I

## 5. Action code → full name mapping

When rendering checklist options, expand the codes from the PDF into full words:

- I → Inspection
- L → Lubricate
- A → Adjust
- C → Clean
- R → Replace
- T → Torque
- `/` and `&` between codes mean both actions apply. Render each action as a separate selectable checkbox so the technician can confirm each.

## 6. Tier-driven dynamic options

- Each checklist field defines `actionsByTier: { minor: string[]; intermediate: string[]; major: string[] }`.
- At render time, the form reads `answers["service.type"]` and shows only that tier's actions for each row.
- Each checklist row keeps its existing **optional notes/remarks textbox** (unchanged behaviour).
- If a row has no action for the selected tier (only Timing Belt in Minor/Intermediate), show it as Not Applicable, non-interactive, and skip it from required checks.

## 7. Keep existing UX

- Typeform-style transitions, progress bar, multi-fields-per-page grouping, Back button, keyboard navigation — all retained.
- Review screen and Submit flow stay the same: POST to the n8n webhook with labelled keys, then generate the PDF.

## 8. PDF generator update

`src/lib/generateReportPdf.ts` will be updated to:
- Output sections in PDF order: Interior → Exterior → Under Chassis → Wheel Area → Engine Room → Final Check.
- Show the chosen Service Type at the top.
- For each row, list the full action names the technician confirmed plus their notes.
- Drop the removed fields (refurb, test drive, etc.).

---

## Technical notes

- `reportSchema.ts`: extend `FieldStep` checklist variant with `actionsByTier` instead of a single `actions` array; add a new `serviceType` step kind. Add `notApplicableTiers?: ("minor"|"intermediate"|"major")[]` for Timing Belt.
- `Report.tsx`: read `answers["service.type"]`; gate navigation past the Service Type page until a tier is chosen; pass the tier into the checklist renderer.
- `buildPayload.ts`: no change needed — flat keys still flow through; `service.type` will appear at top level in the webhook payload.
- Routing: keep `/report` as the single flow; the Service Type step is just the first page.

## Open question

The PDF lists "Spark Plugs (Normal)" and "Spark Plugs (Platinum/Iridium)" as separate rows. I'll include both as separate items (technician marks whichever applies and can leave the other blank). If you'd rather have a single "Spark Plug type" selector that swaps to one row, let me know — otherwise I'll proceed with two rows as in the PDF.
