# Project Memory: Multi-Client Drop-Off Operations Control Center & QC Portal

---

## 1. Project Overview

The **Multi-Client Drop-Off Operations Control Center & QC Portal** is an enterprise-grade diagnostic laboratory logistics, specimen quality control, and operations tracking system built for **Redcliffe Labs** and its national network of 25+ healthcare B2B partners and clinical clients (including **Medibuddy**, **Allohealth**, **BHMC (Bharath Home Medicare)**, **Tatvacare**, **Flebo.in**, **Dr. Morepen Labs**, **TGHS**, **Juvius Healthcare**, and regional collection hubs).

The system serves as the central operational cockpit connecting field phlebotomy collection teams, dispatch logistics, central diagnostic processing laboratories, sample quality assurance inspectors, and business operations coordinators.

---

## 2. Business Purpose & Problem Statement

### 2.1 The Operational Challenge
Diagnostic blood, urine, and swab specimens collected from patient residences across diverse geographic regions must be rapidly received, verified, quality-checked, and accessioned into the laboratory information management system (LIMS) within tight analytical stability windows. Prior to this platform, laboratory operations faced severe logistical friction:
1. **Multi-Client Fragmentation:** Specimen drop-offs were recorded across disparate, disconnected client Google Sheets and forms with inconsistent schemas, divergent header naming conventions, and isolated storage silos.
2. **Requisition & Barcode Discrepancies:** Field phlebotomists collect specimens under field booking references, but laboratory accessioning requires formal Booking IDs and barcode reconciliation. Lab coordinators spent excessive hours manually cross-checking records.
3. **Quality Control (QC) Failures at Intake:** Specimens collected in incorrect vacutainer tubes (e.g., Lavender/Purple K2/K3 EDTA, Gold/Yellow Gel SST, Grey Sodium Fluoride, Plain Red Top, or Urine cups), specimens lacking cold-chain temperature verification photos, or missing legally mandated signed HIV consent forms were discovered only at analytical stages, leading to sample rejections, patient recollections, and clinical delay.
4. **Context Switching & Operational Blind Spots:** Phlebotomy managers, quality control technicians, and dispatch coordinators navigated dozens of browser tabs, Google Sheets, external portals, and local PDF generators, causing delayed visibility into pending sample volumes and collection velocity.

### 2.2 Business Solutions Delivered
- **Unified Single-Pane Operations Dashboard:** Consolidates sample drop-off streams from all 25+ partner spreadsheets into a unified, filterable real-time operations console.
- **Visual Specimen QC Station:** Provides automated tube checklist validation, photo streaming directly from Google Drive, and one-click accept/reject workflows with instant audit trail logging.
- **Embedded Partner Workspaces:** Seamlessly embeds dedicated client portals (Allohealth, BHMC, Medibuddy) inside high-performance sandboxed views with unified navigation and session synchronization.
- **Integrated Phlebotomist Challan Maker:** Rapid electronic generation of sample dispatch challans and gate passes with barcode generation and printable PDF export.
- **Resilient Serverless Microservices:** Built on Google Apps Script and Vercel Edge hosting with multi-layered caching, execution timeout protection, and offline resilience.

### 2.3 Primary User Personas
- **QC Executives / Lab Operators:** Review incoming specimens, cross-reference vacutainer photos against prescribed test panels, inspect temperature and consent documentation, approve or reject collections with standard remarks, and sync decisions back to client master sheets.
- **Operations Coordinators:** Monitor real-time collection volume, track client-wise pendency across cities (Delhi NCR, Chandigarh, Kanpur, Lucknow, etc.), assign unmapped Booking IDs, and generate dispatch manifests.
- **Phlebotomy Leads & Area Managers:** Inspect collection velocity, monitor daily targets, and track phlebotomist field submissions.
- **System Administrators:** Register dynamic client Google Sheets, configure access credentials, review immutable audit logs, and trigger cache warmups.

---

## 3. Technology Stack & Environmental Specifications

| Layer | Technology | Version / Specification | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Vanilla JavaScript (ES6+), HTML5 SPA | Native DOM API, zero-build | High-performance client execution with zero compilation overhead or bundler churn |
| **Styling & Design System** | Tailwind CSS CDN | 3.x with container-queries & forms | Liquid Glass frosted glassmorphism (backdrop-blur-2xl), responsive layout grid |
| **Animation Engine** | GSAP (GreenSock) | 3.12.2 + ScrollTrigger | Hardware-accelerated navigation rail active pill tracking, counter rollups, and tab transitions |
| **Data Visualization** | Chart.js | 4.4.x | Day-wise collection velocity curves, status distributions, and client intake bar charts |
| **Typography & Icons** | Plus Jakarta Sans, JetBrains Mono, Google Material Symbols, FontAwesome 6 | CDN webfonts | Enterprise diagnostic design language with clean tabular typography |
| **API Client Proxy** | Custom Fetch Proxy (api_v2.js) | Fetch API, AbortController | Bridges browser to Google Apps Script Web App with 25s timeout and localStorage fallback |
| **Backend & Compute** | Google Apps Script (V8 Engine) | V8 Runtime (Code.gs) | Serverless microservice hosting REST/JSON-RPC gateways (doPost, doGet, doOptions) |
| **Persistence / Database** | Google Sheets (Master Hub + Dynamic Spokes) | Google Drive API, Sheets API | Relational table storage across central hub and 25+ spoke client spreadsheets |
| **File Storage & Media** | Google Drive | Native DriveApp / Drive API | Phlebotomist specimen photos, temperature logs, and signed consent documentation |
| **Hosting & CI/CD** | Vercel Edge Network | Vercel CLI / GitHub CI | Production deployment at https://dropoff-three.vercel.app (and https://dropoff-financewithkuldeep22-5969s-projects.vercel.app) automatically deployed on push to origin/main |
| **Offline Support** | Native HTML5 Canvas (offline-game.js) | Window online/offline events | Offline indicator banner and built-in interactive runner game during network drops |

---

## 4. Complete Repository Structure & File Breakdown

```
drop-off dashboard/ (clever-volta / Workspace Root)
├── .git/                                 # Git version control metadata
├── .gitignore                            # Rules for ignored local build and scratch artifacts
├── vercel.json                           # Vercel deployment configuration, rewrite rules, and security headers
├── index.html                            # Master SPA HTML shell, navigation rail, modal dialogs, and tab view containers
├── style.css                             # Liquid glass design system, navigation rail styling, dock layouts, scrollbars
├── app.js                                # Primary client state machine, tab router, table renderers, QC engine, KPI counters
├── api_v2.js                             # Hardened Google Apps Script fetch proxy with AbortController, timeout, and cache
├── api.js                                # Base legacy API proxy holding master GAS_URL endpoint configuration
├── auth.js                               # Session manager, credential verification, and login overlay handler
├── challan.js                            # Phlebotomist Challan Maker engine, tube summaries, and PDF print formatting
├── redcliffechallan_app.js               # Extended challan generation runtime with 182 clinic auto-completion presets
├── dashboard_knowledge.json              # Dashboard & Bot Lab comprehensive knowledge base for AI Assistant
├── allo.html                             # Embedded AlloHealth Sample Tracker portal HTML shell
├── allo-app.min.js                       # AlloHealth standalone runtime script
├── allo-style.min.css                    # AlloHealth custom stylesheet
├── allo-gsap.min.js                      # AlloHealth standalone GSAP animation engine
├── ops.html                              # Integrated Operations Tool suite (Rishabh Ops module)
├── offline-game.js                       # Standalone 2D HTML5 canvas runner game for offline connectivity states
├── animations.js                         # Custom GSAP UI micro-animations and counter transitions
├── Code.gs                               # Primary serverless backend microservice running on Google Apps Script V8
├── Code.js                               # Local reference/mirror of backend Apps Script functions
├── Rishabhcodegs.txt                     # Ops tool backend reference script
├── Rishabhhtml.txt                       # Ops tool frontend reference template
├── logo_doc.png                          # Redcliffe Labs official high-resolution logo asset
├── logo.svg / favicon.svg                # Vector brand assets
├── memory.md                             # Permanent codebase brain and system intelligence (This document)
├── architecture.md                       # Comprehensive system architecture specification
├── routes.md                             # Complete routing catalog and screen navigation map
├── api-map.md                            # Comprehensive API endpoints, RPC actions, and parameters catalog
├── database-map.md                       # Relational schema mapping across Master Hub and Spoke sheets
└── dependency-graph.md                   # Runtime dependency hierarchy and criticality matrix
```

---

