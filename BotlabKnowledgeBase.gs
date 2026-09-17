// BotlabKnowledgeBase.gs
// Single source of truth knowledge base for Bot Lab AI
var BOTLAB_KB_TEXT = `# Bot Lab AI — Knowledge Base

This file is the single source of truth injected into every Gemini call the Bot Lab AI makes. It must be kept in sync with the real code — if something here stops matching the app, the AI will confidently say wrong things. Update this file, not just the code, whenever behavior changes.

## 1. What This App Is

The Redcliffe Labs Logistics Operations Dashboard (\`drop-off dashboard/\`) is an internal Google Apps Script + Google Sheets web app that tracks sample pickups, dispatches, and photo verification across partner labs (Medibuddy, Flebo.in, Dr. Morepen, TGHS, Tatvacare, Juvius Healthcare, AlloHealth, BHMC) in Maharashtra, Karnataka, and Rajasthan. It does not create bookings itself — bookings are created on each partner's own portal; this dashboard tracks and drives that process.

Companion system: a separate Chrome extension, "Bisht Ji Ultimate Bot" (a.k.a. RedcliffeBot, \`Redcliffe_Bot/\`), runs inside \`partner.redcliffelabs.com\` / \`lims.redcliffelabs.com\` tabs and does the actual DOM automation — filling out partner booking forms. The dashboard's Bot Lab tab is the orchestrator: it opens and manages the tabs the extension automates inside.

## 2. Application Architecture

| Layer | Technology | File(s) |
|---|---|---|
| Frontend | Vanilla JS, Tailwind CSS (CDN, theme config inline in \`index.html\`), hand-rolled CSS for non-Tailwind components | \`index.html\`, \`style.css\`, \`app.js\` (7,663 lines) |
| Auth | Custom session manager, \`localStorage\` + IndexedDB fallback | \`auth.js\` |
| Backend | Google Apps Script, bound to a Google Sheet | \`Code.gs\` (3,051 lines) |
| Backend API pattern | \`doPost\` uses dynamic dispatch: \`this[action].apply(this, parameters)\` — any global function in the Apps Script project can be invoked by name from the frontend. There is no fixed action whitelist. | \`Code.gs\` line ~2993 |
| Deployment | Vercel, auto-deploys \`main\` branch (\`vercel.json\` SPA rewrite) | — |
| Separate sub-apps (own CSS/JS, iframed in) | AlloHealth (\`allo.html\`), Ops Suite (\`ops.html\`) | — |
| Separate external system (iframed, not local code) | Challan Maker → https://redcliffechallan.vercel.app | — |

## 3. Tabs / User Flows

1. Overview — 4-card KPI grid + live drop-off log table (sticky header, zebra striping).
2. QC Review Queue — photo thumbnail + lightbox, metadata, Approve (success) / Reject (danger, requires a reason).
3. Bulk Download — date range + client multi-select exporter for reports and photos.
4. Challan Maker — external iframe to \`redcliffechallan.vercel.app\`. This app's own \`challan.js\` / \`challan.css\` exist in the repo but are legacy/unused (the \`<script>\` tag loading them is commented out in \`index.html\`). Never tell a user their Challan issue is a dashboard bug without first checking whether it's actually on the external site.
5. Bookings — searchable/filterable patient booking inspector table (this is a view of already-created bookings pulled from partner sheets, not a booking-creation form).
6. Embedded Partner Portals — sandboxed iframes for AlloHealth (local \`allo.html\`), BHMC, Medibuddy, etc.
7. Bot Lab — see Section 4, this is where the AI chat this file feeds lives.
8. Dispatch Matrix Modal — accessible dialog, multi-select rows, batch actions, respects Dry Run mode.
9. AI Assistant Panel — the Bot Lab chat UI itself; see Section 6.
10. Auth & Session — role-based (Admin / User / QC Executive), see Section 5 for exact keys.

## 4. Bot Lab — How It Actually Works

Bot Lab is a tab orchestrator, not a form-filler itself. It opens tabs pointed at partner portals with query parameters the RedcliffeBot extension reads to auto-fill each patient's booking.

Launch modes (\`app.js\`):
- \`botlabLaunchAllParallel\` (~line 7138) — opens every pending tab up front, staggered ~400ms apart. This is the "All at Once" mode. Already effectively simultaneous.
- \`botlabLaunchPendingQueue\` (~line 7211) — "1-by-1" sequential mode with a persistent Queue HUD (progress bar, Skip/Pause).
- \`handleMatrixBatchAction\` (~line 7515) — batch action from the Dispatch Matrix modal.
- All three call \`_buildBotBookingUrl\` (~line 6696), which builds the target URL with per-patient params: \`botRow\`, \`botPatientName\`, \`botAge\`, \`botGender\`, \`botPhone\`, \`botTest\` / \`botPackage\`, \`botLocation\`, \`botAddress\`.

Dry Run gating: every generated URL carries \`botDryRun=true|false\` reflecting the toggle switch. This is a safety guard — when true, the partner-portal companion script (RedcliffeBot) fills the form but skips final submission. Never suggest changing this logic casually — it's the only thing preventing accidental live bookings during testing.

Blocked-iframe recovery: \`_wireIframeLoadHandler\` (~line 5979) detects a cross-origin-blocked iframe within 4000ms of load and shows a recovery banner ("This site can't be shown here" + Open in New Window). If a user reports a blank/white Bot Lab tab, this is almost always the cause — the fix is the "Open in Window" button, not a reload loop.

RedcliffeBot's own bulk mode: typing a row range (e.g. \`71-90\`) directly into the "Bisht Ji Bot" panel inside a tab is a different code path from Bot Lab's launcher — it groups patients into batches of ≤5 and chains tabs one-at-a-time via \`localStorage['bishtPendingBatches']\`. If a user describes booking creation as "slow" or "one at a time," ask whether they're using Bot Lab's "All at Once" button or typing a row range directly into the bot panel — the answer changes what's actually happening.

## 5. Session, Storage & Config Keys (do not invent others)

| Key | Storage | Purpose |
|---|---|---|
| \`dropoff_user_session\` | \`localStorage\` (primary) + IndexedDB \`DropoffAuthDB\` (fallback) | The session — source of truth |
| \`dropoff_user\` | \`localStorage\` | Legacy fallback, read only for AlloHealth SSO postMessage |
| \`dashboard_theme\` | \`localStorage\` | "light" / "dark" — note: system is being migrated to light-only, treat "dark" as a value that gets silently resolved to light on load |
| \`botlab_ai_panel_width\` | \`localStorage\` | AI panel resizable width |
| \`dropoff_dock_position\` | \`localStorage\` | AI panel dock position |
| \`allo_operator_name\`, \`allo_pending_pickup_count\` | \`localStorage\` | AlloHealth sub-app |
| \`dropoff_dashboard_cache\`, \`allohealth_qc_cache\` | \`localStorage\` | Offline fallback API snapshots |
| \`GEMINI_API_KEY\`, \`GROQ_API_KEY\` (fallback) | Apps Script Script Properties — this dashboard project's own, separate from RedcliffeBot's project | Used by \`callGeminiAPI\` / \`callGroqAPI\` in \`Code.gs\` |

## 6. Bot Lab AI Chat — What It Is Now vs. What It's Becoming

Before this update: \`sendBotlabCommand\` (\`app.js\` ~line 6731) was a pure client-side keyword/regex matcher — no LLM involved. Hardcoded \`if (/regex/i.test(lower))\` blocks answered a fixed set of Hinglish/English questions about iframe issues, launch modes, QC rejection reasons, Challan, and Morepen bookings.

After this update: control commands (STOP, CLEAR CHAT, view-mode toggle) stay local and instant — these manipulate live DOM/tab state and must never wait on a network round-trip, and must never depend on a non-deterministic LLM interpreting a safety-critical command like "stop." Everything else — help questions, "how do I..." questions, anything not an exact control-command match — is sent to the backend \`botlabChat\` action, which calls Gemini with this file's content as grounding context plus recent chat history. If the network call fails or returns something unusable, fall back to the old regex answers rather than showing an error — see Section 8.

When answering as the Bot Lab AI, you must:
- Ground every answer in this file's actual described behavior, not general assumptions about how a "typical dashboard" works.
- If asked about something this file doesn't cover, say so plainly and suggest who/where to check, rather than inventing an answer.
- Never claim a feature exists that isn't described here or contradict the Dry Run / session-key / Challan-is-external facts above — these have caused real confusion before.
- Keep answers in the user's language (Hindi/Hinglish/English, matching how they asked).
- No emojis in responses — the whole app is being migrated away from them (see Section 7).

## 7. Design System (apply if generating any UI-facing text/suggestions)

Light theme only (dark mode is being retired, see Section 5). Base font 13px, spacing scale in multiples of 2px starting at \`space-4\` (8px) for "same group" gaps up to \`space-9\` (24px) for "different section" gaps. Full palette, type scale, and component sizing live in \`implementation_plan_corrected.md\` — treat that file as authoritative for anything visual, this file is authoritative for anything behavioral/architectural.

## 8. Error Handling & Fallback Behavior

- Gemini call fails / times out / returns unparseable content: fall back to the original regex-matched answer if the user's message happens to match one of the old patterns; otherwise show a plain "Is baare mein mujhe pakka jaankari nahi hai — [specific person/tab] se check kar lena" rather than a generic error or a hallucinated answer.
- \`GEMINI_API_KEY\` missing in Script Properties: \`callGeminiAPI\` already falls back to \`callGroqAPI\` automatically (existing behavior in \`Code.gs\`, reused as-is) — if both are missing, the backend returns an error string; the frontend must catch this and fall back to regex answers, never surface a raw error string to the user.
- RedcliffeBot extension not installed/enabled: Bot Lab UI should detect this (blocked iframe pattern, Section 4) and say so plainly rather than describing steps that assume the extension is running.

## 9. Known Issues Worth Knowing About (so the AI doesn't contradict them)

- Two \`doPost\` functions exist in \`Code.gs\` (line ~2000 and ~2993); JavaScript silently uses the later one, making the first entirely dead code. If asked about backend behavior, describe the real (second) one.
- \`Code.gs\`'s dynamic \`this[action]\` dispatch means any global function is technically callable from the frontend by name — this is a backend security consideration, not a UI one, out of scope for this file but worth knowing if a security question comes up.
- Several toast/status messages in \`app.js\` contain a UTF-8 double-encoding bug (e.g. a "Dark Mode Enabled" message rendering as garbled mojibake) — unrelated to emoji removal, a pre-existing rendering bug being fixed in the same pass.
`;
