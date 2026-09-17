# System Update: Bot Lab AI + RedcliffeBot — Real AI, Redesigned Chat, Manual Booking

Decisions locked in from the last round:
1. Bot Lab AI becomes a real Gemini-backed assistant (not regex), reusing the app's existing `GEMINI_API_KEY` convention.
2. Manual booking creation ships both modes — "add pending row to sheet" and "guided manual-fill of the partner portal" — user picks per-booking.

One correction before the build: the dashboard (`drop-off dashboard/`) and RedcliffeBot (`Redcliffe_Bot/`) are two separate Apps Script backends/deployments, confirmed by reading both `Code.gs` files (different `doGet`/`doPost`, different sizes, different Web App URLs). Any `GEMINI_API_KEY` you've already set in Script Properties lives in RedcliffeBot's project (that's the one whose `Code.gs` already calls Gemini for `mapTests`/`parsePatientData`). The dashboard's own `Code.gs` has zero AI integration today — you'll need to add the same `GEMINI_API_KEY` (same key value is fine, just set in this project's Script Properties too) before Bot Lab AI can go live. Antigravity should check both projects' Script Properties and tell you plainly which one(s) are missing the key rather than assuming.

## Part 1 — Backend: Give the Dashboard Its Own Gemini Call

The dashboard's `Code.gs` `doPost` (the real one, ~line 2993 — there's a dead, shadowed duplicate at ~line 2000 that JavaScript silently ignores; leave it alone or delete it as cleanup, but don't confuse it with the live one) dispatches any global function by name:
`this[action].apply(this, parameters)`. That means adding the new AI endpoint doesn't need a new if/else branch — just add a new global function and the frontend calls it the same way everything else does.

