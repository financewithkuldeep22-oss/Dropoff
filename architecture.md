# System Architecture: Drop-Off Operations Control Center

---

## 1. Architectural Overview

The Drop-Off Operations Control Center is structured as a **Decoupled Serverless Web Architecture** consisting of four distinct layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT / PRESENTATION LAYER                                             │
│    Hosted on Vercel CDN / Edge Network                                      │
│    • Static Single Page Application (HTML5, Tailwind CSS, Material Icons)   │
│    • Left Vertical Gmail-Style Rail (68px collapsed, 240px hover expanded)  │
│    • Execution & Event Routing (app.js, kits_tracker.js, challan.js, auth)  │
│    • Custom Google Apps Script Proxy Bridge (api_v2.js / api.js)            │
│    • Offline Resilience (localStorage + bundled kits_data.json snapshot)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS POST (JSON: { action, args })
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. SERVERLESS APPLICATION & API LAYER                                       │
│    Google Apps Script (V8 Runtime) Web App Deployment                        │
│    • Entry Gateways: doPost(e), doGet(e), doOptions(e)                      │
│    • Action Router & Security Whitelist (allowedActions: 32 actions)        │
│    • Execution Time Budget Guard (MAX_EXECUTION_TIME_MS = 16,000ms)          │
│    • Multi-tiered CacheService (Chunked master cache + granular client)     │
│    • Drive Image Transcoding Service (getGoogleDriveImageBase64)            │
│    • Inventory Consignment Extractor (getKitsTrackerData)                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Google Workspace Services (Native)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. PERSISTENCE & DATA INTEGRATION LAYER                                     │
│    Google Cloud Storage (Spreadsheets & Drive)                              │
│    • Host Master Spreadsheet: Configs, Users, Audit Logs, Tube Rules        │
│    • 25+ Dynamic Client Target Spreadsheets (Allohealth, Medibuddy, etc.)   │
│    • Dedicated Inventory Sheet: HCL & ALLO Clinic (Kits & Consumables)      │
│    • Google Drive File Store: Phlebotomist verification photos (Base64)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown & Responsibilities

### 1. Presentation & Controller Layer
- **`index.html`:** Root DOM tree containing all modal dialogs (Login, Sample QC Review, Lightbox Viewer, Phlebo Editor, Email Composer), responsive navigation headers, and tab view containers.
- **`style.css`:** Liquid glass design system, backdrop blur definitions, custom scrollbars, animated pulse badges, and vertical rail styles.
- **`app.js`:** Core frontend state machine. Manages tab switching, Chart.js trend visualization, table pagination, search debounce, QC queue state, photo zooming, and modal event delegation.
- **`kits_tracker.js`:** Modular client-side controller for Kits & Consumables tracking. Provides dual-view rendering (Data Grid Table vs. Consignment Cards), multi-dimensional filtering (status chips, clinic select, city select, date presets/ranges, text search), courier docket regex parsing with 1-click clipboard copy, turnaround lead-time calculation, and CSV export.
- **`kits_data.json`:** Bundled offline fallback dataset (372 records, 26,571 items) ensuring instant 0ms cold-start hydration even under network outages.
- **`api_v2.js`:** Resilient API client with configurable per-action timeouts (28s for kits & QC, 38s for full dashboard logs), per-action abort controller, automatic retry on network glitch, and localStorage failover caching.
- **`auth.js`:** Session persistence manager. Validates credentials with backend, saves session to `localStorage`, and handles login/logout modals.
- **`challan.js`:** Phlebotomist Challan Maker engine. Handles auto-numbering, sample tube calculations, and printable PDF exports.
- **`allo.html` & `ops.html`:** Sandboxed embedded operational suites loaded inside iframe containers with postMessage session sync.

### 2. Backend & Business Logic Layer (`Code.gs`)
- **`doPost(e)`:** Centralized API dispatcher with strict action whitelisting (`allowedActions`).
- **`authenticateUser(username, password)`:** Validates credentials against the `Users` tab.
- **`getDashboardLogsData(forceRefresh)`:** Aggregates pendency metrics across all configured clients in `Client_Config`.
- **`getAllohealthQCData()`:** Scans Allohealth tracking records, filters pending QC rows, and extracts photo URLs.
- **`updateAllohealthQC(rowNum, status, remarks, username)`:** Writes QC decisions back to Allohealth sheet and registers an entry in `Dashboard_Logs`.
- **`getGoogleDriveImageBase64(driveId)`:** Streams image bytes from Google Drive and returns Base64 data to circumvent third-party cookie restrictions.
- **`getRequiredTubesMapping()`:** Supplies tube requirement rules for automated validation.
- **`getKitsTrackerData(forceRefresh)`:** Opens spreadsheet `1eim2C_w97UxX8yLBrWPCIZVh02x0F7gFu8ApVjjAVxU` (`HCL & ALLO Clinic`), reads tab `Raw`, parses 14 columns, extracts courier and docket metadata, caches for 600s with `putLargeCache`, and returns structured consignment records.

---

## 3. Security & Access Control Model

1. **Authentication:**
   - Role-based accounts configured in the `Users` spreadsheet tab (`Admin`, `User`, `QC Executive`).
   - Passwords verified server-side in Google Apps Script.
2. **API Action Guard:**
   - `Code.gs` enforces strict `allowedActions` allowlist dictionary mapping permitted external actions and rejecting all undefined calls before dispatch with HTTP 403 / JSON error.
3. **Audit Trail:**
   - Every mutation is logged with timestamp, user identity, target client, row number, and old/new state in `Dashboard_Logs`.

### 4. BOT LAB ORCHESTRATOR & AUTOMATION ENGINE
- **Dual Execution Engine:**
  - **Mode A (Parallel "All at Once"):** Automatically opens multiple pending bookings concurrently across Arc-style tabs in a responsive 2x2 grid (`window.botlabLaunchAllParallel(filter)`).
  - **Mode B (Sequential "1-by-1 Queue"):** Step-by-step queue processor (`window.botlabLaunchPendingQueue(filter)`) with top Queue HUD (`#botlab-queue-hud`) allowing manual skip, pause, and external window popout.
- **Pending Bookings Dispatch Matrix:**
  - Full-screen modal drawer (`#modal-dispatch-matrix`) with live client filter pills, instant search input, select-all checkboxes, individual tab/window launchers, and batch actions.
- **Iframe Integration & External Window Bypass:**
  - Bypasses CORS/CSP using the local Chrome companion extension. For strict `X-Frame-Options: SAMEORIGIN` partners (e.g. Redcliffe Partner Portal), 1-click external window bypass buttons are provided in the tab header HUD, Omnibox, and Dispatch Matrix.
- **AI Assistant & Dashboard Knowledge Base:**
  - Self-contained knowledge engine (`dashboard_knowledge.json`) loaded into memory to instantly answer questions regarding tab features, iframe troubleshooting, Morepen/Allo/BHMC booking URLs, and QC reasons.
