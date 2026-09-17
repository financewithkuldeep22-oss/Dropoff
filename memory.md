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
