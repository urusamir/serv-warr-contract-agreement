## Goal

Replace the PDF cover artwork with the newly uploaded image, keep all prior cover-page fixes intact, and remove the Kavak logo from the platform UI (Landing + ReportDone) while keeping it inside the PDF.

## Changes

### 1. Replace cover artwork (`src/assets/kavak-cover-car.png`)
- Copy the newly uploaded image `user-uploads://ChatGPT_Image_May_4_2026_04_36_37_PM.png` over `src/assets/kavak-cover-car.png`.
- The PDF generator already imports this path, so no import changes are needed.

### 2. Re-tune the cover overlays in `src/lib/generateReportPdf.ts`

The new artwork has:
- "Car Service Report" title roughly centered vertically in the upper third
- A baked-in "Minor Service" subtitle directly below it (must be hidden so only the dynamically selected tier shows)
- A baked-in footer "Generated: 5/4/2026, 12:19:35 PM" + "Kavak Service Report • Page 1 of 4" near the bottom (must be hidden so only dynamic values show)

Adjustments inside `drawCoverPage`:
- Move the black overlay strip that hides the baked-in "Minor Service" subtitle to match its new vertical position in this artwork (approx. `stripY = pageHeight * 0.41`, `stripH = pageHeight * 0.06`), then redraw the dynamic `tierLabel` centered on that strip.
- Keep the bottom black band that masks the baked-in footer text, and redraw only the dynamic `Generated: <timestamp>` line.
- Keep the page-number footer loop starting at `i = 2` (cover already shows "Page 1 of 4" via the redraw — see next bullet).
- Add a dynamic "Page 1 of N" line on the cover under the timestamp so the cover correctly reads "Page 1 of 4".

### 3. Remove the logo from the platform (keep in PDF)

- `src/pages/Landing.tsx`: remove the `<header>` block that renders `<img src={logoWhite} ... />` and the `logoWhite` import.
- `src/pages/ReportDone.tsx`: same — remove the header `<img>` and its import.
- Do NOT touch `src/lib/generateReportPdf.ts`'s logo import; the PDF logo asset stays untouched.

## Files touched

- `src/assets/kavak-cover-car.png` (replaced with new upload)
- `src/lib/generateReportPdf.ts` (overlay strip position + dynamic "Page 1 of N" on cover)
- `src/pages/Landing.tsx` (remove logo header)
- `src/pages/ReportDone.tsx` (remove logo header)

## Out of scope

- No schema/form changes.
- No changes to body pages of the PDF.
