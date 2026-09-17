# Routing & Screen Navigation Map

---

## 1. Single Page Application (SPA) Client Navigation

Navigation routing is managed dynamically by `window.switchDashboardTab(tabId)` inside `app.js`. View containers are toggled via CSS display properties and GSAP animations:

| Route / Tab ID | DOM Container | Navigation Button | Canonical Order | Auth Required | Purpose / Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `overview` | `#tab-content-overview` | `#tab-overview-btn` | 1 | Yes | Executive KPI cards, client pendency table, collection trend chart |
| `qc` | `#tab-content-qc` | `#tab-qc-btn` | 2 | Yes | Allohealth QC review console, tube checklist validation, photo streamer |
| `allo` | `#tab-content-allo` | `#tab-allo-btn` | 3 | Yes | Embedded AlloHealth Sample Logistics Tracker (`allo.html`) |
| `bhmc` | `#tab-content-bhmc` | `#tab-bhmc-btn` | 4 | Yes | Embedded Bharath Home Medicare Tracker (`bhmc-redcliffelabs.vercel.app`) |
| `medibuddy` | `#tab-content-medibuddy`| `#tab-medibuddy-btn` | 5 | Yes | Embedded Medibuddy Drop-off Portal with auto-authorized domain access |
| `challan` | `#tab-content-challan` | `#tab-challan-btn` | 6 | Yes | Phlebotomist Challan Maker with auto-numbering and PDF export |
| `ops` | `#tab-content-ops` | `#tab-ops-btn` | 7 | Yes | Integrated Operations Tool suite (`ops.html`) |
| `bulk-dl` | `#tab-content-bulk-dl` | `#tab-bulk-dl-btn` | 8 | Yes | Mass report export and bulk sample manifest generator |
| `bot-lab` | `#tab-content-bot-lab` | `#tab-bot-lab-btn` | 9 | Yes | Embedded multi-tab partner portal browser & AI command automation center |
| `config` | Triggered via Modal | `#sidebar-manage-sheets-btn`| 10 | Yes (Admin) | Client Google Sheet connection registry manager |
| `bookings` | Nested in `#tab-content-overview`| Deep link / Button | - | Yes | Detailed booking inspector and real-time client filter |

---

## 2. Deep Linking URL Map

The application supports standard browser history navigation (`pushState` and `popstate`):

| URL Path | Tab Mapped | Fallback Aliases |
| :--- | :--- | :--- |
| `/overview` | `overview` | `/`, `#overview` |
| `/qc` | `qc` | `/qc-check`, `/qc-console` |
| `/allo` | `allo` | `/allohealth`, `/tracker` |
| `/bhmc` | `bhmc` | `/bhmc-tracker`, `/bharath` |
| `/medibuddy` | `medibuddy` | `/mb`, `/medi-buddy` |
| `/challan` | `challan` | `/challan-maker` |
| `/ops` | `ops` | `/opstool`, `/operations`, `/rishabh` |
| `/bulk` | `bulk-dl` | `/bulk-dl`, `/bulk-download` |
| `/bot-lab` | `bot-lab` | `/bot`, `/lab`, `/partner-portal` |
| `/bookings` | `bookings` | `/inspector`, `/live-view` |

---

## 3. Modal Routes & Dialog Overlays

| Modal Identifier | Trigger Action | Access | Functionality |
| :--- | :--- | :--- | :--- |
| `#modal-dispatch-matrix` | "Dispatch Matrix" button in Bot Lab toolbar | Logged In | Batch operations console, multi-select rows, parallel tab launch, queue launch, and popup windows |
| `#modal-manual-booking` | "Manual Booking" button in Bot Lab toolbar | Logged In | Dual-mode manual booking dialog: Mode A (Sheet Append) & Mode B (Guided Portal Assist) with lossless toggle |
| `#modal-pending-view` | "Pending Bookings" button in navigation rail / header | Logged In | Client breakdown and quick copy for pending requisition bookings |
| `#login-overlay` | Initial load if unauthenticated / Logout | Public | Secure username/password authentication modal |
| `#modal-client-config`| "Config" button in navigation rail | Admin | Dynamic client spreadsheet URL, tab name, and status editor |
| `#modal-photo-lightbox`| Thumbnail click in QC review panel | Logged In | Full-screen photo lightbox with 25% zoom, rotation, and panning |
| `#offline-overlay` | Network disconnection event (`offline`) | Public | Offline warning banner with embedded 2D HTML5 canvas runner game |

---

## 4. Backend Web App HTTP Gateways (`Code.gs`)

| HTTP Method | URL Path | Handler | Access | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/exec` | `doGet(e)` | Public | Serves web app template when launched directly in Google Workspace |
| `POST` | `/exec` | `doPost(e)` | Protected | Core JSON-RPC API endpoint parsing `{ action, args }` |
| `OPTIONS` | `/exec` | `doOptions(e)` | Public | CORS preflight handler responding with HTTP 200 |
