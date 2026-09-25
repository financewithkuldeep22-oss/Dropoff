# Dependency Graph & Code Interaction Matrix

---

## 1. Runtime Script Execution Order

```
index.html
 │
 ├── CDN External Dependencies:
 │    ├── Google Fonts (Plus Jakarta Sans, Space Grotesk, JetBrains Mono, Inter)
 │    ├── Material Symbols Outlined, Libre Barcode 128 & FontAwesome 6.4.0
 │    ├── Tailwind CSS CDN (with container-queries & forms plugins)
 │    ├── GSAP 3.12.2 & ScrollTrigger
 │    └── Chart.js 4.x
 │
 ├── Internal Scripts Execution Order:
 │    ├── 1. offline-game.js (Initializes canvas runner & connection listeners)
 │    ├── 2. auth.js (Initializes window.AuthManager & session checking)
 │    ├── 3. api_v2.js (Initializes window.google.script.run proxy with abort timers)
 │    ├── 4. kits_tracker.js (Initializes Kits & Consumables Tracker state machine, instant hydration, and filters)
 │    ├── 5. app.js (Initializes DOM event listeners, Chart.js instances, tab routing, QC console, Bookings inspector)
 │    └── 6. challan.js (Initializes Phlebotomist Challan Maker engine on demand)
 │
 ├── Bundled Static Fallback Data:
 │    ├── dashboard_data.json (Emergency static snapshot for main dashboard)
 │    ├── kits_data.json (Bundled offline fallback dataset with 372 consignment rows)
 │    └── dashboard_knowledge.json (Grounded Bot Lab intelligence KB)
 │
 └── Stylesheets:
      ├── tokens.css (Design system tokens & variables)
      ├── challan.css (Challan Maker layout styling)
      └── style.css (Design tokens, liquid glass aesthetics, left vertical rail)
```

---

## 2. Code File Interaction Matrix

| File | Depends On | Exposes / Used By | Critical Rating | Modification Risk |
| :--- | :--- | :--- | :--- | :--- |
| **`index.html`** | `style.css`, scripts | Top-level SPA DOM Container | **CRITICAL (HIGH)** | High — Changing element IDs breaks event bindings in `app.js` and `kits_tracker.js`. |
| **`style.css`** | Tailwind base | Theme variables, Left Rail, Liquid Glass, Badges | **HIGH** | Medium — Overrides layout and responsive docking rules. |
| **`app.js`** | `api_v2.js`, `auth.js`, `GSAP`, DOM | Tab routing, table rendering, QC workflow, Modals | **CRITICAL (HIGH)** | High — Contains core client business logic and state management. |
| **`kits_tracker.js`** | `api_v2.js`, `localStorage`, `kits_data.json`, `index.html` | `window.renderKitsTrackerView`, `window.loadKitsTrackerData`, `window.exportKitsToCSV`, `window._kitsState`, `window.copyKitsDocket` | **HIGH** | Low to Medium — Modular inventory tracking engine; isolated state machine. |
| **`kits_data.json`** | Pre-compiled JSON | Bundled offline fallback dataset (372 records, 26,571 units) for zero-latency cold starts | **MEDIUM** | Low — Static data fallback. |
| **`api_v2.js`**| `fetch`, `AbortController` | `window.google.script.run` proxy bridge | **CRITICAL (HIGH)** | High — Central network pipe to Google Apps Script backend. |
| **`auth.js`** | `api_v2.js`, `localStorage` | `window.AuthManager` | **HIGH** | Medium — Security gate for authenticated operations. |
| **`challan.js`**| DOM, `app.js` | `window.initChallanApp`, Challan generation | **MEDIUM** | Low — Self-contained phlebotomist dispatch challan engine. |
| **`Code.gs`** | Google Workspace APIs | Serverless Web App API (`doPost`, `doGet`) | **CRITICAL (HIGH)** | High — Backend business logic; requires Apps Script deployment. |

---

## 3. High-Impact Core Functions

| Function Name | File | Systems Impacted | Risk Level |
| :--- | :--- | :--- | :--- |
| `doPost(e)` | `Code.gs` | All frontend-backend communication | **Extreme** |
| `window.google.script.run` | `api_v2.js` | Every API call made by frontend | **Extreme** |
| `switchDashboardTab(tabId)` | `app.js` | Navigation, view switching, iframe loading, tab activation | **High** |
| `loadKitsTrackerData(force)` | `kits_tracker.js` | Cache hydration, network sync, dropdown population | **Medium** |
| `renderKitsTrackerView()` | `kits_tracker.js` | Kits tab render, Data Grid / Card view toggling | **Medium** |
| `getKitsTrackerData(force)` | `Code.gs` / `api_v2.js` | Consignment sheet extraction & 600s cache | **Medium** |
| `loadAllQCPhotos(booking)` | `app.js` | QC photo loading queue and UI states | **High** |
| `getGoogleDriveImageBase64(id)`| `Code.gs` / `api_v2.js` | Google Drive photo transcoding & display | **High** |
| `syncAllDashboardData(force)` | `app.js` | KPI counters, Overview table, Client stats | **High** |
| `updateAllohealthQC(...)` | `app.js` / `Code.gs` | Direct write-back to Allohealth sheet & audit log | **High** |
