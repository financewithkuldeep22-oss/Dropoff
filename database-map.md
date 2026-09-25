# Database & Google Sheet Schema Map

---

## 1. Hub-and-Spoke Persistence Model

Data is organized across a centralized Master Hub spreadsheet, distributed Spoke Client spreadsheets, and dedicated operational inventory spreadsheets:
- **Master Hub Spreadsheet ID:** `1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU`
- **Spoke Spreadsheets:** Dynamic Google Sheets registered in `Client_Config`.
- **Kits & Consumables Tracking Spreadsheet ID:** `1eim2C_w97UxX8yLBrWPCIZVh02x0F7gFu8ApVjjAVxU`

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

---

## 4. Dedicated Consignment Sheet: `HCL & ALLO Clinic` (Kits & Consumables Tracker)

- **Spreadsheet ID:** `1eim2C_w97UxX8yLBrWPCIZVh02x0F7gFu8ApVjjAVxU`
- **Tab Name:** `Raw`
- **Access Level:** Internal View-Only (Synced via Apps Script `SpreadsheetApp.openById`)

| Column | Header Name | Model Field | Data Type | Sample Values | Description / Logic |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A (1) | `Request Date` | `requestDate` | Date String | `01-Jan-25`, `15-Dec-24` | Date consignment was requisitioned |
| B (2) | `Raised By` | `raisedBy` | String | `Anurag Phlebo`, `Amit Sharma` | Requisitioning phlebotomist or coordinator |
| C (3) | `Approval Date`| `approvalDate`| Date String | `02-Jan-25` | Approval timestamp by inventory ops |
| D (4) | `Delivery Date`| `deliveryDate`| Date String | `04-Jan-25` | Actual date delivered to destination clinic |
| E (5) | `ITEM Description`| `item` | String | `BLOOD COLLECTION KIT`, `URINE CUP` | Item / consumable catalog name |
| F (6) | `QTY` | `qty` | Integer | `50`, `100`, `500` | Number of consumable units dispatched |
| G (7) | `Rate` | `rate` | Float | `12.50`, `0.00` | Unit price per consumable |
| H (8) | `Amount` | `amount` | Float | `625.00` | Total billing consignment amount |
| I (9) | `Status` | `status` | Enum String | `Delivered`, `In-Transit`, `In-Process`, `Approval pending`, `Un-Delivered` | Delivery lifecycle stage with status badge |
| J (10) | `Clinic Name` | `clinic` | String | `HCL Noida Sec 24`, `Allo Bangalore` | Receiving healthcare clinic / partner hub |
| K (11) | `Clinic City` | `city` | String | `Noida`, `Bengaluru`, `Delhi` | Geographic hub for regional filtering |
| L (12) | `Clinic Address`| `address`| String | `Plot 12, Sector 24, Noida, UP` | Detailed destination delivery address |
| M (13) | `Issued By` | `issuedBy` | String | `Central Warehouse`, `Rishabh Lab` | Central lab/warehouse issuing the items |
| N (14) | `Remarks` | `remarks` | String | `Courier: GST Logistics, Docket: 70014885` | Freeform notes parsed for courier & docket |
| Virtual | `docketNo` | `docketNo` | String | `70014885` | Extracted regex from `Remarks` with 1-click copy |
| Virtual | `courierName` | `courierName`| String | `GST Logistics`, `Via Rider` | Extracted regex from `Remarks` |
