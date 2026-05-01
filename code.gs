// ============================================================
//  Redcliffe Labs – B2B Drop-off Ops Dashboard
//  code.gs  –  Google Apps Script Web App Entry Point
// ============================================================

/**
 * Entry point – serves the main HTML shell.
 * Deploy as: Execute as "Me", Who has access "Anyone" (or domain).
 */
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'dashboard';

  const html = HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('Redcliffe Labs – Ops Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  return html;
}

/**
 * Helper – include an HTML partial file (lets you split large files).
 * Usage inside .html: <?!= include('styles') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
//  SERVER-SIDE UTILITIES (callable from client via google.script.run)
// ============================================================

/**
 * Saves a CSV string to the user's Google Drive.
 * @param {string} csvContent  – raw CSV text
 * @param {string} filename    – desired filename (e.g. "export_2024.csv")
 * @returns {string} shareable Drive URL
 */
function saveCsvToDrive(csvContent, filename) {
  try {
    const blob = Utilities.newBlob(csvContent, MimeType.CSV, filename);
    const file = DriveApp.createFile(blob);
    return file.getUrl();
  } catch (err) {
    return 'ERROR: ' + err.message;
  }
}

/**
 * Reads a Google Sheet by ID and returns its data as a 2-D array.
 * @param {string} spreadsheetId
 * @param {string} sheetName  – defaults to first sheet
 */
function getSheetData(spreadsheetId, sheetName) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
    if (!sheet) throw new Error('Sheet not found');
    const data = sheet.getDataRange().getValues();
    return { success: true, data: data, sheetName: sheet.getName() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Writes a 2-D array back to a Google Sheet (clears first).
 */
function writeSheetData(spreadsheetId, sheetName, data) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
    if (!sheet) throw new Error('Sheet not found');
    sheet.clearContents();
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Returns metadata for all sheets in a spreadsheet.
 */
function getSpreadsheetMeta(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheets = ss.getSheets().map(s => ({
      name: s.getName(),
      rows: s.getLastRow(),
      cols: s.getLastColumn()
    }));
    return { success: true, name: ss.getName(), sheets: sheets };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Simple ping – used by the client to verify the script is alive.
 */
function ping() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
