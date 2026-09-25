# Walkthrough: Tube Checklist Helper Accuracy & Rule Trainer

We have resolved the issue where **Sterile Urine Container** was incorrectly demanded for tests that only require blood vials (such as `Sexual Health Profile: Plus`, `TPHA`, and `VDRL with Titres`), and implemented a live interactive **Rule Trainer** directly from the frontend to train and update the Google Sheet `Required Tube Checklist Helper`.

---

## 1. Problem & Root Cause

1. **Incorrect Specimen Requirement:**
   - For patient `RAVI KUMAR (#19013745)` with tests:
     - `1. TPHA`
     - `2. Sexual Health Profile: Plus`
     - `3. VDRL with Titres`
   - The UI previously displayed: `VIALS: 2 Blood Vials (SST, EDTA) + 1 Urine Cup` and `TUBE HELPER: Sterile Urine Container`.
   - **Root Cause:** In `app.js` (`qr(e)`), hardcoded regex checks existed (`/plus|advanced/ -> needUrine = true` and `sti -> needUrine = true`) that falsely forced a urine container regardless of the actual rules in the `Required Tube Checklist Helper` Google Sheet (Row 7 clearly defines `Sexual Health Profile: Plus` as `SST: YES, EDTA: YES, Fluoride: NO, Urine: NO, Consent: NO`).
   - Additionally, the sheet mapping was fetched with a 3-second delay with no local cache fallback, resulting in empty sheet rules during fast patient selection.

---

## 2. Changes Made

### A. Frontend (`app.js`)
- **Pre-Hydrated Database (`DEFAULT_TUBE_RULES`):**
  - Embedded all 42 rules directly from your `Required Tube Checklist Helper` sheet tab (`Sexual Health Profile: Plus`, `Basic`, `Advanced`, `TPHA`, `VDRL with Titres`, `Urine Routine`, `Gonorrhoeae PCR`, `STI Ulcers`, etc.).
  - Rules are cached in `localStorage ('tube_checklist_rules')` and synchronized seamlessly with the backend.
- **Removed Hardcoded Regex Guesses in `qr(e)`:**
  - Removed faulty `/plus|advanced/` and generic `sti` urine assumptions.
  - Test tokens are now matched against the sheet rules (`findMatchingTubeRule(token)`).
  - Urine container is only demanded if the test actually requires urine (e.g. `STI Asymptomatic package (<=21 days)`, `Urine routine & Microscopy`, `Gonorrhoeae PCR`).
  - For Ravi Kumar's test combination, the output is now strictly:
    - **SST (Yellow Top)**: 1
    - **EDTA (Purple Top)**: 1
    - **Urine Container**: **0 (None)**
    - **Vials Summary**: `2 Blood Vials (SST, EDTA)`
- **Rule Training & Editing System (`window.openTubeChecklistModal`):**
  - Added interactive modal logic to train new rules or modify existing ones.
  - Updates in-memory dictionary & `localStorage` with **0ms latency** and immediately refreshes the active patient view.
  - Sends a remote RPC `saveRequiredTubeRule` to persist the rule directly to the Google Sheet.

### B. UI / QC Modal (`index.html`)
- Added an **"Edit Rules"** button next to the "Tube Helper" header in the QC Check panel.
- Built the **Rule Trainer Modal (`#modal-tube-checklist`)**:
  - **Quick Select Chips**: Displays all individual tests for the active patient booking for 1-click selection.
  - **Datalist Autocomplete**: Type-ahead search across all 40+ known tests.
  - **Specimen Checkboxes**: SST (Yellow), EDTA (Purple), Fluoride (Grey), Urine Container, and HIV Consent Form.
  - **Handling Notes**: Custom notes or centrifugation instructions.
  - **Database Viewer**: Expandable list of all currently trained rules with search & quick edit buttons.
- Bumped client asset version to `app.js?v=47`.

### C. Backend Google Apps Script (`Code.gs`)
- Implemented `saveRequiredTubeRule(testName, sst, edta, fluoride, urine, consent, notes)`:
  - Searches for existing test names (case-insensitive) in `Required Tube Checklist Helper`.
  - Updates the existing row or appends a new row with `"YES"` / `"NO"` values.
  - Whitelisted `'saveRequiredTubeRule'` in `allowedActions`.

---

## 3. Verification & Test Results

### Automated Logic Verification
Executed against the updated logic in `app.js`:
- `1. TPHA / 2. Sexual Health Profile: Plus / 3. VDRL with Titres`:
  - `needSst`: `true`
  - `needEdta`: `true`
  - `needFluoride`: `false`
  - `needUrine`: `false` *(Urine container completely eliminated)*
  - `needConsent`: `false`
- `STI Asymptomatic package (<=21 days)`:
  - `needSst`: `true`, `needUrine`: `true`, `needConsent`: `true`
- `Complete Blood Count (CBC)`:
  - `needEdta`: `true`, `needUrine`: `false`

### Build & Syntax Verification
- `node --check app.js`: **0 syntax errors**.
- Synchronized to both repositories (`Dropoff` and `redcliffe-dropoff-portal`).
- Vercel production deployment: **`READY`** at `https://redcliffedropoff.vercel.app`.
