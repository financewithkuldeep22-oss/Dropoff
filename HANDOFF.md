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

