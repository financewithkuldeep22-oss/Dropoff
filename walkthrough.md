# Walkthrough: Resolution of Layout Break & Missing Overview Content

We have diagnosed and resolved the issue shown in your screenshot where the dashboard overview content was pushed off-screen and replaced by floating buttons ("Reload Embedded Frame", "Copy Direct Web Link", "Switch to This Tab Inside App").

---

## 1. Root Cause Analysis

1. **Orphaned Context Menu Markup in `index.html`:**
   - In an earlier commit when the right-click context menu was replaced with direct `Ctrl+Click` tab navigation, the outer wrapper `<div id="nav-tab-context-menu">` was deleted, but its inner buttons:
     - `Reload Embedded Frame`
     - `Copy Direct Web Link`
     - `Switch to This Tab Inside App`
     along with unclosed `</button></div></div>` tags were accidentally left at the bottom of `index.html`.
   - Because `<body>` has CSS flex row layout (`class="font-body-md min-h-screen flex"`), having raw `<button class="w-full...">` elements as direct children of `<body>` caused flexbox to resize and crush `.main-content-wrapper` (which has `flex-1`), pushing the entire overview content and KPI cards completely out of view.
   - Furthermore, the two unclosed `</div></div>` tags closed `<body>` and `<html>` prematurely, causing the HTML parser to corrupt the DOM tree.

2. **Console Errors:**
   - `getUserEmail`: Called by the embedded `ops.html` frame, but `'getUserEmail'` was missing from `allowedActions` in `Code.gs` and lacked a client-side session fallback in `api_v2.js`.
   - `onRedcliffeIframeLoad` / `onBrowserIframeLoad`: Handled as top-level hoisted global functions in `<head>`.

---

## 2. Changes Applied

### A. Repaired HTML Layout (`index.html`)
- Completely purged all orphaned context menu buttons and stray `</div></div>` tags from `index.html`.
- Verified tag balance across all 3,138 lines: **0 unclosed tags, 0 mismatched tags**.
- Registered hoisted global functions `function onRedcliffeIframeLoad() {}` and `function onBrowserIframeLoad() {}` in `<head>`.
- Bumped script versions to `api_v2.js?v=6` and `app.js?v=48`.

### B. Fixed `getUserEmail` Action (`Code.gs` & `api_v2.js`)
- Added `'getUserEmail'` to the backend `allowedActions` whitelist in `Code.gs`.
- Added an instantaneous local session fallback in `api_v2.js` so it immediately returns the active user's email without logging an error.

---

## 3. Verification

- Ran automated DOM tag balance validator: **0 unclosed tags, 0 errors**.
- Validated JS syntax of `app.js` and `api_v2.js`: **0 syntax errors**.
- Synced to both git repositories (`Dropoff` and `redcliffe-dropoff-portal`).
- Production deployment pushed to Vercel.
