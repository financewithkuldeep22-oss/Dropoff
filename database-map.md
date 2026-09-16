# Database & Google Sheet Schema Map

---

## 1. Hub-and-Spoke Persistence Model

Data is organized across a centralized Master Hub spreadsheet and distributed Spoke Client spreadsheets:
- **Master Hub Spreadsheet ID:** `1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU`
- **Spoke Spreadsheets:** Dynamic Google Sheets registered in `Client_Config`.

---

## 2. Master Hub Spreadsheet Schemas

### 1. Tab: `Users` (Authentication Store)
| Column | Header Name | Data Type | Validation / Values | Description |
| :--- | :--- | :--- | :--- | :--- |
| A (1) | `Username` | String | Unique, alphanumeric | Login credential identifier |
| B (2) | `Password` | String | Non-empty string | Account authentication password |
| C (3) | `Role` | String | `Admin`, `User`, `QC Executive` | Access tier determining permissions |
| D (4) | `Status` | String | `Active`, `Disabled` | Account state flag |

### 2. Tab: `Client_Config` (Connection Registry)
| Column | Header Name | Data Type | Sample Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| A (1) | `Client Name` | String | `Medibuddy Drop-Off` | Unique display name of the B2B client |
| B (2) | `Google Sheet URL / ID` | String | `1MJKP8Jet9z6V815Z...` | Target spreadsheet identifier or full URL |
| C (3) | `Tab Name (Optional)` | String | `Sample Tracking` | Specific worksheet (defaults to first tab if blank) |
| D (4) | `Status` | String | `Active`, `Inactive` | Toggles automated synchronization |

### 3. Tab: `Dashboard_Logs` (Audit Trail)
| Column | Header Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| A (1) | `Timestamp` | DateTime (IST) | Exact date and time the action occurred |
| B (2) | `Action By (User)` | String | Username of the operator who executed the change |
| C (3) | `Client Name` | String | Target client affected |
| D (4) | `Sheet Tab` | String | Physical worksheet modified |
| E (5) | `Row Number` | Integer | Source sheet row number |
| F (6) | `Patient Name` | String | Patient name |
| G (7) | `Booking ID` | String | Requisition / Booking ID assigned |
| H (8) | `Comments` | String | Remarks or reason for change |
| I (9) | `Status` | String | Operation status (`Approved`, `Rejected`, `Success`) |

### 4. Tab: `Required Tube Checklist Helper` (QC Rules)
| Column | Header Name | Data Type | Values | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| A (1) | `Test / Package Name` | String | Free text | Medical test or package name |
| B (2) | `SST Tube (Yellow Top)` | String | `YES` / `NO` | Gel separator tube required |
| C (3) | `EDTA Tube (Purple Top)`| String | `YES` / `NO` | Anticoagulant hematology tube required |
| D (4) | `Fluoride Tube (Grey)` | String | `YES` / `NO` | Glucose stabilizer tube required |
| E (5) | `Urine Container` | String | `YES` / `NO` | Sterile urine collection cup required |
| F (6) | `HIV Consent Form` | String | `YES` / `NO` | Physical signed consent form required |

---

## 3. Spoke Client Sheet Model (Example: Allohealth)

| Column | Header | Model Field | Description |
| :--- | :--- | :--- | :--- |
| A (1) | `Timestamp` | `timestamp` | Collection timestamp |
| B (2) | `Booking Date` | `bookingDate` | Scheduled booking date |
| C (3) | `Location / City` | `location` | Geographic origin |
| D (4) | `Booking ID` | `bookingId` | Unique order identifier |
| E (5) | `Patient Name` | `patientName` | Customer name |
| F (6) | `Gender` | `gender` | Male / Female / Other |
| G (7) | `Age` | `age` | Patient age |
| H (8) | `Test Name` | `testName` | Diagnostic investigation requested |
| I (9) | `Collection Time` | `colTime` | Sample collection slot |
| J (10) | `Collection Status`| `colStatus` | Collected / Cancelled |
| L (12) | `Refrigerator Photo`| `refrigeratorPhoto`| Google Drive photo link / ID |
| N (14) | `Quantity Photo` | `qtyPhoto` | Tube count verification photo link / ID |
| O (15) | `Consent Photo` | `consentPhoto` | Signed consent form photo link / ID |
| P (16) | `QC Status` | `qcStatus` | Updated by portal (`Approved` / `Rejected`) |
| Q (17) | `QC Remarks` | `qcRemarks` | Standardized rejection reason or remarks |