Add to `Code.gs` (mirror the exact pattern already proven in RedcliffeBot's `Code.gs` — same `callGeminiAPI` / `callGroqAPI` shape, same error handling, same "clean markdown fences before JSON.parse" habit):

```javascript
function callGroqAPI(prompt, temperature) {
  if (temperature === undefined) temperature = 0.1;
  const apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY'); 
  if (!apiKey) return "⚠️ AI Error: GROQ_API_KEY is missing in Apps Script Properties.";
  
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = {
    "model": "llama-3.3-70b-versatile", 
    "messages": [{ "role": "user", "content": prompt }],
    "temperature": temperature,
    "max_tokens": 4096
  };
  
  const options = {
    "method": "post",
    "headers": { "Authorization": "Bearer " + apiKey },
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 429) return "⏳ Groq API is taking a breath! Please wait 10 seconds."; 
    
    const json = JSON.parse(response.getContentText());
    if (json.error) return "⚠️ API Error: " + json.error.message;
    return json.choices[0].message.content;
    
  } catch(e) { 
    return "Network error: " + e.toString(); 
  }
}

function callGeminiAPI(prompt, temperature) {
  if (temperature === undefined) temperature = 0.1;
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); 
  if (!apiKey) return callGroqAPI(prompt, temperature); // Fallback to Groq if key missing
  
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  const payload = {
    "contents": [{
      "parts": [{
        "text": prompt
      }]
    }],
    "generationConfig": {
      "temperature": temperature
    }
  };
  
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    if (json.error) return "⚠️ API Error: " + json.error.message;
    if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
      return json.candidates[0].content.parts[0].text;
    }
    return "Error: No candidates returned from Gemini API";
  } catch(e) { 
    return "Gemini network error: " + e.toString(); 
  }
}

function botlabChat(userMessage, historyJson) {
  var kb = getBotlabKnowledgeBase(); // see below
  var history = [];
  try { history = JSON.parse(historyJson || "[]"); } catch (e) {}
  var historyText = history.slice(-6).map(function(m) {
    return (m.role === "user" ? "User: " : "Assistant: ") + m.text;
  }).join("\n");
  
  var prompt = kb + "\n\n---\nRecent conversation:\n" + historyText +
    "\n\nUser's new message: \"" + userMessage + "\"\n\n" +
    "Answer as the Bot Lab AI, following every rule in the knowledge base above. " +
    "Keep it short — this renders in a narrow chat panel, not a document. " +
    "Reply in the same language mix (Hindi/Hinglish/English) the user used. No emojis.";
    
  var responseText = callGeminiAPI(prompt, 0.3);
  return { status: "success", reply: responseText };
}

function getBotlabKnowledgeBase() {
  // Return the contents of botlab_knowledge_base.md as a string constant.
  // Script Properties has a 9KB-per-value limit — this file will likely exceed that,
  // so store it as a plain JS template-string constant in its own file
  // (e.g. a new BotlabKnowledgeBase.gs), not in Script Properties or Drive.
  return typeof BOTLAB_KB_TEXT !== 'undefined' ? BOTLAB_KB_TEXT : "";
}
```

Create `BotlabKnowledgeBase.gs` as a new file in the same Apps Script project, containing the full text of `botlab_knowledge_base.md` as a single backtick template string assigned to `BOTLAB_KB_TEXT`. Keep it as a separate file so updating the knowledge base is a one-file edit, not a hunt through `Code.gs`. Whenever the app's real behavior changes, this file needs to change too — a stale knowledge base makes the AI confidently wrong, which is worse than the old regex system's "doesn't know the answer" failure mode.

Frontend call (add to `app.js`, replacing most of the body of `sendBotlabCommand`):
- Keep the STOP / CLEAR CHAT / grid-view-toggle blocks exactly as they are (~lines 6768–6784) — these stay instant and local, no network round-trip, for the reasons in the knowledge base file (safety-critical commands shouldn't depend on network latency or LLM non-determinism).
- Everything past that point — the whole "Knowledge Base Query Resolution" if/else chain (~line 6795 onward through ~7553) — gets replaced with a single call:

```javascript
async function botlabAskAI(text, history) {
  showTypingIndicator();
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "botlabChat", parameters: [text, JSON.stringify(history)] })
    });
    const data = await res.json();
    if (data && data.status === "success" && data.reply) {
      _addMsg("bot", data.reply, true);
      return;
    }
    throw new Error("bad response");
  } catch (e) {
    botlabAskAIFallback(text); // old regex logic, kept as a function, not deleted
  } finally {
    hideTypingIndicator();
  }
}
```

- Don't delete the old regex if/else chain — move it into a `botlabAskAIFallback(text)` function. It becomes the offline/error fallback (Part 5), not dead code.

## Part 2 — The Two "Prompts," Written Accurately

Bot Lab AI's prompt is the `botlabChat` prompt-assembly above: knowledge-base file + recent history + the user's message + the short instruction block at the end. It's already written in Part 1 — the actual "prompt engineering" lives in `botlab_knowledge_base.md` (Part 3 explains why the knowledge base is the prompt, not a separate thing).

RedcliffeBot's two existing prompts (`Redcliffe_Bot/Code.gs`, `serverMapTestsWithGemini` and `parsePatientDataWithGemini`) are narrow, single-purpose, and already working — don't rewrite them wholesale. Two small, targeted improvements worth making, both grounded in reading the actual prompt text:
- `serverMapTestsWithGemini`'s prompt hardcodes the full test-code list inline. If that list ever changes, both this prompt and the local fallback mapper a few lines below it (`redcliffe.js`, the keyword-based fallback used when Gemini fails) need updating in two places. Worth flagging in code as a "keep these two in sync" comment; not a UI/UX change, just a maintainability note.
- Neither prompt tells Gemini what to do with ambiguous/partial input beyond "if none match, respond with []" — add one line to each: what confidence threshold counts as a match, so the fallback mapper's behavior and Gemini's behavior for the "genuinely doesn't know" case actually agree.

## Part 3 — Why "Always Reference the MD File First" Means What It Means Here

A regex system can't "reference" a file at decision time — every branch is already hardcoded. Only once Bot Lab AI is a real Gemini call does "reference this file first" become literally true: `botlab_knowledge_base.md`'s content is the first thing in every prompt sent to Gemini (Part 1's `botlabChat` function). That's the mechanism — there's no separate "check the file, then answer" step to build, because the file's content is the grounding context on every single call by construction.

## Part 4 — Chat UI/UX Redesign (grounded in the real CSS, not generic advice)

Current structure (`style.css`): `.botlab-ai-panel` is 330px default width (resizable 250–650px), full height, flex column containing (top to bottom): a matrix-trigger button row, `.botlab-queue-hud` (hidden unless `.active`, appears as a ~32px banner during 1-by-1 queue runs), `.botlab-ai-messages` (flex:1, scrollable), a progress bar, the suggestion-pills row, and the composer.

Concrete fixes:
- **Minimum default width**: raise the default from 330px to 380px (matches the ≥360px floor already specified in the dashboard's design plan for exactly this reason).
- **Collapse suggestion pills while a run is active**: the suggestion pills (`#botlab-ai-suggestions`) are for getting started, not useful mid-run — hide them automatically whenever `.botlab-queue-hud.active` or a parallel-grid run is in progress, freeing that vertical space for messages. This is a CSS/state change (toggle a class), not a rebuild.
- **Guarantee message-area minimum height**: set `.botlab-ai-messages { min-height: 40%; }` inside the flex column so it can never be squeezed below 40% of panel height even when Queue HUD + progress bar + composer are all visible.
- **Progressive disclosure for the booking-launch confirmation**: bot messages that currently render 2–3 action buttons inline in a flex-wrap row (e.g. the "Open in Window" / "Reload Iframe" pair, or "Launch All at Once" / "Open Dispatch Matrix"). Keep the primary action button visible; put anything beyond the first two behind a small "More options" toggle within the same message bubble, rather than growing every message's height.
- **Sticky composer, not sticky "form"**: the composer bar and the queue-control buttons staying pinned to the bottom of the flex column regardless of message count (`flex-shrink: 0` on the composer).
- **Inline validation, not modals**: matches how errors surface in the chat today (`_addMsg("bot", ..., true)` with inline HTML).

## Part 5 — Manual Booking Creation (both modes)

### Mode A — Add a pending row to the tracking sheet
For when a booking was made through some channel outside this whole system (phone call, walk-in, a partner's own app) and just needs to enter Redcliffe's tracking log so RedcliffeBot can later pick it up as a normal pending row.
- A compact form: Client/Partner (dropdown, from `Client_Config` sheet — reuse `getSheetColumnMap`'s existing column-detection logic rather than hardcoding field positions again), Patient Name, Age, Gender, Phone, Test/Package, Location, Collection Time, Notes.
- On submit: append a row to the correct partner's sheet tab via a new backend function (same dynamic-dispatch pattern as everything else — `addManualPendingRow(clientName, tabName, rowData)`), marked with a distinguishing flag/column so it's traceable later as "manually entered" vs. pulled from a partner export.
- Row selection dropdown with recent/favorites (picking which sheet tab/client to add into).

### Mode B — Guided manual-fill of the partner portal
For when the person wants to book on the partner's actual site themselves (not delegate to the bot) but still wants help — field highlighting/suggestions, not automation.
- Opens the same partner-portal iframe/tab Bot Lab already knows how to launch (reuse `_buildBotBookingUrl`'s URL-building, just without `botDryRun` / auto-fill params — or with a new `botManualAssist=true` param).
- RedcliffeBot's content script (`redcliffe.js`) gets a lightweight "assist-only" mode: given the same patient data, it highlights/scrolls-to the matching field on the real page instead of filling it, so the person types it themselves but doesn't have to hunt for which field is which. This reuses RedcliffeBot's existing field-detection logic — it's a rendering-mode flag on code that already exists, not new field-detection work.
- No sheet write happens automatically here — Mode B is purely an in-browser assist; if the person wants it logged afterward, that's Mode A, run separately.

Switching between modes without data loss: both modes should read from and write to the same in-memory patient-data object (whatever the person has typed so far), so choosing "actually, let RedcliffeBot do the rest" after starting Mode B doesn't require re-entering anything — pass the same object into `_buildBotBookingUrl`'s URL params instead of discarding it.

Success state: booking summary (client, patient, test, row/location) with Duplicate (pre-fill a new form from this one), Share (copy a formatted summary to clipboard — reuse whatever the existing WhatsApp/Gmail draft helpers in `app.js` / `redcliffe.js` already do for formatting patient summaries, don't write a third formatter), and Modify (reopen the form pre-filled, same object).

## Part 6 — Integration Consistency & Fallbacks
- Gemini unavailable: `botlabChat` returns an error string; frontend catches it and calls `botlabAskAIFallback` (the preserved old regex logic) instead of showing a raw error.
- Gemini returns something that isn't useful: same fallback path — don't show a bad AI answer just because the call technically succeeded.
- RedcliffeBot extension not installed: iframe blocked-detection recovery banner; Bot Lab AI should say the extension looks like it's not active.
- Sheet write fails in Mode A: standard error toast `wr(message, true)`.
- Two people trigger Mode A: note as known limitation.