## 5. System Architecture & Component Interactions

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT RUNTIME LAYER                                    │
│                                                                                        │
│   ┌──────────────────────────────────────────────────────────────────────────────┐     │
│   │ index.html (Main Layout Shell)                                               │     │
│   │ ├── Top Header (Logo, Live Clock, Sync Trigger, Light/Dark Mode, User Chip)  │     │
│   │ ├── Left Vertical Navigation Rail (Gmail-Style Hover Expand, 68px -> 240px)  │     │
│   │ └── View Containers (#tab-content-overview, #tab-content-qc, #tab-content-...)│     │
│   └──────────────────────────────────────────────────────────────────────────────┘     │
│            │                                   │                           │           │
│   ┌────────▼────────┐                 ┌────────▼────────┐         ┌────────▼───────┐   │
│   │     app.js      │                 │   challan.js    │         │    auth.js     │   │
│   │ (Router, State, │                 │ (Challan Maker, │         │ (Session, Auth,│   │
│   │  QC Logic, UI)  │                 │  Print, Export) │         │  Permissions)  │   │
│   └────────┬────────┘                 └────────┬────────┘         └────────┬───────┘   │
│            │                                   │                           │           │
│            └───────────────────┬───────────────┴───────────────────────────┘           │
│                                │                                                       │
│                     ┌──────────▼──────────┐                                            │
│                     │      api_v2.js      │ (JSON-RPC POST Bridge, AbortController,    │
│                     │  (Fetch API Proxy)  │  25s Time Budget, Offline LocalStorage)    │
│                     └──────────┬──────────┘                                            │
└────────────────────────────────┼───────────────────────────────────────────────────────┘
                                 │ HTTPS POST (JSON: { action, args })
                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SERVERLESS BACKEND LAYER (Google Apps Script)                   │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Code.gs                                                                        │   │
│   │ ├── doPost(e) / doGet(e) / doOptions(e)                                        │   │
│   │ ├── Action Whitelist Guard (allowedActions validation)                         │   │
│   │ ├── Execution Time Guard: MAX_EXECUTION_TIME_MS (24,000ms safety threshold)    │   │
│   │ └── Multi-Tiered CacheService (Chunked master cache + granular client cache)   │   │
│   └────────────────────────────────────────┬───────────────────────────────────────┘   │
└────────────────────────────────────────────┼───────────────────────────────────────────┘
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
┌──────────────────────────────────────┐            ┌────────────────────────────────────┐
│         DATA PERSISTENCE LAYER       │            │        GOOGLE DRIVE STORAGE        │
│                                      │            │                                    │
│ • Host Master Spreadsheet:           │            │ • Phlebotomist Collection Photos   │
│   - Users (Credentials, Roles)       │            │ • Refrigerator / Temperature Logs  │
│   - Client_Config (Target Sheets)    │            │ • Tube Count Verification Photos   │
│   - Dashboard_Logs (Audit Trail)     │            │ • Signed HIV Consent Forms         │
│   - Required Tube Checklist Helper   │            │                                    │
│ • External Spoke Spreadsheets:       │            │ Transcoded via getGoogleDrive-     │
│   - Allohealth, Medibuddy, BHMC, etc.│            │ ImageBase64 to bypass cookie blocks│
└──────────────────────────────────────┘            └────────────────────────────────────┘
```

---

## 6. Navigation & Routing Architecture

### 6.1 View Routing Engine
Routing is handled on the client by window.switchDashboardTab(tabId) inside app.js. View switching involves:
1. Deactivating all sibling navigation rail buttons and removing active styling.
2. Toggling corresponding DOM containers (#tab-content-[tabId]).
3. Repositioning the GSAP active sliding pill indicator via window.updateNavCursor().
4. Updating browser address bar history using window.history.pushState.
5. Triggering tab-specific initializers (e.g., lazy loading iframes or initializing Chart.js).

### 6.2 Canonical Routes Catalog
| Route ID | DOM Container | Nav Button | Order | Auth Required | Purpose / Loaded View |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `overview` | `#tab-content-overview` | `#tab-overview-btn` | 1 | Yes | Executive KPI summary, client pendency table, collection charts |
| `qc` | `#tab-content-qc` | `#tab-qc-btn` | 2 | Yes | Quality Control console for Allohealth drop-offs with photo streaming |
| `allo` | `#tab-content-allo` | `#tab-allo-btn` | 3 | Yes | Embedded AlloHealth Sample Logistics Tracker (allo.html) |
| `bhmc` | `#tab-content-bhmc` | `#tab-bhmc-btn` | 4 | Yes | Embedded Bharath Home Medicare Tracker (bhmc-redcliffelabs.vercel.app) |
| `medibuddy` | `#tab-content-medibuddy` | `#tab-medibuddy-btn` | 5 | Yes | Embedded Medibuddy Drop-off Portal with authorized domain bridge |
| `challan` | `#tab-content-challan` | `#tab-challan-btn` | 6 | Yes | Phlebotomist Challan Maker with auto-numbering and printable PDF format |
| `ops` | `#tab-content-ops` | `#tab-ops-btn` | 7 | Yes | Integrated Operations Tool suite (ops.html) |
| `bulk-dl` | `#tab-content-bulk-dl` | `#tab-bulk-dl-btn` | 8 | Yes | Bulk download manifest generator and mass report exporter |
| `config` | Triggered via Modal | `#sidebar-manage-sheets-btn` | 9 | Yes (Admin) | Client Google Sheet connection registry manager |
| `bookings` | Nested in `#tab-content-overview` | Deep link / Row click | - | Yes | Granular booking inspector with real-time client filter |

---

## 7. Frontend Architecture & State Management

### 7.1 Key Global State Variables (app.js)
- `Qs`: Master dashboard data cache holding:
  - `Qs.kpis`: Aggregate KPI metrics (processed volume, pendency, 7-day intake, today's collections).
  - `Qs.logs`: Array of normalized sample collection records across all active clients.
  - `Qs.clientStats`: Dictionary of per-client breakdown objects keyed by client display name.
- `_r`: Active QC booking queue pending inspection.
- `vr`: Currently selected booking object inspected in the QC review drawer.
- `kr`: Selected QC photo tab identifier (`"refrig"`, `"qty"`, `"consent"`).
- `Er`: Memory map caching Base64-transcoded photo strings (`cacheKey = ${booking.rowNum}_${type}`).
- `Sr`: Set of in-flight photo request keys preventing duplicate concurrent fetches.
- `base64PreloadQueue`: Controlled queue ensuring single-concurrency Base64 requests to prevent backend Google Apps Script throttling.
- `currentActiveBtn`: Active navigation rail button tracked for GSAP indicator animation.

### 7.2 Dynamic Navigation Rail Badges
The navigation rail features real-time dynamic pill badges that reflect active operational pendency:
- `#badge-overview`: Total pending booking creations across all clients.
- `#allo-badge-lbl` (QC Badge): Uninspected Allohealth sample records pending QC approval.
- `#badge-allo`: Pending Allohealth field sample drop-offs.
- `#badge-bhmc`: Pending Bharath Home Medicare collections.
- `#badge-medibuddy`: Pending Medibuddy bookings calculated by aggregating all city-level sub-keys (`Medibuddy Drop-Off - Delhi NCR`, `Medibuddy Drop-Off - Chandigarh`, `Medibuddy Drop-Off - Kanpur`, `Medibuddy Drop-Off - Lucknow`) or from normalized logs where `log.isPending === true`.
- Zero-Suppression Rule: Badges with a value of `0` or `"0"` receive `data-count="0"` and are hidden (`display: none`).

### 7.3 Gmail-Style Left Vertical Rail Mechanics
- **Collapsed Width:** `68px` fixed width on the left (`top: 64px; left: 0; bottom: 0`).
- **Hover Expansion:** Expands to `240px` on hover with CSS transition (`cubic-bezier(0.2, 0, 0, 1)`), revealing text labels and badge counts.
- **Canvas Offset:** The main content wrapper enforces `md:ml-[68px]` margin, preventing content obscuration.
- **Mobile Fallback:** On screens under `768px`, navigation shifts to a mobile bottom navigation dock.

---

## 8. Backend Architecture & Google Apps Script Microservice

### 8.1 Entry Points (Code.gs)
- **`doPost(e)`:** Primary JSON-RPC dispatcher receiving `{ action: string, args: array }`. Validates the action name against `allowedActions` array, executes the target function, and returns formatted JSON.
- **`doGet(e)`:** Serves HTML if accessed directly inside Google Workspace.
- **`doOptions(e)`:** Responds to CORS preflight requests with HTTP 200 and requisite headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, GET, OPTIONS`).

### 8.2 Execution Safety Budget
Google Apps Script reverse proxy forcefully cuts off any request exceeding 30 seconds, returning an HTTP 404 HTML document. Code.gs enforces a **24,000ms safety budget** (`MAX_EXECUTION_TIME_MS = 24000`):
- When scanning across 25+ dynamic client spreadsheets, execution elapsed time is measured on every client iteration.
- If elapsed time approaches the threshold, the scanning loop breaks safely.
- Partial results are merged with prior client cache entries in `CacheService` to deliver a complete, valid JSON payload within 26 seconds, preventing 404 reverse proxy aborts.

### 8.3 Multi-Tiered Caching Strategy
- **Master Aggregation Cache:** Master summary data is cached in `CacheService.getScriptCache()` in compressed chunks under 100KB.
- **Per-Client Granular Cache:** Individual client summary objects are cached under `client_cache_[clientName]`, allowing single-client updates in less than 1ms.
- **Stale Cache Invalidation:** Cache keys incorporate the current date stamp, ensuring yesterday's stale cached figures are discarded at midnight.

---

## 9. Database Architecture & Persistence Model

### 9.1 Hub-and-Spoke Topology
The system uses a distributed hub-and-spoke spreadsheet architecture:
- **Master Hub Spreadsheet ID:** `1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU`
  - Central registry for authentication, client routing, audit logs, and QC validation rules.
- **Spoke Spreadsheets:** Dynamic, independent Google Sheets maintained by individual B2B client operational teams, registered dynamically inside `Client_Config`.

### 9.2 Master Hub Tabs & Schemas
1. **`Users` Tab (Authentication & Access Control):**
   - Column A: `Username` (Unique identifier)
   - Column B: `Password` (Verification token)
   - Column C: `Role` (`Admin`, `User`, `QC Executive`)
   - Column D: `Status` (`Active`, `Disabled`)
2. **`Client_Config` Tab (Connection Registry):**
   - Column A: `Client Name` (Display name, e.g., `Medibuddy Drop-Off`)
   - Column B: `Google Sheet URL / ID` (Target spreadsheet URL or file ID)
   - Column C: `Tab Name (Optional)` (Target worksheet name; defaults to sheet 0 if blank)
   - Column D: `Status` (`Active`, `Inactive`)
3. **`Dashboard_Logs` Tab (Immutable Audit Trail):**
   - Column A: `Timestamp` (IST formatted date-time string)
   - Column B: `Action By (User)` (Username of operator)
   - Column C: `Client Name` (Target client modified)
   - Column D: `Sheet Tab` (Worksheet tab name)
   - Column E: `Row Number` (Source row index)
   - Column F: `Patient Name` (Patient name)
   - Column G: `Booking ID` (Assigned requisition or Booking ID)
   - Column H: `Comments` (Operator remarks or rejection reasons)
   - Column I: `Status` (`Approved`, `Rejected`, `Pending`, `Success`)
4. **`Required Tube Checklist Helper` Tab (Specimen QC Rules):**
   - Column A: `Test / Package Name`
   - Column B: `SST Tube (Yellow Top)` (`YES` / `NO`)
   - Column C: `EDTA Tube (Purple Top)` (`YES` / `NO`)
   - Column D: `Fluoride Tube (Grey)` (`YES` / `NO`)
   - Column E: `Urine Container` (`YES` / `NO`)
   - Column F: `HIV Consent Form` (`YES` / `NO`)

---

## 10. Authentication & Authorization Flow

```
User Enters Credentials 
       │
       ▼
AuthManager.handleLogin() (auth.js)
       │
       ▼
POST { action: 'authenticateUser', args: [username, password] } (api_v2.js)
       │
       ▼
Code.gs: authenticateUser() checks Master Hub Users tab
       │
 ┌─────┴─────────────────────────────────┐
 │ Credentials Valid                      │ Credentials Invalid / Disabled
 ▼                                       ▼
Returns { status: 'success',             Returns { status: 'error', 
          user: { username, role } }               message: 'Invalid credentials' }
 │                                       │
 ▼                                       ▼
Saved to localStorage (redcliffe_user)   Displays error banner in Login modal
Closes #login-overlay
Initializes dashboard data sync
```

- **Role-Based Access Control (RBAC):**
  - `Admin`: Full access to client configuration (`Client_Config` editor), audit logs, cache warmup triggers, and user administration.
  - `QC Executive`: Access to QC station, photo inspection, approval/rejection workflows, and overview tables.
  - `User`: Access to operational overviews, challan creation, and report exports.

---

## 11. API Inventory & RPC Action Catalog

| Action Name | HTTP Method | Whitelisted | Execution Timeout | Retries | Input Arguments | Output Format | Calling Function | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `authenticateUser` | POST | Yes | 20s | 1 | `[username, password]` | `{ status, user: { username, role } }` | `AuthManager.handleLogin` | Authenticates operator against `Users` tab |
| `getDashboardLogsData` | POST | Yes | 28s | 0 | `[forceRefresh]` | `{ status, kpis, logs, clientStats }` | `syncAllDashboardData` | Scans all configured clients and returns operational metrics |
| `getAllohealthQCData` | POST | Yes | 22s | 0 | `[]` | `{ status, data: [...] }` | `loadQCQueue` | Fetches Allohealth pending sample records |
| `getGoogleDriveImageBase64` | POST | Yes | 25s | 1 | `[driveId]` | `{ status, mimeType, base64Data }` | `loadQCPhotosForBooking` | Transcodes Drive image to base64 Data URL |
| `updateAllohealthQC` | POST | Yes | 20s | 1 | `[rowNum, status, remarks, username]` | `{ status, message }` | `submitQCStatusChange` | Updates QC decision in Allohealth sheet & logs audit |
| `updateBookingIdInSourceSheet`| POST | Yes | 20s | 1 | `[client, tab, row, bookingId, comment, user]` | `{ status, message }` | `saveInlineBookingId` | Writes generated Booking ID back to client sheet |
| `getPendingQCBookings` | POST | Yes | 15s | 1 | `[]` | `{ status, count, data }` | `updateQCBadgeCount` | Lightweight check for pending QC records |
| `getAllohealthQCDropdownOptions` | POST | Yes | 15s | 1 | `[]` | `{ status, options: [...] }` | `initQCDropdowns` | Fetches allowed rejection reasons and status values |
| `getRequiredTubesMapping` | POST | Yes | 15s | 1 | `[]` | `{ status, mapping: {...} }` | `loadTubeRules` | Supplies test-to-tube validation rules |
| `saveClientConfigRow` | POST | Yes | 20s | 1 | `[client, url, tab, status]` | `{ status, message }` | `saveClientConfig` | Registers or updates a client spreadsheet connection |
| `deleteClientConfigRow` | POST | Yes | 20s | 1 | `[client]` | `{ status, message }` | `deleteClientConfig` | Deletes a client connection from `Client_Config` |
| `warmDashboardDataCache` | POST | Yes | 28s | 0 | `[]` | `{ status, cachedClients }` | Admin Trigger | Pre-populates cache chunks across all client sheets |

---

## 12. Comprehensive Data Flow Traces

### 12.1 End-to-End Specimen QC Inspection Flow
```
1. Operator selects a patient row in QC Check tab (#tab-content-qc).
2. app.js sets active booking state vr = selectedBooking and resets photo preview state.
3. app.js dispatches sequential photo requests to base64PreloadQueue:
   - Request 1: getGoogleDriveImageBase64(booking.refrigeratorPhoto) -> Renders cold-chain temperature.
   - Request 2: getGoogleDriveImageBase64(booking.qtyPhoto) -> Renders tube count photo.
   - Request 3: getGoogleDriveImageBase64(booking.consentPhoto) -> Renders signed HIV consent form.
4. UI displays high-resolution photo with 25% zoom, pan, and rotation controls.
5. Automated checklist cross-references testName against getRequiredTubesMapping():
   - Indicates required tubes (Yellow SST, Purple EDTA, Grey Fluoride, Urine cup, HIV consent).
6. Operator reviews specimens, selects status ('Approved' / 'Rejected'), and picks rejection remark if rejected.
7. Operator clicks 'Submit QC Verdict':
   - POST updateAllohealthQC(rowNum, status, remarks, username).
   - Code.gs writes verdict to column P/Q of Allohealth sheet.
   - Code.gs appends row to Master Hub Dashboard_Logs tab.
   - Success toast displayed; booking removed from active QC queue; nav badge count decremented.
```

### 12.2 Dashboard Analytics & Multi-Client Aggregation Flow
```
1. User clicks Sync button or automated 60s polling fires.
2. app.js invokes api_v2.js: getDashboardLogsData(forceRefresh).
3. Code.gs checks CacheService for valid day-partitioned cache:
   - If present, returns aggregated payload in <500ms.
   - If expired or forceRefresh=true:
     a. Iterates over active rows in Master Hub Client_Config tab.
     b. Opens each spoke spreadsheet by ID via SpreadsheetApp.openById().
     c. Parses intake timestamps, booking IDs, patient names, and pendency flags.
     d. Evaluates elapsed time against MAX_EXECUTION_TIME_MS (24s).
     e. Assembles Qs.kpis, Qs.logs, and Qs.clientStats.
     f. Saves chunks to CacheService.
4. Response returns to app.js.
5. app.js invokes:
   - cr(): Renders client pendency breakdown table.
   - hr(): Re-renders Chart.js collection velocity and QC donut charts.
   - window.updateNavBadges(): Re-calculates and renders badge counts for Overview, QC, Allohealth, BHMC, and Medibuddy.
   - window.renderInspectorView(): Updates detailed booking inspector table.
```

---

## 13. Environment Variables & Secret Management

- **API Endpoint (`GAS_URL`):**
  - Production Google Apps Script Web App Deployment URL configured in `api.js` and `api_v2.js`.
  - Format: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
- **Spreadsheet Identifiers:**
  - Master Hub ID: Stored in `Code.gs` configuration block.
  - Spoke Sheet IDs: Dynamically persisted in the `Client_Config` sheet tab, completely decoupled from hardcoded source code.
- **Client Security Standards:**
  - Zero sensitive database credentials or service account JSON keys stored in frontend client code.
  - All database mutations mediated through server-side Apps Script session authorization.

---

## 14. Third-Party Integrations & External Services

1. **Google Drive API:** Storage provider for phlebotomy verification photos. Images transcoded via `DriveApp` in Apps Script to circumvent third-party cookie restrictions in modern web browsers.
2. **Google Sheets API:** Distributed database engine providing relational storage across Master Hub and Spoke spreadsheets.
3. **AlloHealth Logistics Portal:** Embedded via iframe from `allo.html` with synchronized authentication state.
4. **BHMC Portal:** Embedded via iframe from `https://bhmc-redcliffelabs.vercel.app` with cross-origin messaging bridge.
5. **Medibuddy Drop-Off Suite:** Embedded via iframe with authorized domain access for multi-city intake operations.
6. **Chart.js CDN:** High-performance HTML5 canvas charting library for operational velocity visualization.
7. **GSAP (GreenSock) CDN:** High-fidelity UI animation and state transition library.

---

## 15. Feature Inventory Matrix

| Feature Name | Primary Purpose | Frontend Implementation | Backend Implementation | Database Entities | External Integrations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Executive Overview** | Aggregate KPI metrics, 7-day volume, intake velocity | `app.js` (`cr`, `hr`), `index.html` | `getDashboardLogsData` | `Client_Config`, Spoke Sheets | Chart.js |
| **Specimen QC Station** | Visual vial inspection, tube validation, verdict entry | `app.js` (`_r`, `vr`, `Er`), `index.html` | `getAllohealthQCData`, `updateAllohealthQC` | Allohealth Sheet, `Dashboard_Logs` | Google Drive API |
| **Photo Lightbox & Streamer** | High-resolution image zoom, pan, rotation | `app.js` (`modal-photo-lightbox`) | `getGoogleDriveImageBase64` | Phlebotomist Drive Folders | Google Drive API |
| **Challan Maker** | Phlebotomy dispatch manifest and PDF printing | `challan.js`, `redcliffechallan_app.js` | Local client computation | LocalStorage / Print CSS | Browser Print API |
| **AlloHealth Tracker** | Dedicated AlloHealth sample tracking suite | `allo.html`, `allo-app.min.js` | AlloHealth Apps Script bridge | AlloHealth Master Sheet | Sandboxed Iframe |
| **BHMC Tracker** | Bharath Home Medicare specimen tracking | Sandboxed iframe (`index.html`) | BHMC Backend Vercel Suite | BHMC Database Sheet | Vercel Deployment |
| **Medibuddy Portal** | Multi-city Medibuddy drop-off management | Sandboxed iframe (`index.html`) | Medibuddy Web App | Medibuddy City Sheets | Google Workspace |
| **Operations Tool (Ops)** | Deep operations tracking & phlebo assignment | `ops.html`, `app.js` | `Rishabhcodegs.txt` | Operations Master Sheets | Sandboxed Iframe |
| **Bulk Manifest Exporter** | Mass export of collection logs to CSV/Excel | `app.js` (`bulk-dl`) | Client-side Blob generator | Normalized `Qs.logs` | FileSaver / Blob API |
| **Client Registry Config** | Admin management of connected Google Sheets | `app.js` (`#modal-client-config`) | `saveClientConfigRow`, `deleteClientConfigRow` | `Client_Config` Tab | Google Sheets API |
| **Bot Lab Multi-Tab Workspace** | Automated partner portal booking, Grid Multi-View, sequential Queue HUD | `app.js` (`_bl`, `botlabLaunchAllParallel`, `botlabRunNextInQueue`), `index.html` | Client-side DOM automation & query bridging | Partner Portal Booking APIs | External Partner Booking Portal |
| **Dispatch Matrix Drawer** | Bulk triage drawer with client filtering and multi-row launch | `app.js` (`openDispatchMatrix`, `renderMatrixRows`), `index.html` | Client-side memory matrix | Normalized `Qs.logs` | Internal Bot Lab Runner |
| **BishtJiBot Global AI** | Enterprise operational intelligence assistant (Gemini-powered) | `app.js` (`_globalAIChatState`), `index.html` (`#global-ai-fab`), `style.css` | `botlabChat` (`Code.gs`) via GAS Web App | System Knowledge Base & Qs logs | Google Gemini API (2.5 Flash) |

---

## 16. Dependency Graph & Criticality Matrix

| File / Component | Upstream Dependencies | Downstream Consumers | Criticality | Modification Risk |
| :--- | :--- | :--- | :--- | :--- |
| **`index.html`** | `style.css`, CDNs | All client scripts | **CRITICAL** | High. Modifying element IDs breaks DOM queries in `app.js`. |
| **`app.js`** | `api_v2.js`, `auth.js`, DOM | Entire SPA functionality | **CRITICAL** | High. Master state machine and event hub. |
| **`api_v2.js`** | Fetch API, `GAS_URL` | `app.js`, `auth.js` | **CRITICAL** | High. Core communications pipeline to backend. |
| **`Code.gs`** | Apps Script Runtime | All frontend actions | **CRITICAL** | High. Production backend; requires Google deployment. |
| **`style.css`** | Tailwind CSS CDN | `index.html` | **HIGH** | Medium. Layout styling, left rail, glassmorphism. |
| **`auth.js`** | `api_v2.js`, LocalStorage | `app.js`, `index.html` | **HIGH** | Medium. Authentication boundary and session state. |
| **`challan.js`** | DOM, Print Engine | `#tab-content-challan` | **MEDIUM** | Low. Isolated phlebotomist challan generator. |

---

## 17. High-Impact Core Functions

| Function Name | Location | Affected Subsystems | Architectural Significance |
| :--- | :--- | :--- | :--- |
| **`doPost(e)`** | `Code.gs` | All backend endpoints | Central RPC router; enforces action whitelisting and error normalization |
| **`window.google.script.run`** | `api_v2.js` | All API calls | Emulates native Apps Script client API using fetch with timeouts and retries |
| **`syncAllDashboardData(force)`**| `app.js` | KPI cards, charts, tables | Orchestrates background synchronization, caching, and multi-client aggregation |
| **`updateNavBadges()`** | `app.js` | Left navigation rail | Computes dynamic counts for Overview, QC, Allohealth, BHMC, and Medibuddy |
| **`switchDashboardTab(tabId)`** | `app.js` | UI Shell & Routing | Controls view switching, URL synchronization, and GSAP indicator animation |
| **`loadAllQCPhotos(booking)`** | `app.js` | QC Inspection station | Manages sequential photo loading queue to prevent backend request drops |
| **`getGoogleDriveImageBase64(id)`**| `Code.gs` | Drive photo streamer | Converts private Google Drive image binaries into base64 Data URLs |
| **`updateAllohealthQC(...)`** | `Code.gs` | Allohealth Sheet, Audit Log | Atomically records QC decisions and appends immutable audit records |

---

## 18. Performance Notes & Execution Budgets

1. **Google Apps Script Execution Cutoff:** The backend enforces a 24,000ms safety limit to prevent Google's 30-second reverse proxy termination (which yields HTTP 404).
2. **Drive Image Transcoding Load:** Base64 conversion of multi-megabyte camera photos is CPU-intensive in Apps Script. `Code.gs` retrieves thumbnail representations (`file.getThumbnail()`) first to serve lightweight JPEG data URLs (~100-200KB) in milliseconds.
3. **Sequential Photo Pipeline:** `app.js` implements a single-concurrency queue (`base64PreloadQueue`) for active patient images. Unselected patient preloads are suspended while the active patient is loading.
4. **Client Table Virtualization & Pagination:** Client-side tables enforce pagination (15-50 rows per page) to prevent DOM bloat when rendering thousands of records.

---

## 19. Identified Technical Debt & Architectural Anti-Patterns

1. **Dual Legacy/Modern API Modules:** The codebase retains both `api.js` (legacy bridge) and `api_v2.js` (enhanced bridge). While `api_v2.js` is the primary runtime driver, consolidating configuration into a single module will reduce maintenance complexity.
2. **Plaintext Password Storage in Master Sheet:** The `Users` tab currently stores passwords without cryptographic hashing. Implementing SHA-256 password hashing in `authenticateUser` is recommended for enterprise compliance.
3. **Monolithic Backend File:** `Code.gs` contains ~2,500 lines encompassing auth, QC, multi-client parsing, cache management, and image streaming. Modularizing into Apps Script file components (`Auth.gs`, `QC.gs`, `Sync.gs`, `Drive.gs`) would improve maintainability.

---

## 20. Development Workflow & Local Verification

1. **Syntax Verification:** Run `node --check app.js`, `node --check api_v2.js`, and `node --check challan.js` before every deployment.
2. **Strict Dual-Workspace Parity Protocol:**
   - Primary Development Workspace: `C:\Users\KULDEEP SINGH BISHT\Desktop\drop-off dashboard`
   - Vercel Production Git Repository: `C:\Users\KULDEEP SINGH BISHT\Documents\antigravity\clever-volta`
   - Every file modification must be mirrored across both workspaces immediately.
3. **Strict Zero-Emoji Policy:**
   - Under no circumstances may emojis be introduced into UI templates, code comments, alert dialogs, commit messages, or terminal outputs.
   - Only Google Material Symbols Outlined or FontAwesome icons are permitted.

---

## 21. Deployment Process & Production Pipeline

1. **Local Staging:** File edits applied to `C:\Users\KULDEEP SINGH BISHT\Desktop\drop-off dashboard`.
2. **Parity Synchronization:** Modified files copied to `C:\Users\KULDEEP SINGH BISHT\Documents\antigravity\clever-volta`.
3. **Git Commit & Push:**
   ```bash
   git status
   git add -A
   git commit -m "Descriptive non-emoji commit message"
   git push origin main
   ```
4. **Vercel Edge Deployment:** Vercel automatically detects commits on `main` branch, triggering an instant edge deployment at `https://redcliffedropoff.vercel.app/`.
5. **Apps Script Backend Deployment:** When `Code.gs` is updated, open Google Apps Script editor, create a new versioned deployment, and update `GAS_URL` if a new deployment URL is generated.

---

## 22. Known Operational Risks

1. **Google Sheets Concurrent Write Collisions:** When multiple operators submit QC verdicts or Booking ID updates simultaneously, Google Sheets row locking may experience brief contention. `Code.gs` utilizes `LockService.getScriptLock()` with a 10s wait timeout to prevent overwrite collisions.
2. **Third-Party Cookie Blocking in Modern Browsers:** Direct links to `drive.google.com/thumbnail` fail in Chrome/Edge when third-party cookies are partitioned. The Base64 transcoding bridge (`getGoogleDriveImageBase64`) mitigates this risk.
3. **Apps Script Quota Exhaustion:** Heavy burst traffic could reach daily Google Apps Script URLFetch or Drive read quotas. Multi-tiered `CacheService` dramatically reduces backend execution frequency.

---

## 23. Future Architectural Recommendations

1. **Transition to Serverless Cloud Functions (Node.js/Go):** Migrate backend compute from Google Apps Script to Vercel Serverless Functions or Google Cloud Run using the Google Sheets REST API and Service Account credentials for sub-100ms response times.
2. **Relational Database Migration (PostgreSQL / Supabase):** Transition from Google Sheets persistence to a structured PostgreSQL database with real-time subscriptions, while maintaining automated sync to client Google Sheets via webhooks.
3. **Service Worker Offline PWA:** Register a service worker with CacheStorage to enable full offline caching of application assets and optimistic local queueing of QC decisions.

---

## 24. Recent Operational Updates & Synchronizations (September 2026)

1. **Pending Drop-Offs KPI & Overview Table Alignment:**
   - Problem: KPI card showed 3 pending drop-offs while the Client Operations Summary table showed 6 pending (4 for HCL + 2 for Medibuddy), causing the Overview rail badge to also incorrectly display 3.
   - Root Cause: KPI volume `u` was calculated by iterating memory logs (`allLogs`), which only contained recent paginated logs and missed older unresolved batches (such as HCL Lucknow pending on 15-09-2026). Meanwhile, the summary table correctly displayed aggregate pending counts from `Qs.clientStats` / `Qs.trendData`.
   - Solution: Updated `app.js` to calculate `u` directly as the sum of `d[cliKey].pending` from the table's client records. The Pending Drop-Offs KPI and the Overview navigation rail badge (`#badge-overview`) are now guaranteed to match the table's pending total.

2. **Navigation Rail Badges Source-of-Truth Optimization:**
   - Problem: BHMC badge displayed 40 even after the user completed booking creation for all 40 samples (Overview showed Clear / 0 pending).
   - Root Cause: BHMC standalone app posted its physical bus handover queue length (40) via `UPDATE_BADGE`, and the parent dashboard stored this in `window._iframeBadges['badge-bhmc']` and also fell back to historical 7-day `trendData`.
   - Solution:
     - Updated `window.updateNavBadges` to treat Overview `Qs.clientStats` as the primary authority for client booking pendency. When `Qs.clientStats` indicates 0 pending, the badge is immediately hidden (`display: none; data-count="0"`).
     - Removed the multi-day `trendData` loop from badge calculation to avoid displaying historical pendencies.
     - Updated `C:\Users\KULDEEP SINGH BISHT\Desktop\Bharath Lab\app.js` to calculate `unbookedCount` (samples lacking a valid booking ID) instead of posting the raw bus handover queue length, committed, and pushed to GitHub `main`.

3. **AlloHealth Navigation Rail Badge - Pending to Pickup Count Alignment:**
   - Problem: When navigating to the AlloHealth tab, the navigation rail badge (`#badge-allo`) was hidden despite the AlloHealth view displaying `25 PENDING TO PICKUP`.
   - Root Cause: `updateNavBadges` was prioritizing Overview `Qs.clientStats` where AlloHealth booking creation pendency was 0, inadvertently suppressing the actual Pending to Pickup logistics count (25) sent by the AlloHealth tracker iframe.
   - Solution:
     - Updated `app.js` (`updateNavBadges`) so `badge-allo` prioritizes the direct report from the AlloHealth iframe (`window._iframeBadges['badge-allo']`) and cached `localStorage.getItem('allo_pending_pickup_count')`.
     - Updated `allo-app.min.js` on render to store `countPendingTotal` in `localStorage.setItem('allo_pending_pickup_count', countPendingTotal)` alongside posting `UPDATE_BADGE`.
     - `#badge-allo` now accurately displays the Pending to Pickup count (25).

4. **Elimination of Console 404 Error (handover:1):**
   - Problem: DevTools console displayed `Failed to load resource: the server responded with a status of 404 (Not Found) handover:1` on `https://redcliffedropoff.vercel.app/overview`.
   - Root Cause:
     1. In `index.html`, `#bhmc-frame` had `src="https://bhmc-redcliffelabs.vercel.app"` preloaded on initial page load instead of being lazy-loaded on-demand like `#medibuddy-frame`.
     2. In the Bharath Lab standalone app, when restored to `/handover`, relative image URLs (`src="bhm_logo.png"`) resolved to `/handover/bhm_logo.png`, which Vercel rewrote to `/index.html` (text/html). This caused an image decode failure, triggering an `onerror` handler that requested a non-existent external URL (`https://bharathhomemedicare.com/...`) returning HTTP 404.
   - Solution:
     - In `Bharath Lab/index.html`: Added `<base href="/" />`, converted logo paths to absolute `/bhm_logo.png` and `/redcliffe_logo.png`, and removed the dead 404 fallback URL, committed, and pushed to `main`.
     - In `drop-off dashboard/index.html`: Added `<base href="/" />` to `<head>`.

5. **Full Background Iframe Pre-loading & Live State Preservation:**
   - Requirement: All module iframes (`#challan-frame`, `#ops-frame`, `#allo-frame`, `#bhmc-frame`, `#medibuddy-frame`) must load and stay live concurrently in the background from initial startup for zero-latency instant tab switching.
   - Implementation: Ensured `src` is populated on page load for all 5 iframes in `index.html` (including `bhmc-frame` and `medibuddy-frame`). Since the underlying sub-route asset issue in Bharath Lab was permanently resolved with root-relative paths and `<base href="/" />`, all background iframes now stay live without triggering console errors.

6. **Elimination of Sync Stalling (100+s ago), Timeout Resilience & Iframe ReferenceErrors:**
   - Problem:
     - Dashboard header showed `Last Synced: 101s ago` and failed to refresh.
     - Console displayed `API Call failed: getDashboardLogsData Request timed out. Server is busy, please try again in a moment.` (api_v2.js:190).
     - Console displayed `Uncaught ReferenceError: onRedcliffeIframeLoad is not defined` and `onBrowserIframeLoad is not defined`.
   - Root Causes:
     1. Startup Concurrency: On startup, `syncAllDashboardData`, `getAllohealthQCDropdownOptions`, and `getRequiredTubesMapping` were fired concurrently with 5 live background iframes, exhausting Google Apps Script concurrency slots.
     2. Premature Timeout Abort: `api_v2.js` aborted `getDashboardLogsData` at 28 seconds, which was too short when Apps Script is under load.
     3. Missing Fallback: `localStorage` quota and lack of an in-memory cache variable (`_lastDashboardDataCache`) or bundled `dashboard_data.json` snapshot caused `api_v2.js` to log a red `console.error` and call `failureHandler`.
     4. Ticker Ticking Unchecked: When background sync failed, `fr` was not updated, and no quick retry was scheduled, forcing the 1-second interval to count upward indefinitely past 100s until the next 60s tick.
     5. Redundant QC Requests: During every background sync, `Lr(!0)` ran even when the user was on the Overview tab, competing with `getDashboardLogsData`.
     6. Iframe Global Handlers: Medibuddy's deployed web app executed inline `onload="onRedcliffeIframeLoad()"` before functions were resolved.
   - Solutions Implemented:
     - In `api_v2.js`:
       - Introduced in-memory caches `_lastDashboardDataCache` and `_lastAllohealthQCCache` alongside `localStorage` and bundled `dashboard_data.json`.
       - Increased `getDashboardLogsData` timeout from 28s to 38s.
       - If transient network or server delay occurs, seamlessly serve the active cached snapshot to `successHandler` and log a clean warning instead of logging red `console.error`.
     - In `app.js`:
       - Tracked `window._isSyncing` flag and improved the 1-second sync timer display to show a subtle `Syncing...` spinner if elapsed time exceeds 75s while background sync is processing.
       - Gated `Lr(!0)` behind `qcTabBtn.classList.contains("active")` so heavy QC queue fetching only runs when the QC tab is active.
       - Staggered secondary startup calls (`getAllohealthQCDropdownOptions` and `getRequiredTubesMapping`) by 1.5s and 3s.
       - In `withFailureHandler`, if an automated background sync fails, scheduled a quick retry in 8s instead of waiting 60s.
       - Added global guards and suppressed cross-origin `onRedcliffeIframeLoad` / `onBrowserIframeLoad` errors in `window.onerror`.
     - In `index.html`:
       - Declared `window.onRedcliffeIframeLoad` and `window.onBrowserIframeLoad` globally in `<head>`.
     - Saved updated static snapshot to `dashboard_data.json` in both workspaces.
     - Mirrored all changes to `Documents/antigravity/clever-volta` and pushed to Git `main`.

7. **Real-time Browser Tab Title Pendency Notification:**
   - Requirement: Display the pending drop-offs / bookings count directly in the browser tab title in parentheses (e.g. `(8) Drop-off Operation`), mirroring the notification pattern of WhatsApp (`(2) WhatsApp`) and Gmail (`Inbox (1) - ...`).
   - Implementation:
     - Updated `window.updateNavBadges` in `app.js` to compute `overviewCount` (from KPI volume, `Qs.clientStats`, and active pending logs).
     - Dynamically synchronized `document.title` to `(${overviewCount}) Drop-off Operation` when `overviewCount > 0`, and restored `Drop-off Operation` when `overviewCount === 0`.
     - Automatically updates on every 3-second badge polling interval and sync event across all dashboard modules.
     - Mirrored to `Documents/antigravity/clever-volta` and pushed to GitHub `main`.

## FEATURE INVENTORY UPDATE: BOT LAB (Pending Implementation)
- **Name**: Bot Lab (AI-Powered Embedded Browser)
- **Purpose**: Automate bulk booking creation on Redcliffe portal via an embedded Chrome-style browser and AI chat panel.
- **Frontend Files**: index.html (Tab UI), pp.js (Browser Engine & Tab Logic), style.css (Glassmorphism UI)
- **Dependencies**: Relies heavily on the local Chrome Extension (Bisht Ji Ultimate Bot v10.2) to strip X-Frame-Options via declarativeNetRequest and inject form-filling scripts (edcliffe.js) into partner.redcliffelabs.com iframes.
- **Data Flow**: Reads Qs.logs -> user confirms -> opens multiple iframes with ?botAutoRun=true -> extension fills form -> extension sends edcliffeBookingSuccess postMessage back -> dashboard updates sheets.

8. **Morepen Labs Partner Booking Automation & Extension Integration:**
   - Problem:
     - When clicking [ Auto-Create Bot ] for Morepen Labs rows (e.g. Morepen Labs - Order History - VIT Bhopal), the browser opened the partner portal with botPartner=Morepen%20Labs%20-%20Order%20History%20-%20VIT%20Bhopal.
     - The partner portal prompted an alert: 'Select partner portal.' and failed to start the automated booking process.
   - Root Causes:
     1. Partner Name Discrepancy: In Redcliffe_Bot/redcliffe.js, the partner configuration key is 'Dr. Morepen Labs'. Passing 'Morepen Labs - Order History - VIT Bhopal' caused #bisht-sheet-select.value = partnerName to fail to match any option, evaluating to empty string, and causing startBookingHandler to trip the 'Select partner portal.' guard.
     2. Missing Address Mapping: ADDRESS_MAP in redcliffe.js only had 'Dr. Morepen Labs' (Gurugram). The 'VIT Bhopal' branch had no address mapping.
     3. Strict Select Assignment: redcliffe.js attempted direct assignment to #bisht-sheet-select without case-insensitive or fuzzy option matching.
   - Solutions Implemented:
     - In drop-off dashboard/app.js and clever-volta/app.js:
       - window.launchRedcliffeBot normalizes partner names containing 'morepen' to 'Dr. Morepen Labs', and extracts botCity from sheet tab name if not explicitly passed.
       - Also normalizes other partner aliases (Medibuddy, Tatvacare, Flebo.in, TGHS, Betacura, Allohealth, Bharath Home Medicare).
       - Removed mojibake characters in notifications.
     - In Redcliffe_Bot/redcliffe.js:
       - Added pre-seeded fallback tabs for 'Dr. Morepen Labs' ('Order History - VIT Bhopal', 'Order History - Sec 83, GGN').
       - Enhanced botAutoRun handler to normalize botPartner, parse botCity, and perform fuzzy option matching before dispatching change events via selectPartner.
       - Added address entries to ADDRESS_MAP: 'Dr. Morepen Labs_Order History - VIT Bhopal', 'Dr. Morepen Labs_VIT Bhopal', 'Dr. Morepen Labs_Order History - Sec 83, GGN', and 'Bhopal'.
       - Updated address resolution in startBookingHandler to dynamically check 'Dr. Morepen Labs_' + (citySuffix || currentTabName) with fallback to city and main office.

9. **Viewport Height, Cross-Origin Error Suppression & True Simultaneous Multi-Tab Bot Execution:**
   - **Bottom Blank Area Resolution**:
     - *Issue*: Applying `zoom: 0.78` to `body` caused Chromium to truncate the body layout viewport to 78vh of the window, leaving an empty 22vh dead white void at the bottom across all views.
     - *Fix*: Removed `zoom: 0.78 !important;` from `body`. Implemented clean high-density typography and compact padding scaling (`html { font-size: 13px !important; height: 100%; background-color: var(--canvas); }`, `body { font-size: 12.5px; height: 100%; min-height: 100vh; }`). Set `#main-scroll-container` and `.main-content-wrapper` to 100% viewport heights.
   - **Cross-Origin Iframe Console Error Suppression**:
     - *Issue*: `medibuddy-frame` loaded Google Apps Script web app on page startup, triggering `Uncaught ReferenceError: onRedcliffeIframeLoad / onBrowserIframeLoad is not defined` from its internal sandbox. `botlab-iframe-0` loaded `google.com` on startup, firing `Blocked autofocusing on a <textarea> element in a cross-origin subframe.`
     - *Fix*: Lazy-loaded both iframes using `src="about:blank"` and `data-src="..."`. They are now strictly loaded on-demand when the user clicks the Medibuddy tab or opens Bot Lab.
   - **Simultaneous Parallel Multi-Tab Automation in Redcliffe Bot**:
     - *Issue*: When launching pending bookings in multi-tab Grid View, bookings were artificially delayed by 3000ms staggered intervals, and the bot halted with paused address modals or focus thrashing across tabs.
     - *Fix in `redcliffe.js`*:
       - Synthetic event guard: Added `if (!e.isTrusted) return;` inside `setupAddressInterventionWatcher` to prevent synthetic clicks from falsely marking `userTookOverAddress = true`.
       - Focus thrashing fix: In `fillCentreStrict`, replaced the 60-iteration rapid `input.focus()` loop with direct trigger of MUI `button.MuiAutocomplete-popupIndicator`, allowing background iframes to open dropdowns seamlessly without stealing focus.
       - URL parameter patient extraction: Added direct reading of `botPatientName`, `botAge`, `botGender`, `botPhone`, `botTest`, `botLocation`, `botCenter`, `botPartner` from query params.
     - *Fix in `app.js`*: Set `delayMs = 0` in `botlabLaunchPendingTabs` for immediate simultaneous parallel execution across all opened tabs.

10. **Bot Lab Complete Freeze & Infinite Loop Resolution (v=30):**
    - **Fatal Root Cause 1 (JS Event Loop Freeze)**:
      - In `window.botlabRunNextInQueue`, the tab closing loop was implemented as `while (_bl.tabs.length > 1) { window.botlabCloseTab(_bl.tabs[1].id); }` (and previously `while (_bl.tabs.length > 0)`).
      - When `botlabCloseTab` reached its safety boundary `if (_bl.tabs.length <= 1) return;`, the loop was unable to remove the last tab, causing an unbreakable, non-yielding `while` loop that locked the JavaScript thread at 100% CPU. Any button click or interaction immediately froze the entire browser tab.
      - *Fix*: Replaced the unbounded `while` loop with a deterministic, bounded backwards `for` loop:
        ```js
        for (var i = _bl.tabs.length - 1; i >= 1; i--) {
          if (_bl.tabs[i] && _bl.tabs[i].id !== 0) {
            window.botlabCloseTab(_bl.tabs[i].id);
          }
        }
        ```
    - **Fatal Root Cause 2 (TypeError Null Dereferences in Nav Polling)**:
      - The 3-second `updateNavBadges` polling routine and badge counters used `typeof Qs !== "undefined"` guards. In JavaScript, `typeof null === "object" !== "undefined"`. When `Qs` was `null` during startup or network syncs, expressions like `Qs.kpi` or `Qs.clientStats` threw uncaught `TypeError: Cannot read properties of null`, terminating badge updates and chip generation.
      - *Fix*: Hardened all checks to `typeof Qs !== "undefined" && Qs && ...` across lines 5554, 5559, 5634, 5640, 5665, 5681, 5708, and 5724 in `app.js`.
    - **Fatal Root Cause 3 (Iframe Sandboxing Blocking Chrome Extension)**:
      - `#botlab-iframe-0` and dynamically created tab cards possessed `sandbox="allow-scripts allow-forms allow-same-origin allow-popups"`.
      - This sandbox blocked the local Chrome extension (*Bisht Ji Ultimate Bot v10.2*) from injecting `redcliffe.js` and stripping security headers, preventing automated booking completion inside Bot Lab.
      - *Fix*: Removed `sandbox` attributes from `#botlab-iframe-0` in `index.html` and tab iframes in `botlabCreateTab` (in `app.js`), bringing them in line with production iframes (`medibuddy-frame`, `challan-frame`).
      - Added direct "Open in External Window" (`window.open`) buttons to tab headers and queue message actions for users running outside iframe-supported contexts.
    - **Fatal Root Cause 4 (Cache Trap & Stale Code Retention)**:
      - Browser had aggressively cached older `app.js?v=24` which contained the freezing while loop.
      - *Fix*: Bumped asset versions in `index.html` to `app.js?v=30` and `style.css?v=30`.

11. **Bot Lab Enterprise Browser UI & AI Command Suite Elevation (v=31):**
    - **Modern Omnibox & Navigation Suite**: Replaced text-based icons with crisp, pixel-perfect inline SVGs. Added SSL encrypted padlock badge (`.botlab-svg-lock`), JetBrains Mono monospace URL input, 1-click clipboard copy (`window.botlabCopyUrl()`) with animated checkmark feedback, external pop-out window launcher, and round forward navigate button.
    - **Arc Browser-Style Floating Tabs**: Upgraded `.botlab-tab-strip` with floating pill tabs featuring vector world/globe SVGs, animated close buttons (`.botlab-tab-close`), active indicator pills with elevation and smooth transitions, and a micro-interaction rotating '+' new tab trigger.
    - **Dual Execution Segmented Controller**: High-contrast modern segmented control allowing instantaneous switching between *All at Once* (multi-tab parallel grid execution) and *1-by-1 Queue* (sequential batch processing with persistent HUD).
    - **Persistent Queue HUD**: Floating glassmorphic heads-up banner with animated sync status, live queue counter, Skip Next, Pop-out, and Stop actions.
    - **macOS Window Dots & Card Headers**: Added macOS traffic light window dots (red `#ff5f56`, yellow `#ffbd2e`, green `#27c93f`) to both static and dynamically generated tab cards, paired with quick-action SVGs (Focus, Pop-out, Reload, Close).
    - **Linear & Raycast AI Command Dock**: Redesigned RedcliffeBot AI panel with a glowing multi-stop gradient avatar (`#6366f1` to `#06b6d4`), version chip (`v2.4`), status pill with pulsing emerald indicator, Raycast-inspired prompt suggestion chips, and a Linear capsule composer with keyboard hint (`<kbd>↵ Enter</kbd>`).
    - **Full Dark Mode Parity**: Styled all newly introduced UI components with slate-900 / dark-mode themes, indigo accents, and subtle borders.

12. **Universal Server Turn Token & Round-Robin Multi-Tab Pipeline (September 2026):**
    - **Problem**: When running 4+ tabs simultaneously in Bot Lab Grid View or external windows, local fields (Name, Phone, Age, Gender) filled in parallel without issue, but server-dependent fields (Center selection, Address lookup, Test selection) failed in all except 1 tab due to Material-UI Autocomplete focus stealing (`document.activeElement`), popper unmounting on `blur`, and server rate-limiting.
    - **Solution Architecture**: Implemented a FIFO Round-Robin Universal Server Turn Token (`SERVER_TURN_LOCK_KEY` = `bisht_global_server_turn`, `SERVER_TURN_QUEUE_KEY` = `bisht_global_server_queue`) across `redcliffe.js`.
    - **Granular Protection**:
      - `fillCentreStrict`: Acquires turn for ~1.5s, selects Center, verifies, and immediately releases turn.
      - `fillAutoAddressStrict`: Acquires turn for ~2.0s, handles address popup, verifies dialog closed, and releases turn.
      - `fillTestNameStrict`: Acquires turn per test item (~1.2s), attaches `preventBlur` so background tab focus shifts do not close popper, clicks option, verifies chip, blurs input, and releases turn.
    - **Outcome**: All tabs remain open and active simultaneously in Grid View, progressing harmoniously through Center -> Local Details -> Address -> Tests without focus collisions or server timeouts.

---

## 25. Comprehensive Codebase Intelligence Audit & Verified Defect Catalog (September 2026)

### 25.1 Part 0 — AI Backend & Count Resolution Defect Analysis
1. **The "0 Pending" Dual-Scope Bug (`app.js`)**:
   - *Mechanism*: On standard page load, the primary data synchronization path (`app.js:1327`) assigns the response exclusively to module-scoped `Qs` (`Qs = res;`), leaving `window.Qs` as `undefined`.
   - *Contrast*: The Bot Lab synchronization path (`app.js:7532-7533`) sets both: `if (typeof Qs !== "undefined") Qs = res; window.Qs = res;`.
   - *Impact*: In `_generateGlobalAIFallback` (`app.js:8982`), the assistant reads `(window.Qs && window.Qs.kpis && window.Qs.kpis.pendingToday) || 0`. Before visiting Bot Lab, `window.Qs` is `undefined`, evaluating to `falsy || 0` and returning a false, confident **"There are currently 0 pending bookings today."**
   - *Metric Conflation*: `kpis.pendingToday` represents bookings scheduled specifically for the current calendar day (e.g., 24). In contrast, `kpis.totalPendingAcrossClients` represents the active queue across all clients (e.g., 28). The bot incorrectly conflated these two distinct metrics.
   - *Falsy Null Trap*: `|| 0` silently converts an uninitialized network state into a false zero count.
2. **AI Error Strings Passing as Successful Replies (`Code.gs:3163` & `app.js`)**:
   - `Code.gs:3163` `botlabChat` returns `{ status: "success", reply: responseText }` even when `responseText` contains an API error string.
   - The frontend error detection in `app.js:7246` and `app.js:8961` checks substrings (`⚠️`, `Gemini network error`, `Error: No candidates`, `AI Error:`), but fails to catch:
     - `Network error: ...` (Groq catch block at `Code.gs:3122`)
     - `⏳ Groq API is taking a breath!` (Groq rate-limit 429 response at `Code.gs:3115`)
   - *Impact*: Raw error messages are rendered to the user as valid chat messages.
3. **Silent Knowledge Base Failure (`Code.gs:3186`)**:
   - `getBotlabKnowledgeBase` executes `return typeof BOTLAB_KB_TEXT !== 'undefined' ? BOTLAB_KB_TEXT : "";`.
   - If `BotlabKnowledgeBase.gs` is missing from the Apps Script bundle, it silently returns an empty string without throwing, causing the model to answer without business context.
   - Furthermore, `BotlabKnowledgeBase.gs` line count descriptions have drifted (~1,400 lines behind actual).

### 25.2 Part 1 — Design Token System Coverage Audit
- **Rollout Coverage**: Out of ~1,127 styling declarations in `style.css`, only 137 use CSS `var(--token)` (127 of which are in the Base section). The design token rollout is ~10% complete, not 99%.
- **Hardcoded Literals**: 135 hardcoded `font-size:` declarations (0 using `var(--font-*)`), 725 raw hex color literals.
- **Brand Palette Collision**:
  - `tokens.css` defines `--accent: #023B68` (Redcliffe Deep Navy).
  - Primary surfaces and interactive elements in `style.css` use `#0284c7` (Sky Blue, L1747/1797/2155) for navigation states and `#4f46e5` / `#4F46E5` (Indigo, L4481/4870/5299) for Bot Lab, Dispatch Matrix, and BishtJiBot AI branding.
  - Flattening all to `#023B68` harms navigation contrast and destroys AI feature differentiation. Solution: Register `--accent-nav: #0284c7` and `--accent-ai: #4f46e5` as first-class tokens.

### 25.3 Part 2 — Mojibake Byte Sequence Audit
- **19 Confirmed Mojibake Lines**: UTF-8 bytes of ❌ (`\xE2\x9D\x8C`) incorrectly interpreted as Latin-1 (`â Œ `) appear in error toast calls:
  - `app.js`: lines 1450, 1463, 3677, 3682, 3863, 3987, 4082, 4183, 4187, 4231, 4234, 4324, 4327, 4332, 4335, 4396, 4399, 4460, 4463.
- **Valid Typography to Preserve**:
  - `app.js:7513` and `8559`: legitimate typographic em-dashes (`—`).
  - `app.js:7246` and `8961`: `⚠️` comparison literals essential for AI error trapping.

### 25.4 Part 3 — Focus-Visible & Accessibility Defect Analysis
- **Focus Indicator Elimination**: Exactly 2 `:focus-visible` rules exist (`style.css:2131`, `5208`), but 11 rules declare `outline: none` (or `outline: none !important`) across global form controls, dock tabs, nav rail tabs, omnibox, Bot Lab AI input, Dispatch Matrix controls, and Manual Booking inputs. 9 of these have no replacement focus ring.
- **Accessible ARIA Gap**:
  - In `index.html`: 149 `<button>` elements, 110 lack `aria-label`.
  - `aria-expanded` is completely absent (0 usages), leaving collapsible sidebars and dropdown menus inaccessible to assistive tech.
  - `aria-live` is used only once, missing from the toast notifications container and the AI message stream.

### 25.5 Part 4 — Z-Index Hierarchy & Stacking Collisions
- **Layering Collisions**:
  - Collision 1: Global AI FAB sits at `z-index: 90`, completely obscured by modals at `z-index: 1000+`.
  - Collision 2: `.global-ai-overlay` sits at `z-index: 95`, while `.floating-batch-bar` sits at `z-index: 100`. At standard desktop viewports (1280px / 1440px), an open selection bar covers the bottom of the open AI chat overlay.
  - Missing Stacking: `.app-nav-rail` (L2060) and mobile `.botlab-ai-panel` (L3763) have `position: fixed` with no explicit `z-index`.
  - Stacking Tie: `.botlab-matrix-drawer` and `.slide-in-alert` both declare `z-index: 9999`.

### 25.6 Part 5 — Verification & State Audits
- **Login Redirect & Patient Data Replay**: Verified working. `botlabResumeIntendedBooking` (`app.js:6204`) accurately re-injects all patient query parameters (`botPatientName`, `botAge`, `botGender`, `botPhone`, `botTest`, `botAddress`, `botCity`, etc.) into the target iframe on authentication recovery.
- **Patient PII Security Consideration**: Patient query parameters in the iframe URL appear in browser history and partner web logs; logged as a known operational consideration.
- **Dark Mode CSS Elimination**: `index.html` defines `tailwind.config = { darkMode: "class" }`. The `.dark` or `.dark-mode` class is never added dynamically. All 179 `body.dark-mode` rules in `style.css` and lines 104-122 in `tokens.css` are dead code and safe for removal.

### 25.7 Part 6 — UI Parity & Table Capabilities
- **Skeleton Loaders**: Implemented in Overview (6) and Bookings (22), but completely absent in QC Review, Bulk Download, and Challan tabs.
- **Empty / Error States**: Single implementation in QC (`#allo-qc-empty-state`). No shared reusable component.
- **Table Interactivity**: Overview, Bookings Inspector, and Dispatch Matrix lack client-side column sorting and pagination.

### 25.8 Part 7 — BishtJiBot Agentic Actions & Critical Security Blocker
- **CRITICAL SECURITY BLOCKER (`Code.gs:3039`)**:
  - `doPost(e)` currently resolves functions dynamically via `var targetFunc = this[action]; targetFunc.apply(this, parameters);`.
  - There is NO action whitelist. Any global function in `Code.gs` (including `addManualPendingRow`, spreadsheet mutations, internal helpers) can be called directly by any client knowing the public web app URL.
  - Furthermore, duplicate `doPost(e)` declarations exist at `Code.gs:2022` and `Code.gs:3024`, and duplicate `onOpen()` at `Code.gs:35` and `Code.gs:3081`.
  - **Resolution**: Deprecate legacy duplicates and introduce a strict `ALLOWED_ACTIONS` dictionary in `doPost`.
---

## 26. Kits & Consumables Tracker Engine & Dynamic Consignment Intelligence (September 2026)

### 26.1 Operational Background & Business Need
In addition to daily patient specimen intake and phlebotomy drop-offs, Redcliffe Labs coordinates the national distribution of medical collection kits and consumables (blood collection kits, EDTA/SST/Fluoride vacutainer tubes, urine containers, viral transport swabs, needle holders, biohazard bags) dispatched to network clinics (e.g. HCL Healthcare clinics, Allo clinics, and regional diagnostic collection centres).
Previously, operations coordinators tracked dispatches via a view-only Google Sheet (`HCL & ALLO Clinic`, Sheet ID: `1eim2C_w97UxX8yLBrWPCIZVh02x0F7gFu8ApVjjAVxU`, Tab: `Raw`). Being view-only, coordinators lacked:
1. Multi-dimensional filtering (by destination clinic, city, consignment status, date ranges).
2. Courier tracking intelligence (instant parsing and 1-click clipboard copy of courier names and docket numbers).
3. Lead-time metrics (transit turnaround calculation from request to clinic delivery).
4. Aggregate volume metrics (total units dispatched, delivered percentages, active pipeline counts).
5. Offline accessibility (zero-latency instant access without Google Sheets connection overhead).

### 26.2 Architecture & Technical Implementation
- **Frontend Controller (`kits_tracker.js`):** An isolated, high-performance state machine (`window._kitsState`) managing:
  - **Dual-View Rendering Engine:** Instant 1-click toggle between an enterprise **Data Grid Table View** (dense tabular layout with column sorting on Date, Status, Quantity, and Destination Clinic) and a modern **Consignment Cards View** (grid of responsive cards showing status pills, courier chips, lead-time badges, and action buttons).
  - **Courier Intelligence Parser:** RegEx engine extracting courier partner (`GST Logistics`, `Via Rider`, `Trackon`, `Bluedart`) and tracking docket numbers from freeform remark text with 1-click clipboard copy and toast notifications.
  - **Lead-Time Calculation:** Automatic computation of transit turnaround (`deliveryDate - requestDate`) displayed as discrete lead badges (e.g. `2d transit`).
  - **Zero-Flash Instant Hydration Pipeline:** 
    1. Instant 0ms render from `localStorage.getItem('kits_tracker_cache')`.
    2. Fallback to bundled pre-compiled `kits_data.json` (372 records, 26,571 units).
    3. Background asynchronous sync with Google Apps Script backend (`getKitsTrackerData`) with automatic cache storage.
  - **Multi-Filter & Export Engine:** Instant dynamic multi-filtering across search query, status chips (`All`, `Delivered`, `In-Transit`, `In-Process`, `Approval pending`, `Un-Delivered`), dynamic clinic dropdown, dynamic city dropdown, and preset/custom date pickers. Filtered records exportable to CSV at any time with proper escaping.
- **Backend RPC (`Code.gs` -> `getKitsTrackerData`):**
  - Whitelisted in `doPost` (`allowedActions`).
  - Accesses spreadsheet `1eim2C_w97UxX8yLBrWPCIZVh02x0F7gFu8ApVjjAVxU` directly under user credentials.
  - Multi-tier cache (`getLargeCache` / `putLargeCache`) with 600-second TTL to eliminate redundant Google Sheets I/O.
- **API Proxy (`api_v2.js`):**
  - Configured with 28s timeout, failover caching in `localStorage`, and seamless fallback to `kits_data.json` to prevent UI errors during network drops.

### 26.3 Recent QC Console & Bookings Inspector Optimizations
1. **Specimen QC Station Background Pre-Fetching & Loading Parity:**
   - Preloads cached QC records from `localStorage.getItem('allohealth_qc_cache')` on initial page load, preventing the delay when clicking the QC tab.
   - Fixed vacutainer tube and vial count calculations to accurately reflect test requirements.
   - Synchronized QC badge counter to hide immediately when pending count reaches 0.
2. **Bookings Inspector Data & KPI Reconciliation:**
   - Corrected discrepancy where KPI displayed real pending count (36) while the list view showed a filtered subset. Synchronized client-level pending aggregations directly with the authoritative `Qs.clientStats` dataset.

---

## 27. BOT LAB MULTI-TAB AUTOMATION & SHARED SERVER TURN PIPELINE

### 27.1 Problem Statement & Background
When operators launch multiple concurrent booking tabs (2–6 cards in Bot Lab Parallel Grid View), each tab runs inside an isolated `<iframe>` executing the Chrome Extension content script (`redcliffe.js`). In earlier versions, parallel tabs competed simultaneously for Redcliffe's Material-UI Autocomplete dropdowns (Center/Partner selection, Address locality lookup, and Test package assignment), leading to:
1. **Server Throttling & Concurrent AJAX Collision:** Multiple background iframes concurrently requesting the `/api/v1/corporate-clients` and tests search API caused Redcliffe to return unfiltered default corporate lists (e.g., `Vidya Arogyam`, `The Reward Store`) instead of filtering by the requested partner (`Flebo.in`).
2. **Material-UI Popper Latching & Focus Stealing:** When background iframes executed `input.focus()` or `ArrowDown`, MUI opened the autocomplete popper across multiple iframes simultaneously. Subsequent steps failed to unmount previous poppers, leaving orphaned dropdowns overlapping the screen.
3. **Locality Input Corruption:** When client records in Google Sheets or dashboard state lacked explicit address fields, parameters evaluated to `undefined, undefined`, freezing the `Add New Address` dialog.

### 27.2 Solution Architecture & Implementation
- **Universal Server Turn Token (`acquireServerTurn` / `releaseServerTurn`):**
  - Uses cross-iframe shared storage primitives (`bisht_global_server_turn` and `bisht_global_server_queue` in `localStorage`).
  - Guaranteed FIFO queuing ensuring only **one tab at a time** engages server-dependent dropdowns (Center, Address, Test Name).
  - Stale lock detection reduced from 14s to **6s** to prevent stalled background tabs from blocking the queue.
  - Cross-iframe reactive wakeup dispatching storage events on release.
- **Bulletproof Center Autocomplete Typing (`fillCentreStrict`):**
  - Simulates human character-by-character typing with native setter and synthetic keyboard events (`keydown`, `keypress`, `keyup`).
  - Active unfiltered list detection: if the popper opens with default corporate clients (e.g. `Vidya Arogyam`), it immediately performs a backspace + re-type to force MUI's `onInputChange` filter.
  - Strict popper unmounting: upon option selection, calls `Escape` key, blurs input, and forcefully hides any open `.MuiAutocomplete-popper` elements.
- **Address Sanitization & Fallback Guard (`fillAutoAddressStrict` & `_buildBotBookingUrl`):**
  - Strict string sanitization stripping all occurrences of `"undefined"` and fallback to the partner hub (e.g. `Flebo.in_Indore`).
  - Prevents literal `undefined, undefined` from ever entering locality inputs.
  - Auto-dismisses address dialog cleanly if the `SELECT` button is disabled, allowing smooth fallback to manual mode without freezing the queue.
- **Test Multi-Select Popper Closure (`fillTestNameStrict`):**
  - Removes `preventTestBlur` event listeners before option click.
  - Immediately dispatches `Escape`, blurs input, and forces `.MuiAutocomplete-popper` elements to hide, ensuring multi-select dropdowns do not latch open.
- **Pipelined Staggering in Dashboard (`app.js`):**
  - In `window.botlabLaunchAllParallel`, tabs launch with staggered delays (`2000 + idx * 2000ms`), creating a smooth conveyor belt across parallel frames.

### 27.3 Concurrency Architecture: 4 Tabs vs 10 Tabs
1. **Chrome Network Socket Limit (HTTP/1.1 6 Sockets):** Chrome restricts active connections per domain (`partner.redcliffelabs.com`) to 6. Running 4 parallel tabs keeps network utilization under 4 sockets with 2 spare sockets for instantaneous AJAX autocomplete queries. Running 10 simultaneous iframes hits the ceiling, causing requests 7-10 to queue in Chrome's socket pool.
2. **Turn Queue Time Budget:** 4 tabs finish all 3 server steps in ~16–20s. 10 tabs in a single queue take ~55–60s. Previously, `maxWaitMs = 45000` expired on tabs 8-10, causing forced lock theft and collision. `maxWaitMs` is now expanded to **180,000ms (3 minutes)** with an 8s stale grace threshold, enabling large queues to complete without collision.


---

## 28. HCL OPERATIONS TRACKER INTELLIGENCE & DATE NORMALIZATION ENGINE

### 28.1 Problem Statement & Root Cause
Operators reported a severe count mismatch in the Drop-Off Dashboard for HCL:
- Dashboard showed:
  - `HCL - Lucknow`: `0 / 16 UNIQUE BOOKINGS`, `16 Pending`
  - `HCL - Noida`: `0 / 0 UNIQUE BOOKINGS`, `4 Pending`
  - Overall `HCL` (merged): `0 / 16 UNIQUE BOOKINGS`, `20 Pending`
- Actual Google Sheet State (`138OxYFhljZ2bYa8Eil2k4UA5LOrREeuiAj6WecHAVxl`):
  - **Noida tab:** 40 bookings for today (`Count: 40`), mostly created with Redcliffe Booking IDs (`19024306`, etc.), plus pending entries.
  - **Lucknow tab:** 17 bookings for today (`Count: 17`), pending creation.
  - Total actual HCL volume: **57 bookings**!

#### Deep Root Causes:
1. **Zero-Month Typo in HCL Noida Tab (`26-0-2026`):**
   In the Noida sheet tab, Column A was filled with `26-0-2026` (the month was typed as `0` instead of `9` or `09` due to key adjacency on keyboards or formula formatting).
   `normalizeDate` previously executed `new Date(year, month - 1, day)`. With `month = 0`, `month - 1 = -1` (December of previous year), causing `d.getMonth() === month - 1` to fail and return `null` for **all 40 rows**. Every row was skipped from both counts and log aggregation.
2. **Column Mapping Fallback Scope:**
   Universal fallback indices for HCL (`bookingId = 8`, `test = 6`, `phone = 4`, `reqId = 5`) were previously restricted to tabs containing `"noida"`. All tabs in the HCL workbook follow this exact schema.
3. **Add-On Test Omission (Column H):**
   Column H in HCL contains add-on tests (e.g. `HSCRP`, `PPBS`, `CA-15.3`). Only Column G was previously mapped to `test`.
4. **Stale Script Cache:**
   When 0 counts were aggregated, `CacheService` cached the 0 total/created state in `cl_cache_` and `dashboard_data_cache`, serving stale 0s on page load.

### 28.2 Architectural Solution
1. **Intelligent Zero-Month Healing in `normalizeDate` (`Code.gs`):**
   - Automatically detects `month === 0` (e.g., `26-0-2026`, `0-26-2026`, `2026-0-26`, `5-0-2026`).
   - Resolves month `0` to the current active calendar month (`curMonth = now.getMonth() + 1`).
   - Supports 2-digit years (`26-09-26`, `26-0-26`, `9/26/26`) normalized to `2026`.
   - Supports dot-separated dates (`26.09.2026`, `26.9.26`).
   - Supports optional whitespace around delimiters (`\s*[-/. \s]\s*`).
   - Retains 100% backward compatibility with US (`M/D/YYYY` for Medibuddy) and UK (`D/M/YYYY` for Morepen/HCL).
2. **Universal HCL Column Schema & Add-On Aggregation:**
   - Universal column fallbacks across all HCL tabs: `bookingId = 8`, `test = 6`, `phone = 4`, `reqId = 5`.
   - Automatic detection of Column H (`addOnTest`), concatenated into `test` as `EXECUTIVE HEALTH CHECKUP + HSCRP`.
3. **Extended Scan Window:**
   - Scan depth increased from 300 to **500 rows** (`lastRow - 500 + 1`) to ensure high-volume periods are never truncated.
4. **Cache Version Bumping (`v5`):**
   - Cache keys upgraded to `dashboard_data_cache_v5` and `cl_cache_v5_`, instantaneously invalidating stale 0-count caches across all clients.


