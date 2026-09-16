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
│    • Execution & Event Routing (app.js, challan.js, auth.js, offline-game)  │
│    • Custom Google Apps Script Proxy Bridge (api_v2.js / api.js)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS POST (JSON: { action, args })
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. SERVERLESS APPLICATION & API LAYER                                       │
│    Google Apps Script (V8 Runtime) Web App Deployment                        │
│    • Entry Gateways: doPost(e), doGet(e), doOptions(e)                      │
│    • Action Router & Security Whitelist (allowedActions)                    │
│    • Execution Time Budget Guard (MAX_EXECUTION_TIME_MS = 16,000ms)          │
│    • Multi-tiered CacheService (Chunked master cache + granular client)     │
│    • Drive Image Transcoding Service (getGoogleDriveImageBase64)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Google Workspace Services (Native)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. PERSISTENCE & DATA INTEGRATION LAYER                                     │
│    Google Cloud Storage (Spreadsheets & Drive)                              │
│    • Host Master Spreadsheet: Configs, Users, Audit Logs, Tube Rules        │
│    • 25+ Dynamic Client Target Spreadsheets (Allohealth, Medibuddy, etc.)   │
│    • Google Drive File Store: Phlebotomist verification photos (Base64)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown & Responsibilities

### 1. Presentation & Controller Layer
- **`index.html`:** Root DOM tree containing all modal dialogs (Login, Sample QC Review, Lightbox Viewer, Phlebo Editor, Email Composer), responsive navigation headers, and tab view containers.
- **`style.css`:** Liquid glass design system, backdrop blur definitions, custom scrollbars, animated pulse badges, and vertical rail styles.
- **`app.js`:** Core frontend state machine. Manages tab switching, Chart.js trend visualization, table pagination, search debounce, QC queue state, photo zooming, and modal event delegation.
- **`api_v2.js`:** Resilient API client with 25s timeout, per-action abort controller, automatic retry on network glitch, and localStorage failover caching.
- **`auth.js`:** Session persistence manager. Validates credentials with backend, saves session to `localStorage`, and handles login/logout modals.
- **`challan.js`:** Phlebotomist Challan Maker engine. Handles auto-numbering, sample tube calculations, and printable PDF exports.
- **`allo.html` & `ops.html`:** Sandboxed embedded operational suites loaded inside iframe containers with postMessage session sync.

### 2. Backend & Business Logic Layer (`Code.gs`)
- **`doPost(e)`:** Centralized API dispatcher with action whitelisting (`allowedActions`).
- **`authenticateUser(username, password)`:** Validates credentials against the `Users` tab.
- **`getDashboardLogsData(forceRefresh)`:** Aggregates pendency metrics across all configured clients in `Client_Config`.
- **`getAllohealthQCData()`:** Scans Allohealth tracking records, filters pending QC rows, and extracts photo URLs.
- **`updateAllohealthQC(rowNum, status, remarks, username)`:** Writes QC decisions back to Allohealth sheet and registers an entry in `Dashboard_Logs`.
- **`getGoogleDriveImageBase64(driveId)`:** Streams image bytes from Google Drive and returns Base64 data to circumvent third-party cookie restrictions.
- **`getRequiredTubesMapping()`:** Supplies tube requirement rules for automated validation.

---

## 3. Security & Access Control Model

1. **Authentication:**
   - Role-based accounts configured in the `Users` spreadsheet tab (`Admin`, `User`, `QC Executive`).
   - Passwords verified server-side in Google Apps Script.
2. **API Action Guard:**
   - Explicit `allowedActions` array prevents arbitrary function execution through `doPost`.
3. **Audit Trail:**
   - Every mutation is logged with timestamp, user identity, target client, row number, and old/new state in `Dashboard_Logs`.

### NEW COMPONENT: BOT LAB ORCHESTRATOR
- **Iframe Integration**: Bypasses CORS/CSP using local Chrome Extension to embed external partner portal.
- **Parallel Processing**: Employs a multi-iframe tab pool to run form-filling concurrently.
- **Cross-Window Messaging**: Uses window.postMessage between pp.js and the Chrome Extension's content script to track navigation and completion states.

