# HANDOFF.md — Bot Lab AI & Manual Booking System Update

**Branch**: `uiux-overhaul/dashboard`  
**Date**: September 18, 2026  
**Author**: Antigravity (Pair Programmer)

---

## 1. Executive Summary & Safety Checklist

- [x] **Branch Safety**: Created and operating strictly on `uiux-overhaul/dashboard`. `main` branch was left untouched.
- [x] **API Key Safety**: No API keys were hardcoded, guessed, or generated. All code relies exclusively on `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')` and `PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY')`.
- [x] **Legacy Code Preservation**: Existing functional code (such as regex-based query resolution) has been preserved as fallback (`botlabAskAIFallback`), not deleted.
- [x] **Incremental Commits**: Commits are made step-by-step per phase with clear messages.

---

## 2. Configuration Action Required (Morning Checklist for User)

1. **Dashboard Google Apps Script Script Properties**:
   - Open the Google Apps Script project bound to the dashboard spreadsheet (`1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU`).
   - Navigate to **Project Settings** > **Script Properties**.
   - Add property `GEMINI_API_KEY` (and optionally `GROQ_API_KEY` as fallback).
   - *Note*: As noted in the update specification, the `Redcliffe_Bot` project already has `GEMINI_API_KEY` configured; this dashboard Apps Script project is a separate Apps Script project and needs the key set in its own Script Properties.
2. **Deploy Apps Script Web App**:
   - Update / deploy a new version of the Web App so `doPost` exposes `botlabChat` and `addManualPendingRow`.

---

## 3. Implementation Log & Design Decisions

### Phase 1: Part 1 — Backend AI Endpoint & Knowledge Base
- **Files Created / Modified**:
  - `botlab_knowledge_base.md`: Documented full architecture, session keys, tabs, workflows, and rules.
  - `botlab_ai_redcliffebot_system_update.md`: System update requirements reference.
  - `BotlabKnowledgeBase.gs`: Added `BOTLAB_KB_TEXT` constant containing the knowledge base for Gemini grounding.
  - `Code.gs`: Added `callGroqAPI`, `callGeminiAPI`, `botlabChat`, and `getBotlabKnowledgeBase`.
- **Decisions & Findings**:
  - `node --check` natively gave `ERR_UNKNOWN_FILE_EXTENSION` on `.gs` files because Node doesn't recognize the `.gs` extension; verified syntax using `Get-Content <file>.gs -Raw | node --input-type=commonjs --check` and tested dynamic runtime execution using `node -e "vm.runInContext(...)"`.
  - Used `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')` and `GROQ_API_KEY` with zero hardcoded credentials.
  - Fallback logic from Gemini to Groq matches `Redcliffe_Bot/Code.gs`.

### Phase 2: Part 4 — Chat UI/UX Redesign & Frontend Integration
- **Files Modified**:
  - `app.js`:
    - Updated `sendBotlabCommand`: Retained instant local control commands (`STOP`, `CLEAR CHAT`, `VIEW MODE TOGGLE`), and routed all conversational questions to `botlabAskAI`.
    - Added `botlabAskAI(text, history)`: Dispatches `botlabChat` action to Google Apps Script backend with multi-turn history.
    - Preserved entire legacy regex/keyword matching logic verbatim inside `window.botlabAskAIFallback(text)` as the offline/error fallback.
    - Added animated typing indicator (`showTypingIndicator` / `hideTypingIndicator`).
    - Added automatic collapse of suggestion pills (`#botlab-ai-suggestions`) during queue and parallel runs.
    - Added progressive disclosure for queue action buttons (collapsing tertiary action "Stop Queue" behind "More options").
    - Raised default panel width from 330px to 380px (with 360px floor).
  - `style.css`:
    - Guaranteed `.botlab-ai-messages { min-height: 40% !important; }` to maintain chat visibility.
    - Added CSS auto-hiding for `.botlab-ai-suggestions` when HUD or run is active.
    - Added typing indicator styling (`.botlab-typing-dots`).
    - Added progressive disclosure styling (`.botlab-msg-more`).
    - Tightened `.botlab-queue-hud` padding and added `flex-shrink: 0;`.
- **Verification**:
  - `node --check app.js` passed with code 0.

