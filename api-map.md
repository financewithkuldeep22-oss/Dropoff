# API Inventory & RPC Action Catalog

---

## 1. API Protocol & Communication Standard

The frontend communicates with Google Apps Script via HTTP POST requests containing a structured JSON-RPC payload:

```json
{
  "action": "<function_name>",
  "args": ["<argument_1>", "<argument_2>", ...]
}
```

Standard response format:
```json
{
  "status": "success" | "error",
  "data": ...,
  "message": "..."
}
```

---

## 2. API Action Catalog

| Action Name | Whitelisted | Method | Timeout | Retries | Arguments | Output Payload | Calling Function | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `authenticateUser` | Yes | `POST` | 20s | 1 | `[username, password]` | `{ status: 'success', user: { username, role } }` | `AuthManager.handleLogin` | Validates credentials against `Users` sheet |
| `getDashboardLogsData` | Yes | `POST` | 28s | 0 | `[forceRefresh]` | `{ status: 'success', kpis: {...}, logs: [...], clientStats: {...} }` | `syncAllDashboardData` | Scans all configured clients and returns operational KPIs |
| `getAllohealthQCData` | Yes | `POST` | 22s | 0 | `[]` | `{ status: 'success', data: [...] }` | `loadQCQueue` | Fetches Allohealth pending sample records |
| `getGoogleDriveImageBase64` | Yes | `POST` | 25s | 1 | `[driveId]` | `{ status: 'success', mimeType: 'image/jpeg', base64Data: 'data:image/jpeg;base64,...' }` | `loadQCPhotosForBooking` | Converts Drive image to base64 Data URL to bypass 3rd-party cookie blocks |
| `updateAllohealthQC` | Yes | `POST` | 20s | 1 | `[rowNum, status, remarks, username]` | `{ status: 'success', message: '...' }` | `submitQCStatusChange` | Updates status in Allohealth sheet and writes audit log to `Dashboard_Logs` |
| `updateBookingIdInSourceSheet` | Yes | `POST` | 20s | 1 | `[clientName, sheetTab, rowNum, newBookingId, comments, operatorName]` | `{ status: 'success', message: '...' }` | `saveInlineBookingId` | Writes generated Booking ID back to client sheet and logs audit entry |
| `getPendingQCBookings` | Yes | `POST` | 15s | 1 | `[]` | `{ status: 'success', count: N, data: [...] }` | `updateQCBadgeCount` | Fast lightweight count of pending samples |
| `getAllohealthQCDropdownOptions` | Yes | `POST` | 15s | 1 | `[]` | `{ status: 'success', options: [...] }` | `initQCDropdowns` | Fetches allowed QC rejection reasons and status values |
| `getRequiredTubesMapping` | Yes | `POST` | 15s | 1 | `[]` | `{ status: 'success', mapping: {...} }` | `loadTubeRules` | Fetches test-to-tube validation rules |
| `saveClientConfigRow` | Yes | `POST` | 20s | 1 | `[clientName, sheetUrl, tabName, status]` | `{ status: 'success', message: '...' }` | `saveClientConfig` | Adds or updates a client spreadsheet connection |
| `deleteClientConfigRow` | Yes | `POST` | 20s | 1 | `[clientName]` | `{ status: 'success', message: '...' }` | `deleteClientConfig` | Deletes a client connection |
| `warmDashboardDataCache` | Yes | `POST` | 28s | 0 | `[]` | `{ status: 'success', cachedClients: N }` | Background Trigger / Admin | Pre-warms cache chunks across all client sheets |
| `botlabChat` | Yes | `POST` | 30s | 1 | `[userMessage, historyJson]` | `{ status: 'success', reply: '...' }` | `botlabAskAI` | Bot Lab Gemini AI Assistant grounded in single-source knowledge base |
| `getBotlabKnowledgeBase` | Yes | `POST` | 10s | 1 | `[]` | `{ status: 'success', kb: '...' }` | Server/Internal | Retrieves grounded knowledge base constant `BOTLAB_KB_TEXT` |
| `addManualPendingRow` | Yes | `POST` | 25s | 1 | `[clientName, tabName, rowData]` | `{ status: 'success', message: '...', rowNum: N, clientName, tabName }` | `handleManualBookingSubmit` | Mode A: Appends pending booking to client Google Sheet with `[Manual Entry]` flag |
| `getClientTabs` | Yes | `POST` | 15s | 1 | `[clientName]` | `{ status: 'success', tabs: [...] }` | `onManualBookingClientChange` | Fetches sheet tab names dynamically for selected client |
