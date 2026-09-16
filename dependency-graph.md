# Dependency Graph & Code Interaction Matrix

---

## 1. Runtime Script Execution Order

```
index.html
 │
 ├── CDN External Dependencies:
 │    ├── Google Fonts (Plus Jakarta Sans, JetBrains Mono)
 │    ├── Material Symbols Outlined & FontAwesome 6.4.0
 │    ├── Tailwind CSS CDN (with container-queries & forms plugins)
 │    ├── GSAP 3.12.2 & ScrollTrigger
 │    └── Chart.js 4.x
 │
 ├── Internal Scripts Execution Order:
 │    ├── 1. offline-game.js (Initializes canvas runner & connection listeners)
 │    ├── 2. auth.js (Initializes window.AuthManager & session checking)
 │    ├── 3. api_v2.js (Initializes window.google.script.run proxy with abort timers)
 │    ├── 4. challan.js (Initializes Phlebotomist Challan Maker engine)
 │    └── 5. app.js (Initializes DOM event listeners, Chart.js instances, tab routing)
 │
 └── Stylesheets:
      └── style.css (Design tokens, liquid glass aesthetics, left vertical rail)
```

---

## 2. Code File Interaction Matrix

| File | Depends On | Exposes / Used By | Critical Rating | Modification Risk |
| :--- | :--- | :--- | :--- | :--- |
| **`index.html`** | `style.css`, scripts | Top-level SPA DOM Container | **CRITICAL (HIGH)** | High — Changing element IDs breaks event bindings in `app.js`. |
| **`style.css`** | Tailwind base | Theme variables, Left Rail, Liquid Glass, Badges | **HIGH** | Medium — Overrides layout and responsive docking rules. |
| **`app.js`** | `api_v2.js`, `auth.js`, `GSAP`, DOM | Tab routing, table rendering, QC workflow, Modals | **CRITICAL (HIGH)** | High — Contains core client business logic and state management. |
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
| `switchDashboardTab(tabId)` | `app.js` | Navigation, view switching, iframe loading | **High** |
| `loadAllQCPhotos(booking)` | `app.js` | QC photo loading queue and UI states | **High** |
| `getGoogleDriveImageBase64(id)`| `Code.gs` / `api_v2.js` | Google Drive photo transcoding & display | **High** |
| `syncAllDashboardData(force)` | `app.js` | KPI counters, Overview table, Client stats | **High** |
| `updateAllohealthQC(...)` | `app.js` / `Code.gs` | Direct write-back to Allohealth sheet & audit log | **High** |
