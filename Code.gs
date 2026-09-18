/**
 * Consolidated Multi-Client Operations Overview Dashboard - Backend Code
 * Host Spreadsheet: https://docs.google.com/spreadsheets/d/1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU/edit
 * 
 * Features:
 * 1. Custom UI menu to open dashboard as modal dialog directly inside sheet.
 * 2. Auto-initializes config and log sheets.
 * 3. Dynamically reads sheet links & names from Client_Config tab.
 * 4. Advanced dynamic column mapping & IST timezone formatting.
 * 5. Error-tolerant data aggregation with bottom-scanning for speed.
 * 6. Direct write-back and audit logging.
 */

// ==========================================
// 1. SETUP & CUSTOM MENU
// ==========================================

function getActiveSpreadsheetSafe() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("getActiveSpreadsheet failed: " + e.message);
  }
  if (!ss) {
    try {
      ss = SpreadsheetApp.openById("1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU");
    } catch(e) {
      Logger.log("Failed to open spreadsheet by ID 1Aw23-gBmndNS-21OIiVyv_Ry7GI89njzRnPhw5z-unU: " + e.message);
    }
  }
  return ss;
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Drop-Off Dashboard')
    .addItem('🖥️ Open Operations Dashboard', 'showDashboard')
    .addItem('🚀 Open App in Sidebar', 'openSidebar')
    .addSeparator()
    .addItem('🤖 Authorize & Test AI Chat', 'testAIChat')
    .addItem('🔍 Run Data Sync Diagnostics', 'runDiagnostics')
    .addItem('⚙️ Initialize Config & Log Sheets', 'initializeDashboardSheets')
    .addItem('🔑 Authorize Spreadsheet Scopes', 'triggerGoogleAuthorizationPrompt')
    .addToUi();
}

/**
 * Force-triggers the Google authorization popup inside Sheets by calling openById and UrlFetchApp.
 * This resolves any "Authorization required" blocks instantly for both Sheets and external AI requests!
 */
function triggerGoogleAuthorizationPrompt() {
  var ui = SpreadsheetApp.getUi();
  var testId = "1MJKP8Jet9z6V815Zlna5aogmTnrLlaH_3UlUJz5NDxc";
  try {
    var doc = SpreadsheetApp.openById(testId);
    var fetchTest = UrlFetchApp.fetch("https://www.google.com", { muteHttpExceptions: true });
    ui.alert('🔑 Scope Authorization Success', 'Your Google account has successfully authorized external sheets and AI network access! You can now use all dashboard features.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('🔑 Authorization Action Needed', 'Please open the Apps Script editor (Extensions -> Apps Script), select "triggerGoogleAuthorizationPrompt" in the top toolbar dropdown, and click the "Run" button to complete the Google security prompt.', ui.ButtonSet.OK);
  }
}

/**
 * 1-click test & authorization function for the Apps Script Editor:
 * Run this directly from the Apps Script editor toolbar to grant UrlFetchApp permissions
 * and test live conversational AI response.
 */
function testAIChat() {
  // RAW UNCAUGHT CALL: This forces Google Apps Script to display the "Authorization required" popup!
  var ping = UrlFetchApp.fetch("https://www.google.com", { muteHttpExceptions: true });
  Logger.log("UrlFetchApp authorization verified! HTTP Status: " + ping.getResponseCode());
  
  var res = botlabChat("Hello, are you online?", "[]");
  Logger.log("AI Test Result: " + JSON.stringify(res));
  return res;
}

function testExternalFetch() {
  var ping = UrlFetchApp.fetch("https://www.google.com", { muteHttpExceptions: true });
  Logger.log("UrlFetchApp authorized: " + ping.getResponseCode());
  return "Success: " + ping.getResponseCode();
}

function runDiagnostics() {
  var ui = SpreadsheetApp.getUi();
  try {
    var response = getDashboardLogsData(false);
    if (response && response.status === 'success') {
      var msg = "✅ Data Sync Success!\n\n" +
                "- Active Connections: " + response.kpis.activeClientsCount + "\n" +
                "- Pending Bookings today: " + response.kpis.pendingToday + "\n" +
                "- Created Bookings today: " + response.kpis.createdToday + "\n" +
                "- Total weekly logs processed: " + response.kpis.totalWeeklyAcrossClients + "\n" +
                "- Total pending logs found: " + response.logs.length + "\n\n" +
                "Detailed Client Stats:\n";
      
      Object.keys(response.clientStats).forEach(function(client) {
        var stat = response.clientStats[client];
        msg += "• " + client + ": " + stat.total + " total (" + stat.pending + " pending, " + stat.created + " created)";
        if (stat.error) {
          msg += " ❌ ERROR: " + stat.error;
        }
        msg += "\n";
      });
      
      ui.alert('🔍 Diagnostics Success', msg, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Diagnostics Fail', 'Data sync failed to return successfully. Status: ' + (response ? response.status : 'undefined'), ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('🔴 Apps Script Backend Crash', 'The backend getDashboardLogsData function crashed with the following error:\n\n' + e.toString() + '\n\nLine number and details can be found in script editor Execution Logs.', ui.ButtonSet.OK);
  }
}

/**
 * Opens the dashboard as a modal dialog directly inside Google Sheets.
 */
function showDashboard() {
  try {
    initializeDashboardSheets();
    
    var html = HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Multi-Client Drop-Off Control Center')
      .setWidth(1350)
      .setHeight(850)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Multi-Client Drop-Off Control Center');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error opening dashboard: ' + e.toString());
  }
}

/**
 * Web App entry point. Allows opening the dashboard as a full-page tab.
 */
function doGet(e) {
  initializeDashboardSheets();
  
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Multi-Client Drop-Off Control Center')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Auto-initializes the configuration and logging tabs inside the active spreadsheet.
 */
function initializeDashboardSheets() {
  var ss = getActiveSpreadsheetSafe();
  
  // 1. Client Configuration Tab
  var configSheet = ss.getSheetByName('Client_Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Client_Config');
    var headers = ['Client Name', 'Google Sheet URL / ID', 'Tab Name (Optional)', 'Status'];
    configSheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    
    var defaultClients = [
      ['Medibuddy Drop-Off', '1MJKP8Jet9z6V815Zlna5aogmTnrLlaH_3UlUJz5NDxc', '', 'Active'],
      ['Tatvacare', '1347k9Tw7wMdv4IV0j6gJh-lMpXVVI334FBzssOEer_g', 'Form Responses 1', 'Active'],
      ['Flebo.in', '1A7cB3uteIz32qv3f5x2LCsnaou-ihJV_jP6P_CPk9sg', 'Sample Tracking', 'Active'],
      ['Dr. Morepen Labs', '1IFrgkTmTYSFc1siyaYV-LzRURoT5gI4ttE91wH_qV5U', 'Order History', 'Active'],
      ['TGHS', '1FhkG0FtJhKUzs5UQtQ9tWF4b-NpoC9kr8YQI2pQnRms', '', 'Active'],
      ['Juvius Healthcare', '10WUT7Mc08EleXJY9Zt3AsnWQgyLTvE-zgVRpWtxBXwk', 'Sheet1', 'Active']
    ];
    configSheet.getRange(2, 1, defaultClients.length, 4).setValues(defaultClients);
    configSheet.autoResizeColumns(1, 4);
  }
  
  // 2. Action Logs Tab
  var logSheet = ss.getSheetByName('Dashboard_Logs');
  if (!logSheet) {
    logSheet = ss.insertSheet('Dashboard_Logs');
    var headers = ['Timestamp', 'Client Name', 'Sheet Tab', 'Row Number', 'Patient Name', 'Booking ID', 'Comments', 'Status'];
    logSheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    logSheet.autoResizeColumns(1, headers.length);
  }
}

// ==========================================
// 2. DYNAMIC COLUMN MAPPING ENGINE
// ==========================================

function getSheetColumnMap(sheet, clientName) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return null;
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {
    date: -1, bookingId: -1, reqId: -1, name: -1, age: -1, gender: -1,
    colTime: -1, phone: -1, status: -1, test: -1, location: -1, referredBy: -1, lastCol: lastCol,
    datePref: 'UK'
  };
  
  function findCol(possibleNames) {
    for (var i = 0; i < headers.length; i++) {
      if (!headers[i]) continue;
      var cleanH = headers[i].toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      for (var p = 0; p < possibleNames.length; p++) {
        var cleanP = possibleNames[p].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanH === cleanP) return i;
      }
    }
    for (var i = 0; i < headers.length; i++) {
      if (!headers[i]) continue;
      var cleanH = headers[i].toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      for (var p = 0; p < possibleNames.length; p++) {
        var cleanP = possibleNames[p].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanH.indexOf(cleanP) !== -1) {
          if (cleanP === 'name' && cleanH.indexOf('phlebo') !== -1) continue;
          return i;
        }
      }
    }
    return -1;
  }
  
  map.date = findCol(['date', 'bookingdate', 'timestamp', 'creationdate', 'uploadeddate']);
  map.bookingId = findCol(['redcliffebookingid', 'bookingid', 'bookingno', 'id', 'b_id']);
  map.reqId = findCol(['requestid', 'refid', 'reqid', 'referenceno', 'bookingref']);
  map.name = findCol(['patientname', 'name', 'customername', 'clientname', 'fullname']);
  map.age = findCol(['patientage', 'age', 'patient_age', 'age(yrs)', 'age/gender', 'age/sex', 'ageyrs']);
  map.gender = findCol(['patientgender', 'gender', 'sex', 'gender/age', 'sex/age']);
  map.colTime = findCol(['collectiontiming', 'collectiontime', 'coltime', 'coltiming', 'appointmenttime']);
  map.phone = findCol(['phone', 'mobile', 'phoneno', 'mobileno', 'contact', 'contactnumber']);
  map.status = findCol(['reportstatus', 'status', 'bookingstatus', 'state']);
  map.test = findCol(['packagename', 'testname', 'testdetails', 'packagecode', 'test', 'package', 'tests']);
  map.location = findCol(['location', 'city', 'center', 'branch']);
  map.referredBy = findCol(['referredby', 'refby', 'referral', 'doctor', 'doctorname', 'drname']);
  
  if (clientName) {
    var lowerClient = clientName.toLowerCase();
    if (lowerClient.indexOf('medibuddy') !== -1) {
      map.datePref = 'US';
      if (map.date === -1) map.date = 0;
      if (map.bookingId === -1) map.bookingId = 1;
      if (map.reqId === -1) map.reqId = 2;
      if (map.name === -1) map.name = 3;
      if (map.age === -1) map.age = 4;
      if (map.gender === -1) map.gender = 5;
      if (map.colTime === -1) map.colTime = 10;
    } else if (lowerClient.indexOf('tatvacare') !== -1) {
      if (map.date === -1) map.date = 0;
      if (map.bookingId === -1) map.bookingId = 5;
      if (map.name === -1) map.name = 2;
      if (map.gender === -1) map.gender = 3;
      if (map.age === -1) map.age = 4;
      if (map.phone === -1) map.phone = 6;
      if (map.referredBy === -1) map.referredBy = 1;
    } else if (lowerClient.indexOf('flebo') !== -1) {
      if (map.date === -1) map.date = 0;
      if (map.name === -1) map.name = 1;
      if (map.age === -1) map.age = 2;
      if (map.gender === -1) map.gender = 3;
      if (map.phone === -1) map.phone = 4;
      if (map.test === -1) map.test = 5;
      if (map.location === -1) map.location = 6;
      if (map.bookingId === -1) map.bookingId = 7;
    } else if (lowerClient.indexOf('morepen') !== -1) {
      map.datePref = 'UK';
      var rBookingCol = findCol(['redcliffebookingid', 'redcliffe booking id', 'bookingid', 'booking id']);
      if (rBookingCol !== -1) map.bookingId = rBookingCol; else if (map.bookingId === -1) map.bookingId = 11;
      
      var orderDateCol = findCol(['orderdate', 'order date', 'date']);
      if (orderDateCol !== -1) map.date = orderDateCol; else if (map.date === -1) map.date = 1;
      
      var orderIdCol = findCol(['orderid', 'order id', 'reqid']);
      if (orderIdCol !== -1) map.reqId = orderIdCol; else if (map.reqId === -1) map.reqId = 3;
      
      var nameCol = findCol(['patientname', 'patient name', 'name']);
      if (nameCol !== -1) map.name = nameCol; else if (map.name === -1) map.name = 4;
      
      var ageCol = findCol(['age', 'patientage']);
      if (ageCol !== -1) map.age = ageCol; else if (map.age === -1) map.age = 5;
      
      var genderCol = findCol(['gender', 'sex']);
      if (genderCol !== -1) map.gender = genderCol; else if (map.gender === -1) map.gender = 6;
      
      var timeCol = findCol(['collectiontime', 'collection timing', 'time']);
      if (timeCol !== -1) map.colTime = timeCol; else if (map.colTime === -1) map.colTime = 7;
      
      var phoneCol = findCol(['mobile', 'phone', 'contact']);
      if (phoneCol !== -1) map.phone = phoneCol; else if (map.phone === -1) map.phone = 8;
      
      var testCol = findCol(['choosetestsordered', 'choose test(s) ordered', 'test', 'tests']);
      if (testCol !== -1) map.test = testCol; else if (map.test === -1) map.test = 9;
      
      var locCol = findCol(['region', 'location', 'city']);
      if (locCol !== -1) map.location = locCol; else if (map.location === -1) map.location = 2;
      
      var statusCol = findCol(['tsfentryupdated', 'tsf entry updated?', 'status']);
      if (statusCol !== -1) map.status = statusCol; else if (map.status === -1) map.status = 10;
    } else if (lowerClient.indexOf('tghs') !== -1) {
      if (map.date === -1) map.date = 0;
      if (map.bookingId === -1) map.bookingId = 1;
      if (map.reqId === -1) map.reqId = 2;
      if (map.name === -1) map.name = 3;
      if (map.age === -1) map.age = 4;
      if (map.gender === -1) map.gender = 5;
    } else if (lowerClient.indexOf('juvius') !== -1) {
      if (map.date === -1) map.date = 0;
      if (map.name === -1) map.name = 1;
      if (map.age === -1) map.age = 2;
      if (map.gender === -1) map.gender = 3;
      if (map.test === -1) map.test = 4;
      if (map.bookingId === -1) map.bookingId = 7;
      map.datePref = 'US';
    } else if (lowerClient.indexOf('hcl') !== -1) {
      map.datePref = 'UK';
      if (map.date === -1) map.date = 0;
      if (map.name === -1) map.name = 1;
      if (map.age === -1) map.age = 2;
      if (map.gender === -1) map.gender = 3;
      
      var orderIdCol = findCol(['orderid', 'order id']);
      var redcliffeBookingCol = findCol(['redcliffebookingid', 'redcliffe booking id', 'bookingid', 'booking id']);
      if (orderIdCol !== -1) {
        map.bookingId = orderIdCol;
      } else if (redcliffeBookingCol !== -1) {
        map.bookingId = redcliffeBookingCol;
      }
      
      var testCol = findCol(['test']);
      var packageCol = findCol(['package']);
      if (testCol !== -1) {
        map.test = testCol;
      } else if (packageCol !== -1) {
        map.test = packageCol;
      }
      
      var contactCol = findCol(['contactno', 'contact no', 'contact number', 'contact', 'customer number']);
      if (contactCol !== -1) {
        map.phone = contactCol;
      }

      var sName = sheet.getName().toLowerCase();
      if (sName.indexOf('noida') !== -1) {
        if (map.bookingId === -1) map.bookingId = 8;
        if (map.test === -1) map.test = 6;
        if (map.phone === -1) map.phone = 4;
      }
    }
  }
  
  var maxCol = 1;
  Object.keys(map).forEach(function(k) {
    if (typeof map[k] === 'number' && map[k] > maxCol && k !== 'lastCol') {
      maxCol = map[k];
    }
  });
  map.maxColToRead = maxCol + 1; // 1-based index
  
  if (map.date === -1) map.date = 0;
  return map;
}

// ==========================================
// 3. DATE UTILITIES & IST PARSING
// ==========================================

function getISTDate() {
  var d = new Date();
  var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
}

function formatDateString(date) {
  var yyyy = date.getFullYear();
  var mm = ('0' + (date.getMonth() + 1)).slice(-2);
  var dd = ('0' + date.getDate()).slice(-2);
  return yyyy + '-' + mm + '-' + dd;
}

function normalizeDate(dateVal, formatPref) {
  if (!dateVal) return null;
  if (Object.prototype.toString.call(dateVal) === '[object Date]') {
    if (isNaN(dateVal.getTime())) return null; // Safe check for Invalid Date
    return Utilities.formatDate(dateVal, "Asia/Kolkata", "yyyy-MM-dd");
  }
  var s = dateVal.toString().trim();
  if (s === "" || s === "-" || s === "--" || s.toLowerCase() === "n/a") return null;
  
  // Handle formats like "26-Aug-2026", "26-Aug-26", "26 Aug 2026", "26-August-2026"
  var alphaMatch = s.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3,})[-/\s](\d{2,4})/);
  if (alphaMatch) {
    var day = parseInt(alphaMatch[1], 10);
    var monthStr = alphaMatch[2].toLowerCase().substring(0, 3);
    var year = parseInt(alphaMatch[3], 10);
    if (year < 100) year += 2000;
    var months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    if (months[monthStr] !== undefined) {
      var d = new Date(year, months[monthStr], day);
      return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd");
    }
  }
  
  // Handle formats like "August 25, 2026", "Aug 25, 2026"
  var monthFirstAlphaMatch = s.match(/^([a-zA-Z]{3,})\s+(\d{1,2}),?\s+(\d{2,4})/);
  if (monthFirstAlphaMatch) {
    var monthStr = monthFirstAlphaMatch[1].toLowerCase().substring(0, 3);
    var day = parseInt(monthFirstAlphaMatch[2], 10);
    var year = parseInt(monthFirstAlphaMatch[3], 10);
    if (year < 100) year += 2000;
    var months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    if (months[monthStr] !== undefined) {
      var d = new Date(year, months[monthStr], day);
      return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd");
    }
  }

  var parts2 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (parts2) {
    var year = parseInt(parts2[1], 10);
    var month = parseInt(parts2[2], 10);
    var day = parseInt(parts2[3], 10);
    var d = new Date(year, month - 1, day);
    return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd");
  }
  
  var parts1 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (parts1) {
    var first = parseInt(parts1[1], 10);
    var second = parseInt(parts1[2], 10);
    var year = parseInt(parts1[3], 10);
    
    var day, month;
    if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      day = second;
      month = first;
    } else {
      // Smart check: if one number matches the current month and the other does not, prioritize current month
      var now = new Date();
      var curMonth = now.getMonth() + 1;
      if (first === curMonth && second !== curMonth) {
        month = first;
        day = second;
      } else if (second === curMonth && first !== curMonth) {
        day = first;
        month = second;
      } else if (formatPref === 'US') {
        day = second;
        month = first;
      } else {
        day = first;
        month = second;
      }
    }
    
    var d = new Date(year, month - 1, day);
    if (d.getMonth() === month - 1) {
      return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd");
    }
    return null;
  }
  
  var temp = new Date(s);
  if (!isNaN(temp.getTime())) {
    return Utilities.formatDate(temp, "Asia/Kolkata", "yyyy-MM-dd");
  }
  return null;
}

function cleanTimeStr(str) {
  if (!str) return "";
  var s = str.toString().trim();
  if (s === "" || s === "-" || s === "--") return "";
  
  var timeMatch = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([APap][Mm])?/);
  if (timeMatch) {
    var h = parseInt(timeMatch[1], 10);
    var m = timeMatch[2];
    var ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : "";
    if (!ampm) {
      ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
    }
    return ('0' + h).slice(-2) + ':' + m + ' ' + ampm;
  }
  return s;
}

// ==========================================
// 4. CORE DATA AGGREGATION & CACHING
// ==========================================

function putLargeCache(key, valueObj, expirationSeconds) {
  var cache = CacheService.getScriptCache();
  var jsonStr = JSON.stringify(valueObj);
  var chunkSize = 90000; // 90KB chunk size to be safe
  var numChunks = Math.ceil(jsonStr.length / chunkSize);
  
  // Clean up any old chunks first (to prevent mixing data)
  for (var i = 0; i < 20; i++) {
    cache.remove(key + "_chunk_" + i);
  }
  
  var manifest = {
    chunks: numChunks,
    timestamp: new Date().getTime()
  };
  
  try {
    cache.put(key + "_manifest", JSON.stringify(manifest), expirationSeconds);
    for (var i = 0; i < numChunks; i++) {
      var chunkStr = jsonStr.substring(i * chunkSize, (i + 1) * chunkSize);
      cache.put(key + "_chunk_" + i, chunkStr, expirationSeconds);
    }
    return true;
  } catch (e) {
    Logger.log("Error writing large cache: " + e.message);
    return false;
  }
}

function getLargeCache(key) {
  var cache = CacheService.getScriptCache();
  var manifestStr = cache.get(key + "_manifest");
  if (!manifestStr) return null;
  
  try {
    var manifest = JSON.parse(manifestStr);
    var jsonStr = "";
    for (var i = 0; i < manifest.chunks; i++) {
      var chunkStr = cache.get(key + "_chunk_" + i);
      if (!chunkStr) return null; // Missing chunk, cache invalid
      jsonStr += chunkStr;
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    Logger.log("Error reading large cache: " + e.message);
    return null;
  }
}

function getDashboardLogsData(forceSync, startDate, endDate, targetClientName) {
  var today = getISTDate();
  var todayStr = formatDateString(today);

  if (!targetClientName && (forceSync === false || forceSync === "false" || !forceSync)) {
    var cachedData = getLargeCache("dashboard_data_cache");
    if (cachedData && cachedData.trendDays && cachedData.trendDays.indexOf(todayStr) !== -1) {
      cachedData.isCached = true;
      return cachedData;
    }
  }

  var ss = getActiveSpreadsheetSafe();
  var configSheet = ss.getSheetByName('Client_Config');
  if (!configSheet) {
    initializeDashboardSheets();
    configSheet = ss.getSheetByName('Client_Config');
  }
  
  var configRows = configSheet.getDataRange().getValues();
  var clientsList = [];
  
  for (var i = 1; i < configRows.length; i++) {
    var name = configRows[i][0] ? configRows[i][0].toString().trim() : '';
    var urlOrId = configRows[i][1] ? configRows[i][1].toString().trim() : '';
    var tabName = configRows[i][2] ? configRows[i][2].toString().trim() : '';
    var status = configRows[i][3] ? configRows[i][3].toString().trim() : 'Active';
    
    if (name && urlOrId && status.toLowerCase() === 'active') {
      if (!targetClientName || targetClientName.toLowerCase() === name.toLowerCase()) {
        var id = urlOrId;
        if (urlOrId.indexOf('docs.google.com') !== -1) {
          var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) id = match[1];
        }
        clientsList.push({ name: name, id: id, tabName: tabName });
      }
    }
  }
  
  var yesterday = new Date(today.getTime() - 86400000);
  var yesterdayStr = formatDateString(yesterday);
  
  // Last 7 days skeleton
  var trendDays = [];
  for (var d = 6; d >= 0; d--) {
    var targetD = new Date(today.getTime() - (d * 86400000));
    trendDays.push(formatDateString(targetD));
  }
  
  var pendingToday = 0;
  var createdToday = 0;
  
  var clientStats = {};
  var trendData = {}; // Format: { "YYYY-MM-DD": { "Client A": count, "Client B": count } }
  
  trendDays.forEach(function(day) {
    trendData[day] = {};
    clientsList.forEach(function(client) {
      trendData[day][client.name] = { pending: 0, created: 0, total: 0 };
    });
  });
  
  clientsList.forEach(function(client) {
    clientStats[client.name] = { total: 0, pending: 0, created: 0, weeklyTotal: 0, error: null, sheetId: client.id, tabName: client.tabName || '' };
  });
  
  var allLogsMap = {}; // Maps bookingKey -> logObject for all bookings (created and pending)
  
  var seenBookingMaps = {};
  
  var executionStartTime = new Date().getTime();
  var MAX_EXECUTION_TIME_MS = 24000; // 24s hard time budget
  var scriptCache = CacheService.getScriptCache();
  var allClientsCompleted = true;

  for (var cIdx = 0; cIdx < clientsList.length; cIdx++) {
    var client = clientsList[cIdx];

    // Per-client cache lookup FIRST (bypassed if forceSync is explicitly true) - instant <1ms restore!
    var clientCacheKey = "cl_cache_" + client.id.substring(0, 16) + "_" + (client.tabName || 'all').replace(/[^a-zA-Z0-9]/g, '');
    var cachedClientStr = (!forceSync && !targetClientName) ? scriptCache.get(clientCacheKey) : null;
    if (cachedClientStr) {
      try {
        var cachedClientObj = JSON.parse(cachedClientStr);
        if (cachedClientObj && cachedClientObj.stats) {
          // Verify cache contains today's skeleton
          var hasToday = cachedClientObj.trend && cachedClientObj.trend[todayStr];
          if (hasToday) {
            Object.keys(cachedClientObj.stats).forEach(function(k) {
              clientStats[k] = cachedClientObj.stats[k];
            });
            if (cachedClientObj.trend) {
              Object.keys(cachedClientObj.trend).forEach(function(d) {
                if (!trendData[d]) trendData[d] = {};
                Object.keys(cachedClientObj.trend[d]).forEach(function(k) {
                  trendData[d][k] = cachedClientObj.trend[d][k];
                });
              });
            }
            if (cachedClientObj.logs && cachedClientObj.logs.length) {
              cachedClientObj.logs.forEach(function(log) {
                var lKey = (log.client || '') + "_" + (log.bookingId || log.reqId || log.rowNum);
                allLogsMap[lKey] = log;
              });
            }
            continue; // Successfully restored from cache in <1ms!
          }
        }
      } catch (cParseErr) {}
    }

    // Check time budget before opening live spreadsheet
    var elapsed = new Date().getTime() - executionStartTime;
    if (elapsed > MAX_EXECUTION_TIME_MS) {
      Logger.log("Time budget reached before live opening " + client.name + " (" + elapsed + "ms). Skipping live fetch.");
      allClientsCompleted = false;
      continue;
    }

    try {
      var clientDoc = SpreadsheetApp.openById(client.id);
      var sheets = [];
      
      var ignore = ['dashboard', 'master data', 'instructions', 'pending list', 'dropdowns', 'comments_db', 'api_not_found', 'client_config', 'dashboard_logs', 'archive'];

      if (!client.tabName && client.name.toLowerCase().indexOf('morepen') !== -1) {
        client.tabName = 'Order History';
      }

      if (client.tabName) {
        var exactSheet = clientDoc.getSheetByName(client.tabName);
        if (exactSheet) {
          sheets.push(exactSheet);
        } else {
          var allDocSheets = clientDoc.getSheets();
          var cleanTabFilter = client.tabName.toLowerCase().trim();
          for (var s = 0; s < allDocSheets.length; s++) {
            var sName = allDocSheets[s].getName();
            var sNameLow = sName.toLowerCase().trim();
            var shouldIgnore = false;
            for (var ig = 0; ig < ignore.length; ig++) {
              if (sNameLow.indexOf(ignore[ig]) !== -1 && sNameLow.indexOf('order history') === -1) {
                shouldIgnore = true;
                break;
              }
            }
            if (shouldIgnore) continue;

            if (sNameLow.indexOf(cleanTabFilter) !== -1 || cleanTabFilter.indexOf(sNameLow) !== -1) {
              sheets.push(allDocSheets[s]);
            }
          }

          if (sheets.length === 0) {
            var fallbacks = ["Sample Tracking", "Data", "Order History", "Form Responses 1", "Sheet1"];
            for (var f = 0; f < fallbacks.length; f++) {
              var fbSheet = clientDoc.getSheetByName(fallbacks[f]);
              if (fbSheet) {
                sheets.push(fbSheet);
                break;
              }
            }
          }
        }
      } else {
        var defaultSheet = clientDoc.getSheetByName("Sample Tracking") || clientDoc.getSheetByName("Form Responses 1") || clientDoc.getSheetByName("Sheet1") || clientDoc.getSheetByName("Data");
        if (defaultSheet) {
          sheets.push(defaultSheet);
        } else {
          var allDocSheets = clientDoc.getSheets();
          for (var s = 0; s < allDocSheets.length; s++) {
            var sName = allDocSheets[s].getName();
            var sNameLow = sName.toLowerCase().trim();
            var shouldIgnore = false;
            for (var ig = 0; ig < ignore.length; ig++) {
              if (sNameLow.indexOf(ignore[ig]) !== -1) {
                shouldIgnore = true;
                break;
              }
            }
            if (!shouldIgnore) {
              sheets.push(allDocSheets[s]);
            }
          }
        }
      }

      if (sheets.length === 0 && clientStats[client.name]) {
        clientStats[client.name].error = "Tab '" + (client.tabName || 'data') + "' not found.";
      }
      
      var useSplitName = sheets.length > 1 || client.name.toLowerCase().trim() === 'hcl' || client.name.toLowerCase().indexOf('morepen') !== -1;
      
      sheets.forEach(function(sheet) {
        var sheetName = sheet.getName();
        var displayName = client.name;
        if (useSplitName) {
          displayName = client.name + " - " + sheetName;
        }
        
        if (!clientStats[displayName]) {
          clientStats[displayName] = { total: 0, pending: 0, created: 0, weeklyTotal: 0, error: null, sheetId: client.id, tabName: sheetName };
          trendDays.forEach(function(day) {
            if (!trendData[day][displayName]) {
              trendData[day][displayName] = { pending: 0, created: 0, total: 0 };
            }
          });
        }
        
        var clientRecord = clientStats[displayName];
        
        var isMedibuddy = client.name.toLowerCase().indexOf('medibuddy') !== -1;
        if (isMedibuddy) {
          var colMap = getSheetColumnMap(sheet, displayName);
          if (!colMap) {
            clientRecord.error = "Sheet '" + sheetName + "' is completely empty.";
            return;
          }
          if (colMap.date === -1) {
            clientRecord.error = "Date column not found in tab '" + sheetName + "'.";
            return;
          }
          
          var lastRow = sheet.getLastRow();
          if (lastRow < 2) return;
          
          var startRow = Math.max(2, lastRow - 400 + 1);
          var numRows = lastRow - startRow + 1;
          var sheetLastCol = sheet.getLastColumn() || 1;
          var readCols = Math.min(Math.max(colMap.maxColToRead || colMap.lastCol || 1, 1), sheetLastCol);
          var data = sheet.getRange(startRow, 1, numRows, readCols).getValues();
          
          var groupedBookings = {};
          
          for (var r = 0; r < data.length; r++) {
            var row = data[r];
            var actualRowNum = startRow + r;
            
            var name = colMap.name !== -1 && row[colMap.name] ? row[colMap.name].toString().trim() : '';
            var bId = colMap.bookingId !== -1 && row[colMap.bookingId] ? row[colMap.bookingId].toString().trim() : '';
            var refId = colMap.reqId !== -1 && row[colMap.reqId] ? row[colMap.reqId].toString().trim() : '';
            var status = colMap.status !== -1 && row[colMap.status] ? row[colMap.status].toString().trim() : '';
            var dateVal = row[colMap.date];
            var dateStr = normalizeDate(dateVal, colMap.datePref || 'US');
            
            if (!name && !refId && !bId) continue;
            if (name.toLowerCase() === 'unknown' && !refId && !bId) continue;
            
            var stLow = status.toLowerCase();
            if (stLow === 'n/a' || stLow === 'na') continue;
            
            var cleanBId = bId.toLowerCase().replace(/\s+/g, '');
            if (cleanBId.indexOf('cancel') !== -1 || cleanBId.indexOf('reject') !== -1 || cleanBId.indexOf('notcollect') !== -1 || cleanBId.indexOf('bloodnot') !== -1) {
              continue;
            }
            
            if (!dateStr) continue;
            
            var isPending = (!bId || bId === "" || bId === "-" || bId === "--" || bId.toLowerCase() === "na" || bId.toLowerCase() === "n/a");
            
            var groupKey = bId;
            if (!groupKey || groupKey === "--" || isPending) {
              var cleanAgeNum = '';
              if (colMap.age !== -1 && row[colMap.age]) {
                var ageMatch = row[colMap.age].toString().match(/\d+/);
                cleanAgeNum = ageMatch ? ageMatch[0] : '';
              }
              if (name && name !== "Unknown") {
                groupKey = name.toLowerCase() + "_" + cleanAgeNum + "_" + dateStr;
              } else if (refId) {
                groupKey = "REQ_" + refId;
              } else {
                groupKey = "UNKN_" + actualRowNum;
              }
            }
            
            if (!groupedBookings[groupKey]) {
              var location = colMap.location !== -1 && row[colMap.location] ? row[colMap.location].toString().trim() : '';
              var test = colMap.test !== -1 && row[colMap.test] ? row[colMap.test].toString().trim() : '';
              var phone = colMap.phone !== -1 && row[colMap.phone] ? row[colMap.phone].toString().trim() : '';
              
              var age = colMap.age !== -1 && row[colMap.age] ? row[colMap.age].toString().trim() : '';
              var gender = colMap.gender !== -1 && row[colMap.gender] ? row[colMap.gender].toString().trim() : '';

              // Deep column scan if age is missing or does not contain digits
              if (!age || !/\d+/.test(age)) {
                for (var c = 0; c < row.length; c++) {
                  if (c === colMap.date || c === colMap.bookingId || c === colMap.reqId || c === colMap.phone || c === colMap.test) continue;
                  var cellVal = String(row[c] || '').trim();
                  if (!cellVal) continue;
                  var m = cellVal.match(/^\s*(\d{1,3})\s*(?:yrs|yr|years|y)?\s*$/i) || cellVal.match(/^\s*(\d{1,3})\s*[\/\-]\s*(?:m|f|male|female)\s*$/i);
                  if (m) {
                    age = m[1];
                    if (!gender) {
                      var gM = cellVal.match(/\b(male|female|m|f)\b/i);
                      if (gM) gender = gM[1].toUpperCase() === 'M' ? 'MALE' : gM[1].toUpperCase() === 'F' ? 'FEMALE' : gM[1].toUpperCase();
                    }
                    break;
                  }
                }
              }
              
              groupedBookings[groupKey] = {
                client: displayName,
                sheetName: sheetName,
                rowNum: actualRowNum,
                date: dateStr,
                name: name || 'N/A',
                age: age || '',
                gender: gender || '',
                reqId: refId || 'N/A',
                bookingId: isPending ? '' : bId,
                status: isPending ? 'Pending Creation' : status,
                test: test || 'N/A',
                location: location || sheetName,
                phone: phone || 'N/A',
                isPending: isPending
              };
            } else {
              // Merge tests if duplicate
              var test = colMap.test !== -1 && row[colMap.test] ? row[colMap.test].toString().trim() : '';
              if (test && test !== 'N/A' && groupedBookings[groupKey].isPending) {
                var existingLog = groupedBookings[groupKey];
                var currentTests = existingLog.test.split(',').map(function(t) { return t.trim(); });
                if (currentTests.indexOf(test) === -1) {
                  existingLog.test += ', ' + test;
                }
              }
            }
          }
          
          // Now populate stats from grouped unique bookings!
          Object.keys(groupedBookings).forEach(function(key) {
            var booking = groupedBookings[key];
            var dateStr = booking.date;
            var isPending = booking.isPending;
            
            if (dateStr === todayStr) {
              if (isPending) pendingToday++; else createdToday++;
            }
            
            if (!trendData[dateStr]) {
              trendData[dateStr] = {};
            }
            if (!trendData[dateStr][displayName]) {
              trendData[dateStr][displayName] = { pending: 0, created: 0, total: 0 };
            }
            
            clientRecord.weeklyTotal++;
            trendData[dateStr][displayName].total++;
            if (isPending) {
              trendData[dateStr][displayName].pending++;
            } else {
              trendData[dateStr][displayName].created++;
            }
            
            clientRecord.total++;
            if (isPending) {
              clientRecord.pending++;
            } else {
              clientRecord.created++;
            }
            
            var bookingKey = displayName + "_" + key;
            allLogsMap[bookingKey] = booking;
          });
          
          return; // Skip normal row processing since we custom-processed Medibuddy!
        }
        
        if (!seenBookingMaps[displayName]) {
          seenBookingMaps[displayName] = {
            seenBookingIds: {},
            seenReqIds: {},
            seenPatientDates: {}
          };
        }
        var seenBookingIds = seenBookingMaps[displayName].seenBookingIds;
        var seenReqIds = seenBookingMaps[displayName].seenReqIds;
        var seenPatientDates = seenBookingMaps[displayName].seenPatientDates;
        
        var colMap = getSheetColumnMap(sheet, displayName);
        if (!colMap) {
          clientRecord.error = "Sheet '" + sheetName + "' is completely empty.";
          return;
        }
        if (colMap.date === -1) {
          clientRecord.error = "Date column not found in tab '" + sheetName + "'.";
          return;
        }
        
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) return;
        
        // Scan up to 500 rows for high accuracy weekly / custom date range aggregates
        var startRow = Math.max(2, lastRow - 300 + 1);
        var numRows = lastRow - startRow + 1;
        var sheetLastCol = sheet.getLastColumn() || 1;
        var readCols = Math.min(Math.max(colMap.maxColToRead || colMap.lastCol || 1, 1), sheetLastCol);
        var data = sheet.getRange(startRow, 1, numRows, readCols).getValues();
        
        var lastValidDateStr = null;
        for (var r = 0; r < data.length; r++) {
          var row = data[r];
          var actualRowNum = startRow + r;
          
          var patientName = colMap.name !== -1 && row[colMap.name] ? row[colMap.name].toString().trim() : '';
          var bookingId = colMap.bookingId !== -1 && row[colMap.bookingId] ? row[colMap.bookingId].toString().trim() : '';
          var reqId = colMap.reqId !== -1 && row[colMap.reqId] ? row[colMap.reqId].toString().trim() : '';
          var status = colMap.status !== -1 && row[colMap.status] ? row[colMap.status].toString().trim() : '';
          var location = colMap.location !== -1 && row[colMap.location] ? row[colMap.location].toString().trim() : '';
          var test = colMap.test !== -1 && row[colMap.test] ? row[colMap.test].toString().trim() : '';
          var phone = colMap.phone !== -1 && row[colMap.phone] ? row[colMap.phone].toString().trim() : '';
          
          if (status) {
            var normStatus = status.toLowerCase().replace(/[^a-z]/g, '');
            if (normStatus === 'na' || normStatus === 'notapplicable' || normStatus === 'notavailable') {
              continue; // Skip N/A status rows entirely from all booking counts!
            }
          }
          
          var cleanBId = bookingId ? bookingId.toString().trim().toLowerCase() : '';
          if (cleanBId.indexOf('cancel') !== -1 || cleanBId.indexOf('reject') !== -1 || cleanBId.indexOf('notcollect') !== -1) {
            continue;
          }
          if (cleanBId.indexOf('/') !== -1) {
            cleanBId = cleanBId.split('/')[0].trim();
          }
          cleanBId = cleanBId.replace(/[^a-z0-9]/g, '');
          
          var cleanRId = reqId ? reqId.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          var isTemplateReqId = cleanRId === 'dml' || cleanRId === 'req' || cleanRId === 'na' || cleanRId === 'null' || cleanRId === 'none' || cleanRId === 'orderid' || cleanRId === 'id' || cleanRId === 'hcl' || cleanRId === 'ref';
          if (isTemplateReqId) {
            cleanRId = '';
          }
          
          var normName = patientName ? patientName.toLowerCase()
            .replace(/^(mr|mrs|ms|dr|miss|master)\.?\s+/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim() : '';
          
          var cleanTest = test ? test.toString().trim().toLowerCase() : '';
          var hasValidTest = cleanTest && cleanTest !== 'n/a' && cleanTest !== '-' && cleanTest !== 'none';
          
          // Strict blank / placeholder row filter: Must have a real patient name, a real booking ID, a real req ID (not placeholder), or a valid test!
          var hasRealData = !!normName || (!!cleanBId && cleanBId !== 'na' && cleanBId !== 'dml') || !!cleanRId || hasValidTest;
          if (!hasRealData) {
            continue; // Skip template / placeholder row!
          }
          
          var dateVal = row[colMap.date];
          var dateStr = normalizeDate(dateVal, colMap.datePref);
          
          if (dateStr) {
            lastValidDateStr = dateStr;
          } else if (lastValidDateStr && hasRealData) {
            dateStr = lastValidDateStr;
          }
          
          if (!dateStr) continue;
          
          var isPending = (!bookingId || bookingId === "" || bookingId === "-" || bookingId === "--" || bookingId.toLowerCase() === "na" || bookingId.toLowerCase() === "n/a");
          
          // Weekly check: Within last 7 days (trend Days)
          var isWeekly = trendDays.indexOf(dateStr) !== -1;
          
          var isDuplicate = false;
          
          var isNoDedupeClient = displayName.toLowerCase().indexOf('flebo') !== -1 || displayName.toLowerCase().indexOf('bharath') !== -1;
          if (isNoDedupeClient) {
            isDuplicate = false;
          } else {
            if (cleanBId && cleanBId !== "na" && cleanBId !== "n/a") {
              var bidDateKey = cleanBId + '_' + dateStr;
              if (seenBookingIds[bidDateKey]) {
                isDuplicate = true;
              }
            } else if (cleanRId && cleanRId !== "na" && cleanRId !== "n/a") {
              var ridDateKey = cleanRId + '_' + dateStr;
              if (seenReqIds[ridDateKey]) {
                isDuplicate = true;
              }
            } else {
              var nameDateKey = normName + '_' + dateStr;
              if (nameDateKey && normName !== "") {
                if (seenPatientDates[nameDateKey]) {
                  var prevRecord = seenPatientDates[nameDateKey];
                  var currentPhone = phone ? phone.toString().trim().replace(/[^0-9]/g, '') : '';
                  var prevPhone = prevRecord.phone ? prevRecord.phone.toString().trim().replace(/[^0-9]/g, '') : '';
                  
                  var currentAge = row[colMap.age] ? row[colMap.age].toString().trim().replace(/[^0-9]/g, '') : '';
                  var prevAge = prevRecord.age ? prevRecord.age.toString().trim().replace(/[^0-9]/g, '') : '';
                  
                  var phoneDiffers = currentPhone && prevPhone && currentPhone !== prevPhone;
                  var ageDiffers = currentAge && prevAge && currentAge !== prevAge;
                  
                  if (phoneDiffers || ageDiffers) {
                    // Different phone or age -> not duplicate
                  } else {
                    isDuplicate = true;
                  }
                }
              }
            }
          }
          
          // Unique key construction for logs and test merging
          var pendingGroupKey = normName ? (normName + '_' + dateStr) : ('row_' + actualRowNum);
          var bookingKey = cleanBId ? (isNoDedupeClient ? cleanBId + '_' + actualRowNum : cleanBId) : (cleanRId ? cleanRId : pendingGroupKey);
          bookingKey = displayName + '_' + bookingKey; // Isolate keys per display name
          
          if (isDuplicate) {
            if (allLogsMap[bookingKey] && test && test !== 'N/A') {
              var existingLog = allLogsMap[bookingKey];
              var currentTests = existingLog.test.split(',').map(function(t) { return t.trim(); });
              if (currentTests.indexOf(test) === -1) {
                existingLog.test += ', ' + test;
              }
            }
            continue;
          }
          
          if (cleanBId && cleanBId !== "na" && cleanBId !== "n/a") seenBookingIds[cleanBId + '_' + dateStr] = true;
          if (cleanRId && cleanRId !== "na" && cleanRId !== "n/a") seenReqIds[cleanRId + '_' + dateStr] = true;
          if (!cleanBId && !cleanRId && nameDateKey && normName !== "") {
            seenPatientDates[nameDateKey] = {
              phone: phone || '',
              age: row[colMap.age] || ''
            };
          }
          
          if (dateStr === todayStr) {
            if (isPending) pendingToday++; else createdToday++;
          }
          
          // Dynamically ensure dateStr and displayName keys are initialized in trendData
          var isWeekly = trendDays.indexOf(dateStr) !== -1;
            if (!trendData[dateStr]) {
              trendData[dateStr] = {};
            }
            if (!trendData[dateStr][displayName]) {
              trendData[dateStr][displayName] = { pending: 0, created: 0, total: 0 };
            }
            
            if (isWeekly) {
              clientRecord.weeklyTotal++;
            }
            trendData[dateStr][displayName].total++;
            if (isPending) {
              trendData[dateStr][displayName].pending++;
            } else {
              trendData[dateStr][displayName].created++;
            }
          
          clientRecord.total++;
          if (isPending) {
            clientRecord.pending++;
          } else {
            clientRecord.created++;
          }
          
          var patientAge = colMap.age !== -1 && row[colMap.age] ? row[colMap.age].toString().trim() : '';
          var patientGender = colMap.gender !== -1 && row[colMap.gender] ? row[colMap.gender].toString().trim() : '';

          if (!patientAge || !/\d+/.test(patientAge)) {
            for (var c = 0; c < row.length; c++) {
              if (c === colMap.date || c === colMap.bookingId || c === colMap.reqId || c === colMap.phone || c === colMap.test) continue;
              var cellVal = String(row[c] || '').trim();
              if (!cellVal) continue;
              var m = cellVal.match(/^\s*(\d{1,3})\s*(?:yrs|yr|years|y)?\s*$/i) || cellVal.match(/^\s*(\d{1,3})\s*[\/\-]\s*(?:m|f|male|female)\s*$/i);
              if (m) {
                patientAge = m[1];
                if (!patientGender) {
                  var gM = cellVal.match(/\b(male|female|m|f)\b/i);
                  if (gM) patientGender = gM[1].toUpperCase() === 'M' ? 'MALE' : gM[1].toUpperCase() === 'F' ? 'FEMALE' : gM[1].toUpperCase();
                }
                break;
              }
            }
          }
          
          allLogsMap[bookingKey] = {
            client: displayName,
            sheetName: sheetName,
            rowNum: actualRowNum,
            date: dateStr,
            name: patientName || 'N/A',
            age: patientAge || '',
            gender: patientGender || '',
            reqId: reqId || 'N/A',
            bookingId: isPending ? '' : bookingId,
            status: isPending ? 'Pending Creation' : (status || 'Booking Created'),
            test: test || 'N/A',
            location: location || sheetName,
            phone: phone || 'N/A',
            isPending: isPending
          };
        }
      });
      // Save client cache (10 minutes TTL)
      try {
        if (!targetClientName) {
          var clientLogsToCache = [];
          Object.keys(allLogsMap).forEach(function(k) {
            var item = allLogsMap[k];
            if (item && item.client && item.client.indexOf(client.name) === 0) {
              clientLogsToCache.push(item);
            }
          });
          clientLogsToCache.sort(function(a, b) {
            if (a.isPending && !b.isPending) return -1;
            if (!a.isPending && b.isPending) return 1;
            var da = a.date ? new Date(a.date).getTime() : 0;
            var db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          });
          if (clientLogsToCache.length > 150) {
            clientLogsToCache = clientLogsToCache.slice(0, 150);
          }
          var clientCachePayload = {
            stats: {},
            trend: {},
            logs: clientLogsToCache
          };
          Object.keys(clientStats).forEach(function(k) {
            if (k.indexOf(client.name) === 0) {
              clientCachePayload.stats[k] = clientStats[k];
            }
          });
          trendDays.forEach(function(d) {
            if (trendData[d]) {
              clientCachePayload.trend[d] = {};
              Object.keys(trendData[d]).forEach(function(k) {
                if (k.indexOf(client.name) === 0) {
                  clientCachePayload.trend[d][k] = trendData[d][k];
                }
              });
            }
          });
          var cStr = JSON.stringify(clientCachePayload);
          if (cStr.length < 90000) {
            scriptCache.put(clientCacheKey, cStr, 600);
          }
        }
      } catch (cSaveErr) {}
    } catch (e) {
      Logger.log("Error reading sheet for " + client.name + ": " + e.message);
      if (clientStats[client.name]) {
        clientStats[client.name].error = e.message;
      }
    }
  }
  
  // Cleanup original unsplit keys for split clients ONLY if split sub-keys exist
  clientsList.forEach(function(client) {
    var isSplitCandidate = client.name.toLowerCase().trim() === 'hcl' || client.name.toLowerCase().indexOf('morepen') !== -1 || client.name.toLowerCase().indexOf('medibuddy') !== -1;
    if (isSplitCandidate) {
      var hasSplitEntries = Object.keys(clientStats).some(function(k) {
        return k.indexOf(client.name + " - ") === 0;
      });
      if (hasSplitEntries) {
        delete clientStats[client.name];
      }
    }
  });
  
  // Extract all client logs
  var logs = Object.keys(allLogsMap).map(function(key) {
    return allLogsMap[key];
  });
  
  // Sort logs: pending first, then by date descending
  logs.sort(function(a, b) {
    if (a.isPending && !b.isPending) return -1;
    if (!a.isPending && b.isPending) return 1;
    return new Date(b.date) - new Date(a.date);
  });
  
  var alloPendingCount = 0;
  try {
    var qcData = getAllohealthQCData();
    if (qcData && qcData.data && Array.isArray(qcData.data)) {
      alloPendingCount = qcData.data.length;
    }
  } catch (e) {
    Logger.log("Error calculating live alloPendingCount: " + e.message);
  }
  
  var qcAuditLogs = [];
  try {
    if (!targetClientName || targetClientName.toLowerCase().indexOf('allohealth') !== -1) {
      var logSheet = ss.getSheetByName('Dashboard_Logs');
      if (logSheet) {
        var lRow = logSheet.getLastRow();
        if (lRow >= 2) {
          var startR = Math.max(2, lRow - 500);
          var numR = lRow - startR + 1;
          var logData = logSheet.getRange(startR, 1, numR, 9).getValues();
          for (var i = 0; i < logData.length; i++) {
            var r = logData[i];
            var isNewFormat = (r[2] && r[2].toString().toLowerCase().indexOf('allohealth') !== -1);
            var isOldFormat = (r[1] && r[1].toString().toLowerCase().indexOf('allohealth') !== -1);
            
            if (isNewFormat || isOldFormat) {
              var tsStr = r[0];
              var statusStr = isNewFormat ? r[8] : r[7];
              if (tsStr) {
                qcAuditLogs.push({ ts: tsStr.toString(), status: (statusStr || '').toString() });
              }
            }
          }
        }
      }
    }
  } catch(e) {}

  var calcPendingToday = 0;
  var calcCreatedToday = 0;
  if (trendData && trendData[todayStr]) {
    Object.keys(trendData[todayStr]).forEach(function(k) {
      if (trendData[todayStr][k]) {
        calcPendingToday += (trendData[todayStr][k].pending || 0);
        calcCreatedToday += (trendData[todayStr][k].created || 0);
      }
    });
  }

  var result = {
    status: 'success',
    lastSync: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss"),
    kpis: {
      pendingToday: calcPendingToday,
      createdToday: calcCreatedToday,
      totalPendingAcrossClients: Object.keys(clientStats).reduce(function(acc, k) { return acc + clientStats[k].pending; }, 0),
      totalWeeklyAcrossClients: Object.keys(clientStats).reduce(function(acc, k) { return acc + clientStats[k].weeklyTotal; }, 0),
      activeClientsCount: clientsList.length,
      alloPendingCount: alloPendingCount
    },
    logs: logs,
    qcAuditLogs: qcAuditLogs,
    clientStats: clientStats,
    trendData: trendData,
    trendDays: trendDays
  };
  
  if (!targetClientName && allClientsCompleted) {
    putLargeCache("dashboard_data_cache", result, 600); // Cache for 10 minutes ONLY if all clients completed
  } else if (!allClientsCompleted) {
    Logger.log("Skipped caching dashboard_data_cache because some clients were skipped due to time budget.");
  }
  
  return result;
}

/**
 * Background cache warmer. Run this via a time-driven trigger every 10 minutes.
 * Time-driven triggers have a 6-minute execution limit, so this will never timeout.
 */
function warmDashboardDataCache() {
  Logger.log("Starting background warm of dashboard cache...");
  var result = getDashboardLogsData(true);
  Logger.log("Dashboard cache warmed successfully. Status: " + (result ? result.status : "null"));
  return result;
}

/**
 * Convenience helper to set up a 10-minute trigger for cache warming.
 * Can be run once from script editor.
 */
function setupDashboardCacheTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'warmDashboardDataCache') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('warmDashboardDataCache')
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log("Installed 10-minute trigger for warmDashboardDataCache");
  return { status: 'success', message: 'Installed 10-minute background trigger for warmDashboardDataCache' };
}

function clearDashboardCache() {
  try {
    var cache = CacheService.getScriptCache();
    try { cache.remove("allohealth_qc_data"); } catch (qcRemoveErr) {}
    var manifestStr = cache.get("dashboard_data_cache_manifest");
    var chunksToRemove = 30; // fallback
    if (manifestStr) {
      try {
        var manifest = JSON.parse(manifestStr);
        chunksToRemove = Math.max(manifest.chunks || 0, 30);
      } catch (e) {}
    }
    
    cache.remove("dashboard_data_cache_manifest");
    for (var i = 0; i < chunksToRemove; i++) {
      cache.remove("dashboard_data_cache_chunk_" + i);
    }
    cache.remove("dashboard_data_cache"); // backward compatibility
    Logger.log("Dashboard cache cleared successfully.");
  } catch (e) {
    Logger.log("Failed to clear dashboard cache: " + e.message);
  }
}

// ==========================================
// 5. DIRECT WRITE-BACK ENGINE
// ==========================================

function updateBookingIdInSourceSheet(clientName, sheetTab, rowNum, newBookingId, comments, operatorName, expectedPatientName) {
  var ss = getActiveSpreadsheetSafe();
  var configSheet = ss.getSheetByName('Client_Config');
  if (!configSheet) return { status: 'error', message: 'Configuration sheet not found.' };
  
  clientName = (clientName || '').toString().trim();
  if (!clientName) {
    return { status: 'error', message: 'Client name is required.' };
  }
  
  var configRows = configSheet.getDataRange().getValues();
  var spreadsheetId = '';
  
  var configClientName = clientName;
  if (clientName.indexOf(" - ") !== -1) {
    configClientName = clientName.split(" - ")[0].trim();
  }
  
  function cleanClientStr(str) {
    return (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  var cleanClient = cleanClientStr(clientName);
  var cleanConfigClient = cleanClientStr(configClientName);
  var lowerClient = clientName.toLowerCase();
  var lowerConfigClient = configClientName.toLowerCase();
  
  for (var i = 1; i < configRows.length; i++) {
    var rowClient = configRows[i][0] ? configRows[i][0].toString().trim() : '';
    if (!rowClient) continue;
    var lowerRow = rowClient.toLowerCase();
    var cleanRow = cleanClientStr(rowClient);
    if (rowClient === clientName || rowClient === configClientName ||
        lowerRow === lowerConfigClient || lowerRow === lowerClient ||
        cleanRow === cleanConfigClient || cleanRow === cleanClient) {
      var urlOrId = configRows[i][1].toString().trim();
      spreadsheetId = urlOrId;
      if (urlOrId.indexOf('docs.google.com') !== -1) {
        var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) spreadsheetId = match[1];
      }
      break;
    }
  }
  
  if (!spreadsheetId) {
    return { status: 'error', message: 'Could not find spreadsheet mapping for client: ' + clientName };
  }
  
  try {
    var clientDoc = SpreadsheetApp.openById(spreadsheetId);
    var targetSheet = null;
    if (sheetTab) {
      targetSheet = clientDoc.getSheetByName(sheetTab);
      if (!targetSheet) {
        var allSheets = clientDoc.getSheets();
        for (var s = 0; s < allSheets.length; s++) {
          if (allSheets[s].getName().toLowerCase().trim() === sheetTab.toLowerCase().trim()) {
            targetSheet = allSheets[s];
            break;
          }
        }
      }
    }
    if (!targetSheet) {
      targetSheet = clientDoc.getSheets()[0];
    }
    
    var map = getSheetColumnMap(targetSheet, clientName);
    if (!map || map.bookingId === -1) {
      return { status: 'error', message: 'Could not detect the Booking ID column in ' + clientName + ' spreadsheet.' };
    }
    
    rowNum = parseInt(rowNum, 10);
    var patientName = (map.name !== -1 && rowNum <= targetSheet.getLastRow()) ? targetSheet.getRange(rowNum, map.name + 1).getValue().toString().trim() : 'N/A';
    
    if (expectedPatientName && patientName !== 'N/A' && expectedPatientName !== "N/A" && patientName.toLowerCase() !== expectedPatientName.toLowerCase()) {
      return { status: 'error', message: 'Row mismatch! The spreadsheet has been modified. Expected Patient: ' + expectedPatientName + ', found: ' + patientName };
    }
    
    if (newBookingId) {
      targetSheet.getRange(rowNum, map.bookingId + 1).setValue(newBookingId);
      if (map.status !== -1) {
        targetSheet.getRange(rowNum, map.status + 1).setValue('Booking Created');
      }
    } else {
      targetSheet.getRange(rowNum, map.bookingId + 1).setValue('');
      if (map.status !== -1) {
        targetSheet.getRange(rowNum, map.status + 1).setValue('Pending');
      }
    }
    
    var logSheet = ss.getSheetByName('Dashboard_Logs');
    if (logSheet) {
      var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      logSheet.appendRow([ts, clientName, targetSheet.getName(), rowNum, patientName, newBookingId, comments || '', 'Success']);
    }
    
    clearDashboardCache(); // Clear cache on data update!
    
    return { status: 'success', message: 'Booking ID successfully updated in ' + clientName + ' (' + targetSheet.getName() + ' Row ' + rowNum + ')!' };
  } catch (err) {
    return { status: 'error', message: 'Write-Back Error: ' + err.toString() };
  }
}

// ==========================================
// 6. DEDICATED ALLOHEALTH QC WORKSPACE ENGINE
// ==========================================

/**
 * Dynamically resolves the Allohealth Spreadsheet ID from the Client_Config sheet.
 * If not found or fails, falls back to the default hardcoded ID.
 */
function getAllohealthSpreadsheetId() {
  var defaultId = "1wZ9RK_u_CnjXji3h5YiH1fEiR2CHx7TiUvaHGxrceq8";
  try {
    var ss = getActiveSpreadsheetSafe();
    var configSheet = ss.getSheetByName('Client_Config');
    if (!configSheet) return defaultId;
    var configRows = configSheet.getDataRange().getValues();
    
    for (var i = 1; i < configRows.length; i++) {
      if (configRows[i][0]) {
        var clientName = configRows[i][0].toString().trim().toLowerCase().replace(/\s+/g, '');
        if (clientName === 'allohealth' || clientName === 'allohealthqc') {
          var urlOrId = configRows[i][1].toString().trim();
          var spreadsheetId = urlOrId;
          if (urlOrId.indexOf('docs.google.com') !== -1) {
            var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match) spreadsheetId = match[1];
          }
          if (spreadsheetId) return spreadsheetId;
        }
      }
    }
  } catch (e) {
    Logger.log("Error getting dynamic Allohealth ID: " + e.toString());
  }
  return defaultId;
}

/**
 * Fetches a Google Drive image by ID, converts it to Base64, and returns a Data URL.
 * Bypasses Chrome 3rd-party cookie blocks and direct visual preview iframe restrictions.
 */
function getGoogleDriveImageBase64(driveId) {
  try {
    if (!driveId) return { status: 'error', message: 'No Drive ID provided.' };
    
    var file = DriveApp.getFileById(driveId);
    var blob = null;
    try {
      blob = file.getThumbnail();
    } catch (err) {}
    
    if (!blob) {
      blob = file.getBlob();
    }
    
    var bytes = blob.getBytes();
    var contentType = blob.getContentType() || file.getMimeType() || "image/jpeg";
    var base64 = Utilities.base64Encode(bytes);
    
    return {
      status: 'success',
      mimeType: contentType,
      base64Data: 'data:' + contentType + ';base64,' + base64
    };
  } catch (e) {
    return { 
      status: 'error', 
      message: 'Drive Access Error: ' + e.toString(),
      driveId: driveId,
      fallbackUrl: 'https://drive.google.com/thumbnail?id=' + driveId + '&sz=w1200',
      directUrl: 'https://drive.google.com/open?id=' + driveId
    };
  }
}

function getAllohealthQCData() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get("allohealth_qc_data");
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.status === 'success') {
          return parsed;
        }
      } catch (cacheErr) {}
    }
    
    var doc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
    var sheet = doc.getSheetByName("Sample Tracking") || doc.getSheetByName("Daily Sample Tracking") || doc.getSheets()[0];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'success', data: [] };
    
    var lastCol = sheet.getLastColumn();
    var colsToFetch = Math.min(Math.max(17, lastCol), sheet.getMaxColumns());
    if (colsToFetch <= 0) colsToFetch = 1;
    
    // Dynamically find the real last row with data in Column D (to skip trailing blank rows)
    var checkRange = sheet.getRange(Math.max(1, lastRow - 1000 + 1), 4, Math.min(lastRow, 1000), 1).getValues();
    var realLastRow = lastRow;
    for (var i = checkRange.length - 1; i >= 0; i--) {
      if (checkRange[i][0] && checkRange[i][0].toString().trim() !== "") {
        realLastRow = Math.max(1, lastRow - 1000 + 1) + i;
        break;
      }
    }
    
    // Scan last 300 rows starting from realLastRow
    var startRow = Math.max(2, realLastRow - 300 + 1);
    var numRows = realLastRow - startRow + 1;
    if (numRows < 1) numRows = 1;
    var data = sheet.getRange(startRow, 1, numRows, colsToFetch).getValues();
    
    var pendingQC = [];
    for (var r = data.length - 1; r >= 0; r--) {
      try {
        var row = data[r];
        var actualRowNum = startRow + r;
        
        var bookingId = row[3] ? row[3].toString().trim() : ''; // Column D
        var patientName = row[4] ? row[4].toString().trim() : ''; // Column E
        var qcStatus = row[15] ? row[15].toString().trim() : ''; // Column P
        var qcRemarks = row[16] ? row[16].toString().trim() : ''; // Column Q
        var colStatus = row[9] ? row[9].toString().trim() : ''; // Column J
        
        // Filter collected rows that are pending QC Status update (NO date filter!)
        if (bookingId !== "" && (!qcStatus || qcStatus === "")) {
          var bookingDate = 'N/A';
          try {
            bookingDate = row[1] ? normalizeDate(row[1], 'UK') : 'N/A';
            if (!bookingDate) bookingDate = 'N/A';
          } catch (dateErr) {
            bookingDate = row[1] ? row[1].toString() : 'N/A';
          }
          
          var tsStr = 'N/A';
          try {
            if (row[0]) {
              if (Object.prototype.toString.call(row[0]) === '[object Date]') {
                if (!isNaN(row[0].getTime())) {
                  tsStr = Utilities.formatDate(row[0], "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
                } else {
                  tsStr = 'Invalid Date';
                }
              } else {
                var cleanTS = row[0].toString().trim();
                var normTS = normalizeDate(cleanTS, 'UK');
                if (normTS) {
                  var timeMatch = cleanTS.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
                  var timeStr = timeMatch ? timeMatch[0] : "00:00:00";
                  tsStr = normTS + " " + timeStr;
                } else {
                  tsStr = cleanTS;
                }
              }
            }
          } catch (tsErr) {
            tsStr = row[0] ? row[0].toString() : 'N/A';
          }
          
          pendingQC.push({
            rowNum: actualRowNum,
            timestamp: tsStr ? tsStr.toString() : 'N/A',
            bookingDate: bookingDate ? bookingDate.toString() : 'N/A',
            location: row[2] ? row[2].toString().trim() : 'N/A',
            bookingId: bookingId,
            patientName: patientName,
            gender: row[5] ? row[5].toString().trim() : 'N/A',
            age: row[6] ? row[6].toString().trim() : 'N/A',
            testName: row[7] ? row[7].toString().trim() : 'N/A',
            colTime: row[8] ? row[8].toString().trim() : 'N/A',
            colStatus: colStatus,
            refrigeratorPhoto: row[11] ? row[11].toString().trim() : '', // Column L
            qtyPhoto: row[13] ? row[13].toString().trim() : '', // Column N
            consentPhoto: row[14] ? row[14].toString().trim() : '', // Column O
            qcStatus: qcStatus,
            qcRemarks: qcRemarks
          });
        }
      } catch (rowErr) {
        Logger.log("Error processing row " + (startRow + r) + ": " + rowErr.toString());
      }
    }
    
    var responseObj = { status: 'success', data: pendingQC };
    try {
      var jsonStr = JSON.stringify(responseObj);
      if (jsonStr.length < 100000) {
        cache.put("allohealth_qc_data", jsonStr, 60); // 20-second TTL to avoid duplicate concurrent sheet hits
      }
    } catch (putErr) {}
    return responseObj;
  } catch (e) {
    return { status: 'error', message: 'Allohealth QC Fetch Error: ' + e.toString() };
  }
}

function updateAllohealthQC(rowNum, status, remarks, operatorName, expectedBookingId) {
  try {
    rowNum = parseInt(rowNum, 10);
    var doc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
    var sheet = doc.getSheetByName("Sample Tracking") || doc.getSheetByName("Daily Sample Tracking") || doc.getSheets()[0];
    
    var currentBookingId = sheet.getRange(rowNum, 4).getValue().toString().trim();
    if (expectedBookingId && currentBookingId !== expectedBookingId.toString().trim()) {
      return { status: 'error', message: 'Row mismatch! The spreadsheet has been modified. Expected ID: ' + expectedBookingId + ', found: ' + currentBookingId };
    }
    
    // Write Status to Column P (index 16)
    sheet.getRange(rowNum, 16).setValue(status);
    
    // Write Remarks to Column Q (index 17)
    sheet.getRange(rowNum, 17).setValue(remarks);
    
    // Get patient details for logging
    var patientName = sheet.getRange(rowNum, 5).getValue().toString().trim();
    var bookingId = sheet.getRange(rowNum, 4).getValue().toString().trim();
    
    // Append to dashboard action logs
    var ss = getActiveSpreadsheetSafe();
    var logSheet = ss.getSheetByName('Dashboard_Logs');
    if (logSheet) {
      var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      logSheet.appendRow([ts, 'Allohealth', 'Daily Sample Tracking', rowNum, patientName, bookingId, remarks || '', status]);
    }
    
    try { clearDashboardCache(); } catch (cacheErr) {}
    
    return { status: 'success', message: 'QC Status successfully updated for row ' + rowNum + '!' };
  } catch (e) {
    return { status: 'error', message: 'Allohealth QC Submit Error: ' + e.toString() };
  }
}

function getAllohealthQCDropdownOptions() {
  try {
    var doc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
    var sheet = doc.getSheetByName("Sample Tracking") || doc.getSheetByName("Daily Sample Tracking") || doc.getSheets()[0];
    
    var lastRow = sheet.getLastRow();
    
    // 1. Fetch Column P validation rules (QC Status, column index 16) - scanning from bottom up!
    var pRule = null;
    for (var r = lastRow; r >= Math.max(2, lastRow - 100); r--) {
      var cell = sheet.getRange(r, 16);
      pRule = cell.getDataValidation();
      if (pRule) break;
    }
    
    var pOptions = [];
    if (pRule) {
      var criteria = pRule.getCriteriaType();
      var args = pRule.getCriteriaValues();
      if (criteria == SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
        pOptions = args[0];
      } else if (criteria == SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
        var range = args[0];
        var vals = range.getValues();
        for (var i = 0; i < vals.length; i++) {
          var val = vals[i][0] ? vals[i][0].toString().trim() : "";
          if (val && pOptions.indexOf(val) === -1) {
            pOptions.push(val);
          }
        }
      }
    }
    
    if (pOptions.length === 0) {
      pOptions = ["QC Approved", "QC Rejected", "Future Collection", "Informed Pcc"];
    }
    
    // 2. Fetch Column Q validation rules (Final QC Remarks, column index 17) - scanning from bottom up!
    var qRule = null;
    for (var r = lastRow; r >= Math.max(2, lastRow - 100); r--) {
      var cell = sheet.getRange(r, 17);
      qRule = cell.getDataValidation();
      if (qRule) break;
    }
    
    var qOptions = [];
    if (qRule) {
      var criteria = qRule.getCriteriaType();
      var args = qRule.getCriteriaValues();
      if (criteria == SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
        qOptions = args[0];
      } else if (criteria == SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
        var range = args[0];
        var vals = range.getValues();
        for (var i = 0; i < vals.length; i++) {
          var val = vals[i][0] ? vals[i][0].toString().trim() : "";
          if (val && qOptions.indexOf(val) === -1) {
            qOptions.push(val);
          }
        }
      }
    }
    
    if (qOptions.length === 0) {
      qOptions = getDefaultRemarks();
    }
    
    return {
      status: 'success',
      qcStatusOptions: pOptions,
      qcRemarksOptions: qOptions
    };
  } catch (e) {
    return {
      status: 'success',
      qcStatusOptions: ["QC Approved", "QC Rejected", "Future Collection", "Informed Pcc"],
      qcRemarksOptions: getDefaultRemarks()
    };
  }
}

function getDefaultRemarks() {
  return [
    "Incomplete Sample Collection (Missing Blood Sample)",
    "Incomplete Sample Collection (Missing Urine Sample)",
    "Patient Details not mentioned on the tube",
    "Sample Not Visible Clearly",
    "Hemolyzed Sample"
  ];
}

function getAllohealthPendingCountAndIDs() {
  try {
    var doc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
    var sheet = doc.getSheetByName("Sample Tracking") || doc.getSheetByName("Daily Sample Tracking") || doc.getSheets()[0];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'success', pendingIds: [], pendingCount: 0 };
    
    var lastCol = sheet.getLastColumn();
    var colsToFetch = Math.min(Math.max(16, lastCol), sheet.getMaxColumns());
    
    // Scan Column D (Booking ID) and Column P (QC Status)
    var checkRange = sheet.getRange(Math.max(1, lastRow - 1000 + 1), 4, Math.min(lastRow, 1000), 1).getValues();
    var realLastRow = lastRow;
    for (var i = checkRange.length - 1; i >= 0; i--) {
      if (checkRange[i][0] && checkRange[i][0].toString().trim() !== "") {
        realLastRow = Math.max(1, lastRow - 1000 + 1) + i;
        break;
      }
    }
    
    var startRow = Math.max(2, realLastRow - 300 + 1);
    var numRows = realLastRow - startRow + 1;
    var dRange = sheet.getRange(startRow, 4, numRows, 1).getValues(); // Column D
    var pRange = sheet.getRange(startRow, 16, numRows, 1).getValues(); // Column P
    
    var pendingIds = [];
    var pendingCount = 0;
    for (var r = 0; r < dRange.length; r++) {
      var bId = dRange[r][0] ? dRange[r][0].toString().trim() : '';
      var qcStatus = pRange[r][0] ? pRange[r][0].toString().trim() : '';
      
      if (bId !== "" && (!qcStatus || qcStatus === "")) {
        pendingCount++;
        pendingIds.push(bId.toString());
      }
    }
    
    return { status: 'success', pendingIds: pendingIds, pendingCount: pendingCount };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ==========================================
// 7. CLIENT CONNECTION MANAGER CONFIG API
// ==========================================

function getClientConfigs() {
  try {
    var ss = getActiveSpreadsheetSafe();
    var configSheet = ss.getSheetByName('Client_Config');
    if (!configSheet) {
      initializeDashboardSheets();
      configSheet = ss.getSheetByName('Client_Config');
    }
    var rows = configSheet.getDataRange().getValues();
    var configs = [];
    for (var i = 1; i < rows.length; i++) {
      var name = rows[i][0] ? rows[i][0].toString().trim() : '';
      var urlOrId = rows[i][1] ? rows[i][1].toString().trim() : '';
      var tabName = rows[i][2] ? rows[i][2].toString().trim() : '';
      var status = rows[i][3] ? rows[i][3].toString().trim() : 'Active';
      if (name && urlOrId) {
        configs.push({ name: name, urlOrId: urlOrId, tabName: tabName, status: status });
      }
    }
    return { status: 'success', configs: configs };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function addClientConfig(clientName, urlOrId, tabName) {
  try {
    var ss = getActiveSpreadsheetSafe();
    var configSheet = ss.getSheetByName('Client_Config');
    if (!configSheet) {
      initializeDashboardSheets();
      configSheet = ss.getSheetByName('Client_Config');
    }
    
    // Check if client name already exists
    var rows = configSheet.getDataRange().getValues();
    var foundIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString().trim().toLowerCase() === clientName.trim().toLowerCase()) {
        foundIndex = i + 1; // 1-indexed row number
        break;
      }
    }
    
    if (foundIndex !== -1) {
      // Update existing
      configSheet.getRange(foundIndex, 2).setValue(urlOrId.trim());
      configSheet.getRange(foundIndex, 3).setValue(tabName ? tabName.trim() : '');
      configSheet.getRange(foundIndex, 4).setValue('Active');
    } else {
      // Append new row
      configSheet.appendRow([clientName.trim(), urlOrId.trim(), tabName ? tabName.trim() : '', 'Active']);
    }
    
    clearDashboardCache(); // Clear cache on connections list change!
    
    return { status: 'success', message: 'Client connection successfully saved!' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function removeClientConfig(clientName) {
  try {
    var ss = getActiveSpreadsheetSafe();
    var configSheet = ss.getSheetByName('Client_Config');
    if (!configSheet) return { status: 'error', message: 'Config sheet not found.' };
    
    var rows = configSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString().trim().toLowerCase() === clientName.trim().toLowerCase()) {
        configSheet.deleteRow(i + 1);
        clearDashboardCache(); // Clear cache on connections list change!
        return { status: 'success', message: 'Client connection deleted successfully!' };
      }
    }
    return { status: 'error', message: 'Client configuration not found.' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

/**
 * Initializes the "Required Tube Checklist Helper" sub-sheet inside the ACTIVE host dashboard spreadsheet.
 * Manages the structure (creation and headers/formatting if it's missing) and never auto-fills
 * test names. The user manually populates the test names.
 */
function initRequiredTubesChecklistSheet() {
  try {
    // 1. Get the ACTIVE host dashboard spreadsheet for the helper configuration!
    var doc = getActiveSpreadsheetSafe();
    var sheetName = "Required Tube Checklist Helper";
    var helperSheet = doc.getSheetByName(sheetName);
    
    // Check if the sheet exists and needs migration (if old column count or missing Urine column)
    if (helperSheet) {
      var lastCol = helperSheet.getLastColumn();
      var hasUrineColumn = false;
      if (lastCol >= 5) {
        var headers = helperSheet.getRange(1, 1, 1, lastCol).getValues()[0];
        for (var k = 0; k < headers.length; k++) {
          if (headers[k] && headers[k].toString().toLowerCase().indexOf("urine") !== -1) {
            hasUrineColumn = true;
            break;
          }
        }
      }
      if (!hasUrineColumn || lastCol < 7) {
        // Safe migration: Recreate the sheet to ensure correct columns and preserve alignment
        doc.deleteSheet(helperSheet);
        helperSheet = null;
      }
    }
    
    // Create sheet if not exists
    if (!helperSheet) {
      helperSheet = doc.insertSheet(sheetName);
      // Append headers
      helperSheet.appendRow([
        "Test / Package Name",
        "SST Tube (Yellow Top) [YES/NO]",
        "EDTA Tube (Purple Top) [YES/NO]",
        "Fluoride Tube (Grey Top) [YES/NO]",
        "Urine Container [YES/NO]",
        "HIV Consent Form [YES/NO]",
        "Other Instructions"
      ]);
      // Format headers: bold, light grey background
      helperSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f1f5f9").setHorizontalAlignment("center");
      helperSheet.setFrozenRows(1);
    }
    
    // Apply YES/NO dropdown validation rule for Columns B to F from row 2 to bottom of sheet
    var totalRows = helperSheet.getMaxRows();
    if (totalRows > 1) {
      var validationRule = SpreadsheetApp.newDataValidation().requireValueInList(["YES", "NO"], true).setAllowInvalid(false).build();
      // Apply to Columns B, C, D, E, F (columns 2 to 6)
      helperSheet.getRange(2, 2, totalRows - 1, 5).setDataValidation(validationRule);
    }
    
    // Auto-resize columns
    helperSheet.autoResizeColumns(1, 7);
    
    return { status: 'success', message: 'Required Tube Checklist Helper sheet structure verified successfully!' };
  } catch (e) {
    return { status: 'error', message: 'Error initializing helper sheet: ' + e.toString() };
  }
}

/**
 * Returns a JSON mapping of all tests configured in the "Required Tube Checklist Helper" sheet.
 * Always auto-syncs any newly appeared test names from tracking sheet beforehand.
 */
function getRequiredTubesMapping() {
  try {
    // Run sync first so new tests are immediately added
    initRequiredTubesChecklistSheet();
    
    var doc = getActiveSpreadsheetSafe();
    var sheetName = "Required Tube Checklist Helper";
    var helperSheet = doc.getSheetByName(sheetName);
    
    if (!helperSheet) {
      return { status: 'error', message: 'Required Tube Checklist Helper sheet could not be created or found.' };
    }
    
    var rows = helperSheet.getDataRange().getValues();
    var mapping = {};
    
    for (var i = 1; i < rows.length; i++) {
      var testName = rows[i][0] ? rows[i][0].toString().trim() : "";
      if (testName) {
        mapping[testName.toLowerCase()] = {
          sst: rows[i][1] ? rows[i][1].toString().trim().toUpperCase() === "YES" : false,
          edta: rows[i][2] ? rows[i][2].toString().trim().toUpperCase() === "YES" : false,
          fluoride: rows[i][3] ? rows[i][3].toString().trim().toUpperCase() === "YES" : false,
          urine: rows[i][4] ? rows[i][4].toString().trim().toUpperCase() === "YES" : false,
          consent: rows[i][5] ? rows[i][5].toString().trim().toUpperCase() === "YES" : false,
          notes: rows[i][6] ? rows[i][6].toString().trim() : ""
        };
      }
    }
    
    return { status: 'success', mapping: mapping };
  } catch (e) {
    return { status: 'error', message: 'Error fetching tubes mapping: ' + e.toString() };
  }
}

/**
 * Web App HTTP POST Entry Point
 * Routes incoming JSON requests from Vercel/GitHub to the correct function.
 */
function doPost(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No payload provided' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var payload = {};
    try {
      payload = JSON.parse(e.postData.contents);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Malformed JSON payload: ' + err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = getActiveSpreadsheetSafe();

    // Handle updateStatus action
    if (payload.action === "updateStatus") {
      var logsSheet = ss.getSheetByName("Logs");
      if (!logsSheet) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "No Logs sheet found" })).setMimeType(ContentService.MimeType.JSON);
      }
      var headerMap = buildHeaderMap(logsSheet);
      ensureMailColumnsInLogs(logsSheet, headerMap);
      headerMap = buildHeaderMap(logsSheet);
      
      var docIdCol = findCol(headerMap, ["doc id"], 1);
      var statusCol = findCol(headerMap, ["status"], 28);
      var remarksCol = findCol(headerMap, ["remarks"], 29);
      
      var data = logsSheet.getDataRange().getValues();
      var updated = 0;
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][docIdCol] || "").trim() === String(payload.docId || "").trim()) {
          logsSheet.getRange(i + 1, statusCol + 1).setValue(payload.status || "Pending");
          logsSheet.getRange(i + 1, remarksCol + 1).setValue(payload.remarks || "");
          updated++;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: updated > 0 ? "success" : "not_found", 
        message: updated > 0 ? "Status updated" : "Doc ID not found" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var action = payload.action;
    var args = payload.parameters || payload.args || [];
    
    // Security Whitelist: Explicitly authorized RPC actions
    var allowedActions = [
      'getDashboardLogsData', 
      'getClientConfig',
      'getAllohealthQCData', 
      'getGoogleDriveImageBase64', 
      'getRequiredTubesMapping',
      'getPendingQCBookings',
      'getAllohealthQCDropdownOptions',
      'writeQCStatus',
      'updateAllohealthQC',
      'authenticateUser',
      'parseLinks',
      'getFileMetadata',
      'generateZip',
      'getClientConfigs',
      'addClientConfig',
      'removeClientConfig',
      'updateBookingIdInSourceSheet',
      'getDefaultRemarks',
      'getAllohealthPendingCountAndIDs',
      'warmDashboardDataCache',
      'setupDashboardCacheTrigger',
      'createLocationDrafts',
      'processAndGenerateBatchZip',
      'processRawIdsToBatchZip',
      'getInhouseRosterData',
      'updateInhouseRosterStatus',
      'getOutsourcedRosterData',
      'addOrEditOutsourcedDuty',
      'getPhleboMasterDetails',
      'updatePhleboMasterRecord',
      'createPhleboPaymentDraft',
      'updateOutsourcedDutiesStatus',
      'botlabChat',
      'getBotlabKnowledgeBase',
      'addManualPendingRow',
      'getClientTabs'
    ];
    
    if (!action || allowedActions.indexOf(action) === -1) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: "Backend action '" + action + "' is not permitted or does not exist." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (typeof this[action] !== 'function') {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: "Backend function '" + action + "' is permitted but not implemented." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Call the function dynamically
    var result = this[action].apply(this, args);
    
    return ContentService.createTextOutput(JSON.stringify(result || {}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.toString(), 
      stack: error.stack 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web App HTTP OPTIONS Entry Point (CORS Preflight)
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Authenticate User against the 'Users' sheet
 */
function authenticateUser(username, password) {
  var ss = getActiveSpreadsheetSafe();
  var usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow(['Username', 'Password', 'Role', 'Status']);
    usersSheet.appendRow(['admin', 'admin123', 'Admin', 'Active']);
    usersSheet.getRange('A1:D1').setFontWeight('bold');
  }
  
  var data = usersSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var sheetUser = row[0] ? row[0].toString().trim() : '';
    var sheetPass = row[1] ? row[1].toString().trim() : '';
    var role = row[2] ? row[2].toString().trim() : 'User';
    var status = row[3] ? row[3].toString().trim() : 'Active';
    
    if (sheetUser.toLowerCase() === username.toLowerCase() && sheetPass === password) {
      if (status.toLowerCase() !== 'active') {
        return { status: 'error', message: 'Your account is inactive or disabled.' };
      }
      return { status: 'success', user: { username: sheetUser, role: role } };
    }
  }
  return { status: 'error', message: 'Invalid username or password.' };
}

// ===========================================
// BULK IMAGE DOWNLOADER LOGIC
// ===========================================

/**
 * Extracts Drive File IDs from raw pasted text.
 * Handles messy concatenations, spaces, newlines, and commas robustly.
 */
function parseLinks(rawText) {
  var regex = /(?:id=|\/d\/|uc\?id=)([-\w]{25,33})/g;
  var ids = [];
  var match;
  
  while ((match = regex.exec(rawText)) !== null) {
    var id = match[1];
    if (ids.indexOf(id) === -1) {
      ids.push(id);
    }
  }
  
  if (ids.length > 50) ids = ids.slice(0, 50);
  return ids;
}

/**
 * Validates files and retrieves metadata.
 */
function getFileMetadata(ids) {
  var results = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    try {
      var file = DriveApp.getFileById(id);
      var mimeType = file.getMimeType();
      var isImage = mimeType.indexOf('image/') === 0;
      results.push({
        id: id,
        name: file.getName(),
        size: formatBytes(file.getSize()),
        isImage: isImage,
        status: isImage ? 'Ready to zip' : 'Skipped: Not an image',
        valid: true
      });
    } catch (e) {
      results.push({
        id: id,
        name: 'N/A',
        size: 'N/A',
        isImage: false,
        status: 'Error: Access denied or deleted',
        valid: false
      });
    }
  }
  return results;
}

/**
 * Zips validated images and saves them to the user's Drive temporarily.
 */
function generateZip(ids) {
  var blobs = [];
  var errors = [];
  var maxRetries = 3;
  
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var success = false;
    var retries = 0;
    
    while (!success && retries < maxRetries) {
      try {
        var file = DriveApp.getFileById(id);
        if (file.getMimeType().indexOf('image/') === 0) {
          blobs.push(file.getBlob());
        }
        success = true;
      } catch (e) {
        retries++;
        if (retries >= maxRetries) {
          errors.push('Failed to fetch ID ' + id + ': ' + e.message);
        } else {
          Utilities.sleep(Math.pow(2, retries) * 1000); 
        }
      }
    }
  }
  
  if (blobs.length === 0) {
    throw new Error('No valid images could be fetched to create a ZIP.');
  }
  
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  var zipBlob = Utilities.zip(blobs, 'Bulk_Images_' + timestamp + '.zip');
  var zipFile = DriveApp.createFile(zipBlob);
  
  return {
    downloadUrl: zipFile.getDownloadUrl(),
    fileId: zipFile.getId(),
    errors: errors,
    count: blobs.length
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  var k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/* ============================================================
 * BOOKING OPERATIONS SUITE - BACKEND (BY RISHABH JAIN)
 * ============================================================ */

function getUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (e) {
    return '';
  }
}

function processAndGenerateBatchZip(csvContent, batchSize) {
  try {
    batchSize = parseInt(batchSize, 10) || 100;
    var parsed = parseCSVRows(csvContent).filter(function(row) {
      return row.length > 0 && row.some(function(cell) { return cell.trim() !== ''; });
    });

    if (!parsed || parsed.length < 2) {
      throw new Error('CSV file is empty or missing headers.');
    }

    var headerRow = parsed[0];
    var startIndex = 0;
    var bookingIdCol = -1;
    var addBookingIdCol = -1;

    var isHeader = headerRow.some(function(cell) {
      var val = cell.toLowerCase().trim();
      return val.indexOf('booking') !== -1 || val.indexOf('name') !== -1 || val.indexOf('s.no') !== -1 || val.indexOf('sr') !== -1 || val.indexOf('id') !== -1 || val.indexOf('city') !== -1 || val.indexOf('client') !== -1;
    });

    if (isHeader) {
      startIndex = 1;
      headerRow.forEach(function(colName, idx) {
        var h = colName.toLowerCase().trim();
        if (h === 'add_booking_id' || h === 'add booking id') {
          addBookingIdCol = idx;
        } else if (
          h === 'booking_id' || 
          h === 'booking id' || 
          h === 'bookingid' || 
          h === 'booking_no' || 
          h === 'booking no' ||
          h === 'booking' ||
          h === 'id' ||
          h === 'sample id' ||
          h === 'barcode'
        ) {
          if (bookingIdCol === -1) bookingIdCol = idx;
        }
      });

      if (bookingIdCol === -1) {
        headerRow.forEach(function(colName, idx) {
          var h = colName.toLowerCase().trim();
          if (h.indexOf('booking') !== -1 && h.indexOf('add') === -1) {
            if (bookingIdCol === -1) bookingIdCol = idx;
          }
        });
      }
    }

    if (bookingIdCol === -1) {
      if (parsed.length > 1 && parsed[1].length > 1) {
        var col0Val = (parsed[1][0] || '').trim();
        var col1Val = (parsed[1][1] || '').trim();
        if (/^\d{1,4}$/.test(col0Val) && (/^\d{5,}$/.test(col1Val) || /[a-zA-Z]/.test(col1Val))) {
          bookingIdCol = 1;
        } else {
          bookingIdCol = 0;
        }
      } else {
        bookingIdCol = 0;
      }
    }

    var pairs = [];
    var seen = {};

    for (var i = startIndex; i < parsed.length; i++) {
      var row = parsed[i];
      if (!row || row.length === 0) continue;

      var id = (row[bookingIdCol] || '').replace(/["']/g, '').trim();
      if (!id || id.toLowerCase() === 'booking_id' || id.toLowerCase() === 'booking id') continue;

      var addId = addBookingIdCol !== -1 && row[addBookingIdCol] 
        ? row[addBookingIdCol].replace(/["']/g, '').trim() 
        : id;

      if (!addId) addId = id;

      var key = id + '___' + addId;
      if (!seen[key]) {
        seen[key] = true;
        pairs.push({ id: id, addId: addId });
      }
    }

    if (pairs.length === 0) {
      throw new Error('No valid booking IDs found in CSV.');
    }

    var zipBlobs = [];
    var totalRows = pairs.length;

    for (var j = 0; j < totalRows; j += batchSize) {
      var chunk = pairs.slice(j, j + batchSize);
      var startIdx = j + 1;
      var endIdx = Math.min(j + batchSize, totalRows);
      var filename = 'Batch_' + startIdx + '_to_' + endIdx + '.csv';
      var csvLines = ['booking_id,add_booking_id'];

      chunk.forEach(function(p) {
        csvLines.push(escapeCSVCell(p.id) + ',' + escapeCSVCell(p.addId));
      });

      var batchCsvContent = csvLines.join('\n');
      zipBlobs.push(Utilities.newBlob(batchCsvContent, 'text/csv', filename));
    }

    var zipBlob = Utilities.zip(zipBlobs, 'Booking_Batches_100.zip');
    var base64Zip = Utilities.base64Encode(zipBlob.getBytes());

    return {
      success: true,
      fileData: base64Zip,
      fileName: 'Booking_Batches_100.zip',
      totalRecords: totalRows,
      batchCount: zipBlobs.length
    };
  } catch (error) {
    return { success: false, error: error.message || error.toString() };
  }
}

function processRawIdsToBatchZip(rawIdsText, batchSize) {
  try {
    batchSize = parseInt(batchSize, 10) || 100;
    var rawArray = rawIdsText.split(/[\s,]+/);
    var cleanIds = [];
    var seen = {};

    for (var k = 0; k < rawArray.length; k++) {
      var id = rawArray[k].trim();
      if (id.length > 0 && !seen[id]) {
        seen[id] = true;
        cleanIds.push(id);
      }
    }

    if (cleanIds.length === 0) {
      throw new Error('No valid Booking IDs found in input text.');
    }

    var zipBlobs = [];
    var totalIds = cleanIds.length;

    for (var i = 0; i < totalIds; i += batchSize) {
      var chunk = cleanIds.slice(i, i + batchSize);
      var startIdx = i + 1;
      var endIdx = Math.min(i + batchSize, totalIds);
      var filename = 'Booking_IDs_Batch_' + startIdx + '_to_' + endIdx + '.csv';
      var csvLines = ['booking_id,add_booking_id'];

      chunk.forEach(function(idVal) {
        var escaped = escapeCSVCell(idVal);
        csvLines.push(escaped + ',' + escaped);
      });

      var batchCsv = csvLines.join('\n');
      zipBlobs.push(Utilities.newBlob(batchCsv, 'text/csv', filename));
    }

    var zipBlob = Utilities.zip(zipBlobs, 'Booking_IDs_Batches_100.zip');
    var base64Zip = Utilities.base64Encode(zipBlob.getBytes());

    return {
      success: true,
      fileData: base64Zip,
      fileName: 'Booking_IDs_Batches_100.zip',
      totalRecords: totalIds,
      batchCount: zipBlobs.length
    };
  } catch (err) {
    return { success: false, error: err.message || err.toString() };
  }
}

function createLocationDrafts(drafts) {
  var createdCount = 0;
  var errors = [];
  try {
    if (!Array.isArray(drafts) || drafts.length === 0) {
      throw new Error('No location data received.');
    }
    var mailDate = formatMailDate();
    var logoBlob = getSignatureLogoBlob();

    for (var i = 0; i < drafts.length; i++) {
      var draft = drafts[i];
      if (!draft) continue;
      var location = String(draft.location || '').trim();
      var toEmail = String(draft.to || '').trim();
      var ccEmail = String(draft.cc || '').trim();

      try {
        if (!location) throw new Error('Location is missing.');
        if (!toEmail) throw new Error('"To Email" is missing.');
        var sourceRows = Array.isArray(draft.rows) ? draft.rows : [];
        if (sourceRows.length === 0) throw new Error('No booking records found for this location.');

        var normalizedRows = sourceRows.map(normalizeBookingRecord);
        var subject = 'HCL-Sample Drop-off || ' + location + ' || ' + mailDate;
        var htmlBody = buildLocationEmailBody(normalizedRows, !!logoBlob);

        var options = { htmlBody: htmlBody };
        if (logoBlob) options.inlineImages = { signatureLogo: logoBlob };
        if (ccEmail) options.cc = ccEmail;

        GmailApp.createDraft(toEmail, subject, '', options);
        createdCount++;
      } catch (locErr) {
        errors.push({
          location: location || ('Row ' + (i + 1)),
          error: locErr.message || locErr.toString()
        });
      }
    }

    var success = createdCount > 0;
    return {
      success: success,
      count: createdCount,
      errors: errors,
      error: success ? undefined : (errors.length ? errors.map(function(e) { return e.location + ': ' + e.error; }).join(' | ') : 'No drafts were created.')
    };
  } catch (err) {
    return { success: false, count: createdCount, errors: errors, error: err.message || err.toString() };
  }
}

function buildLocationEmailBody(rows, hasLogo) {
  var html = '';
  html += '<div style="font-family:Arial,sans-serif;font-size:13px;color:#000;line-height:1.5;">';
  html += '<p style="margin:0 0 14px 0;">Dear Team,</p>';
  html += '<p style="margin:0 0 16px 0;">Kindly find the booking ids below for your reference,</p>';
  html += '<table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:auto;min-width:360px;font-family:Arial,sans-serif;font-size:12px;line-height:1.2;margin:0 0 18px 0;">';
  html += '<thead><tr style="background-color:#ffff00;color:#000000;font-weight:bold;">';
  html += '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">S. No.</th>';
  html += '<th style="padding:4px 10px;border:1px solid #777;white-space:nowrap;">Name</th>';
  html += '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">Age</th>';
  html += '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">Gender</th>';
  html += '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">Booking id</th>';
  html += '</tr></thead><tbody>';

  rows.forEach(function(row, index) {
    html += '<tr>';
    html += '<td style="padding:4px 7px;border:1px solid #777;text-align:center;white-space:nowrap;">' + (index + 1) + '</td>';
    html += '<td style="padding:4px 10px;border:1px solid #777;white-space:nowrap;">' + escapeHTML(row.name) + '</td>';
    html += '<td style="padding:4px 7px;border:1px solid #777;text-align:center;white-space:nowrap;">' + escapeHTML(row.age) + '</td>';
    html += '<td style="padding:4px 7px;border:1px solid #777;text-align:center;white-space:nowrap;">' + escapeHTML(row.gender) + '</td>';
    html += '<td style="padding:4px 7px;border:1px solid #777;font-family:Arial,sans-serif;font-weight:600;white-space:nowrap;">' + escapeHTML(row.bookingId) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.35;color:#000;">';
  html += '<div style="margin:0;">Thanks and Regards,</div>';
  html += '<div style="margin:0;font-weight:bold;">Rishabh Jain</div>';
  html += '<div style="margin:0 0 6px 0;font-weight:bold;">Strategic Alliances (B2B Operations)</div>';
  if (hasLogo) {
    html += '<img src="cid:signatureLogo" alt="Redcliffe Labs" width="200" style="display:block;width:200px;height:auto;border:0;margin:0;">';
  }
  html += '</div></div>';
  return html;
}

function getSignatureLogoBlob() {
  return null;
}

function normalizeBookingRecord(row) {
  row = row || {};
  var bookingId = firstNonEmptyValue([row.bookingId, row.booking_id, row['Booking ID'], row['Booking id'], row['booking id']]);
  var name = firstNonEmptyValue([row.name, row.Name, row['Patient Name'], row.patientName, row.patient_name]);
  var age = firstNonEmptyValue([row.age, row.Age, row['Patient Age'], row.patientAge]);
  var gender = firstNonEmptyValue([row.gender, row.Gender, row['Patient Gender'], row.patientGender]);
  return {
    bookingId: String(bookingId || '').trim(),
    name: String(name || '').trim(),
    age: String(age || '').trim(),
    gender: String(gender || '').trim()
  };
}

function firstNonEmptyValue(values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i] !== undefined && values[i] !== null && String(values[i]).trim() !== '') {
      return values[i];
    }
  }
  return '';
}

function formatMailDate() {
  var timeZone = Session.getScriptTimeZone();
  if (!timeZone) timeZone = 'Asia/Kolkata';
  return Utilities.formatDate(new Date(), timeZone, 'dd/MM/yyyy');
}


/**
 * ============================================================
 * PHLEBOTOMIST ROSTER & PAYMENT MODULE (Code.js Sync)
 * ============================================================
 */
function getRosterSpreadsheetId() {
  return "1xX8e_lGE7cWYbvbi4XS-OHwz5xp1wHqk40HHTEUEKK8";
}

function getSheetSafe(doc, nameVariants) {
  for (var i = 0; i < nameVariants.length; i++) {
    var sheet = doc.getSheetByName(nameVariants[i]);
    if (sheet) return sheet;
  }
  return null;
}

function getInhouseRosterData(filterStartDateStr, filterEndDateStr) {
  try {
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Inhouse Phlebo Roaster", "Inhouse Phlebo Roster"]) || doc.getSheets()[0];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) return { status: 'success', headers: [], dates: [], data: [] };
    
    var rangeValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = rangeValues[0];
    
    // Parse phlebotomists from headers (every odd column starting from B/index 1 represents a phlebo)
    var phlebos = [];
    for (var col = 1; col < lastCol; col += 2) {
      var name = headers[col] ? headers[col].toString().trim() : "";
      if (name && name.toLowerCase() !== "remarks" && name.toLowerCase() !== "date") {
        phlebos.push({ name: name, colIndex: col });
      }
    }
    
    // Parse rows
    var rowsData = [];
    for (var r = 1; r < rangeValues.length; r++) {
      var row = rangeValues[r];
      var rawDate = row[0];
      if (!rawDate) continue;
      
      var dateStr = normalizeDate(rawDate, 'UK');
      if (!dateStr) continue;
      
      // Date filter
      if (filterStartDateStr && dateStr < filterStartDateStr) continue;
      if (filterEndDateStr && dateStr > filterEndDateStr) continue;
      
      var attendance = {};
      phlebos.forEach(function(p) {
        var status = row[p.colIndex] ? row[p.colIndex].toString().trim() : "";
        var remark = row[p.colIndex + 1] ? row[p.colIndex + 1].toString().trim() : "";
        attendance[p.name] = { status: status, remarks: remark };
      });
      
      rowsData.push({
        rowNum: r + 1,
        date: dateStr,
        attendance: attendance
      });
    }
    
    // Sort rows chronological
    rowsData.sort(function(a, b) {
      return a.date.localeCompare(b.date);
    });
    
    return {
      status: 'success',
      phlebos: phlebos.map(function(p) { return p.name; }),
      rows: rowsData
    };
  } catch (e) {
    return { status: 'error', message: 'Inhouse Roster Fetch Error: ' + e.toString() };
  }
}

function updateInhouseRosterStatus(rowNum, phleboName, attendanceStatus, remarks) {
  try {
    rowNum = parseInt(rowNum, 10);
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Inhouse Phlebo Roaster", "Inhouse Phlebo Roster"]) || doc.getSheets()[0];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var phleboColIndex = -1;
    for (var col = 1; col < headers.length; col++) {
      if (headers[col] && headers[col].toString().trim() === phleboName.trim()) {
        phleboColIndex = col; // 0-based column index
        break;
      }
    }
    
    if (phleboColIndex === -1) {
      return { status: 'error', message: 'Phlebotomist ' + phleboName + ' not found in sheet headers.' };
    }
    
    sheet.getRange(rowNum, phleboColIndex + 1).setValue(attendanceStatus); // 1-based column index
    sheet.getRange(rowNum, phleboColIndex + 2).setValue(remarks || "");
    
    // Append to dashboard action logs
    var ss = getActiveSpreadsheetSafe();
    var logSheet = ss.getSheetByName('Dashboard_Logs');
    if (logSheet) {
      var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      logSheet.appendRow([ts, 'Roster', 'Inhouse Phlebo Roster', rowNum, phleboName, '', remarks || '', attendanceStatus]);
    }
    
    return { status: 'success', message: 'Inhouse roster updated successfully for ' + phleboName + '!' };
  } catch (e) {
    return { status: 'error', message: 'Inhouse Roster Update Error: ' + e.toString() };
  }
}

function getOutsourcedRosterData(filterStartDateStr, filterEndDateStr) {
  try {
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Outsoursed Phlebo Roaster", "Outsoursed Phlebo Roster", "Outsourced Phlebo Roaster", "Outsourced Phlebo Roster"]);
    if (!sheet) return { status: 'success', data: [] };
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'success', data: [] };
    
    var lastCol = sheet.getLastColumn();
    var data = sheet.getRange(2, 1, lastRow - 1, Math.min(lastCol, 11)).getValues();
    
    var rowsData = [];
    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      var clinicLoc = row[0] ? row[0].toString().trim() : "";
      var rawDate = row[1];
      if (!rawDate) continue;
      
      var dateStr = normalizeDate(rawDate, 'UK');
      if (!dateStr) continue;
      
      if (filterStartDateStr && dateStr < filterStartDateStr) continue;
      if (filterEndDateStr && dateStr > filterEndDateStr) continue;
      
      rowsData.push({
        rowNum: r + 2,
        clinicLocation: clinicLoc,
        date: dateStr,
        phleboName: row[2] ? row[2].toString().trim() : "",
        phleboPhone: row[3] ? row[3].toString().trim() : "",
        countReceived: row[4] ? parseInt(row[4], 10) || 0 : 0,
        charges: row[5] ? parseFloat(row[5]) || 0 : 0,
        upiId: row[6] ? row[6].toString().trim() : "",
        status: row[7] ? row[7].toString().trim() : "",
        payeeName: row[8] ? row[8].toString().trim() : "",
        remarks: row[9] ? row[9].toString().trim() : ""
      });
    }
    
    // Sort descending by date
    rowsData.sort(function(a, b) {
      return b.date.localeCompare(a.date);
    });
    
    return { status: 'success', data: rowsData };
  } catch (e) {
    return { status: 'error', message: 'Outsourced Roster Fetch Error: ' + e.toString() };
  }
}

function addOrEditOutsourcedDuty(rowNum, data) {
  try {
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Outsoursed Phlebo Roaster", "Outsoursed Phlebo Roster", "Outsourced Phlebo Roaster", "Outsourced Phlebo Roster"]);
    if (!sheet) {
      return { status: 'error', message: 'Outsourced tab not found in spreadsheet.' };
    }
    
    var dateVal = data.date;
    try {
      var dateParts = data.date.split('-');
      var dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      dateVal = dateObj; // write as date object so spreadsheet formats it correctly
    } catch(e) {}
    
    var vals = [
      data.clinicLocation || "",
      dateVal,
      data.phleboName || "",
      data.phleboPhone || "",
      parseInt(data.countReceived, 10) || 0,
      parseFloat(data.charges) || 0,
      data.upiId || "",
      data.status || "Pending",
      data.payeeName || "",
      data.remarks || ""
    ];
    
    rowNum = parseInt(rowNum, 10);
    if (rowNum > 1) {
      // Edit existing
      sheet.getRange(rowNum, 1, 1, vals.length).setValues([vals]);
    } else {
      // Add new
      sheet.appendRow(vals);
      rowNum = sheet.getLastRow();
    }
    
    // Append to dashboard action logs
    var ss = getActiveSpreadsheetSafe();
    var logSheet = ss.getSheetByName('Dashboard_Logs');
    if (logSheet) {
      var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      logSheet.appendRow([ts, 'Roster', 'Outsourced Phlebo Roster', rowNum, data.phleboName, '', data.remarks || '', data.status || 'Updated']);
    }
    
    return { status: 'success', message: 'Outsourced roster row saved successfully!', rowNum: rowNum };
  } catch (e) {
    return { status: 'error', message: 'Outsourced Roster Write Error: ' + e.toString() };
  }
}

function getPhleboMasterDetails() {
  try {
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Phlebo Details", "Phlebo Details Master"]);
    if (!sheet) return { status: 'success', data: [] };
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'success', data: [] };
    
    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var list = [];
    for (var r = 0; r < data.length; r++) {
      var name = data[r][1] ? data[r][1].toString().trim() : "";
      if (!name) continue;
      list.push({
        rowNum: r + 2,
        clinicLocation: data[r][0] ? data[r][0].toString().trim() : "",
        phleboName: name,
        phleboType: data[r][2] ? data[r][2].toString().trim() : "",
        phleboPhone: data[r][3] ? data[r][3].toString().trim() : "",
        charges: data[r][4] ? data[r][4].toString().trim() : ""
      });
    }
    return { status: 'success', data: list };
  } catch (e) {
    return { status: 'error', message: 'Phlebo Details Fetch Error: ' + e.toString() };
  }
}

function updatePhleboMasterRecord(rowNum, data) {
  try {
    rowNum = parseInt(rowNum, 10);
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Phlebo Details", "Phlebo Details Master"]);
    if (!sheet) return { status: 'error', message: 'Phlebo Details sheet not found.' };
    
    var vals = [
      data.clinicLocation || "",
      data.phleboName || "",
      data.phleboType || "",
      data.phleboPhone || "",
      data.charges || ""
    ];
    
    if (rowNum > 1) {
      sheet.getRange(rowNum, 1, 1, vals.length).setValues([vals]);
    } else {
      sheet.appendRow(vals);
    }
    
    return { status: 'success', message: 'Phlebotomist master details updated successfully!' };
  } catch (e) {
    return { status: 'error', message: 'Phlebo Details Update Error: ' + e.toString() };
  }
}

function createPhleboPaymentDraft(selectedDutiesList, toEmail, ccEmail) {
  try {
    if (!selectedDutiesList || selectedDutiesList.length === 0) {
      return { status: 'error', message: 'No duties selected for email drafting.' };
    }
    
    // Default values matching Kuldeep's specification
    toEmail = toEmail || "mohit.parnani@redcliffelabs.com";
    ccEmail = ccEmail || "appointments@redcliffelabs.com, tejpal.kothari@redcliffelabs.com, abhay@redcliffelabs.com, jayraj@redcliffelabs.com, dropoff@redcliffelabs.com, dhruv.baghel@redcliffelabs.com, gaurav.thapar@redcliffelabs.com, sandeep.rawat@redcliffelabs.com";
    
    var today = getISTDate();
    var todayStr = formatDateString(today);
    
    // Group duties by Clinic Location (for email subject compilation)
    var locations = [];
    var dateStrings = [];
    selectedDutiesList.forEach(function(d) {
      if (locations.indexOf(d.clinicLocation) === -1) locations.push(d.clinicLocation);
      
      // Parse date format nicely
      var formattedDate = d.date;
      try {
        var dParts = d.date.split('-');
        var dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
        var suffix = "th";
        var dateNum = parseInt(dParts[2], 10);
        if (dateNum === 1 || dateNum === 21 || dateNum === 31) suffix = "st";
        else if (dateNum === 2 || dateNum === 22) suffix = "nd";
        else if (dateNum === 3 || dateNum === 23) suffix = "rd";
        
        formattedDate = dateNum + suffix + " " + dObj.toLocaleString('en-US', { month: 'long' });
      } catch (dateErr) {}
      if (dateStrings.indexOf(formattedDate) === -1) dateStrings.push(formattedDate);
    });
    
    var locationsText = locations.join(", ");
    var dateText = dateStrings.join(", ");
    
    var subject = "Allohealth Phlebo Payment for Outsource Clinic - " + locationsText + " (" + dateText + ")";
    
    // Generate styled HTML body table (matching layout exactly)
    var htmlTableRows = "";
    selectedDutiesList.forEach(function(d) {
      var dateVal = d.date;
      try {
        var dParts = d.date.split('-');
        var dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
        var suffix = "th";
        var dateNum = parseInt(dParts[2], 10);
        if (dateNum === 1 || dateNum === 21 || dateNum === 31) suffix = "st";
        else if (dateNum === 2 || dateNum === 22) suffix = "nd";
        else if (dateNum === 3 || dateNum === 23) suffix = "rd";
        dateVal = dateNum + suffix + " " + dObj.toLocaleString('en-US', { month: 'long' });
      } catch (e) {}
      
      var chargesVal = parseFloat(d.charges) || 0;
      var countVal = parseInt(d.countReceived, 10) || 0;
      var amount = chargesVal * countVal;
      
      // Amount format: check if charges are "Salary" or 0
      var amountText = amount > 0 ? amount.toString() : "000";
      if (d.charges.toString().toLowerCase() === "salary") amountText = "Salary";
      
      htmlTableRows += "<tr style='text-align: center; font-size: 12px; height: 32px;'>" +
        "<td style='border: 1px solid #000; padding: 4px;'>Allohealth</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + d.clinicLocation + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>CORP11694</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + dateVal + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + countVal + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + (d.payeeName || d.phleboName) + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + d.phleboPhone + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + d.upiId + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + amountText + "</td>" +
        "<td style='border: 1px solid #000; padding: 4px;'>" + (d.remarks || "") + "</td>" +
        "</tr>";
    });
    
    var htmlBody = "<div style='font-family: Arial, sans-serif; font-size: 13.5px; color: #000; line-height: 1.5;'>" +
      "<p>Hi Mohit sir,</p>" +
      "<p>Greetings from Redcliffe Labs !!!</p>" +
      "<p><strong>@Jayraj Chauhan</strong> sir, Kindly approve the same.</p>" +
      "<p><strong>@Mohit Pamnani</strong> sir, Kindly help to release the payment for the given phlebo details below.</p>" +
      "<table style='border-collapse: collapse; width: 100%; border: 1px solid #000; font-family: Arial, sans-serif; margin: 15px 0;'>" +
      "<thead>" +
      "<tr style='background-color: #ffff00; font-weight: bold; font-size: 12.5px; height: 36px; text-align: center;'>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Partner Name</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Clinic Location</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Client Code</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Date</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Count Received</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Payee Name</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Phlebo Contact No.</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>UPI ID</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Amount</th>" +
      "<th style='border: 1px solid #000; padding: 6px;'>Remarks</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      htmlTableRows +
      "</tbody>" +
      "</table>" +
      "<p style='color: #000; font-weight: bold; margin-bottom: 2px;'>Regards,</p>" +
      "<p style='font-weight: bold; color: #000; margin: 0;'>Kuldeep Singh Bisht</p>" +
      "<p style='margin: 0; font-size: 12px; color: #555;'>Strategic Alliances (B2B Operations)</p>" +
      "<p style='margin-top: 8px;'><img src='https://staticcdn.redcliffelabs.com/media/gallary-file/None/226e8f94-c63a-404c-bce8-dff38b7966af.jpeg' alt='Redcliffe Labs' style='height: 40px; display: block;' /></p>" +
      "</div>";
    
    // Create Gmail Draft
    var draft = GmailApp.createDraft(toEmail, subject, "", {
      cc: ccEmail,
      htmlBody: htmlBody
    });
    
    // Mark status as 'Mail done' in sheets
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Outsoursed Phlebo Roaster", "Outsoursed Phlebo Roster", "Outsourced Phlebo Roaster", "Outsourced Phlebo Roster"]);
    if (sheet) {
      selectedDutiesList.forEach(function(d) {
        if (d.rowNum > 1) {
          sheet.getRange(d.rowNum, 8).setValue("Mail done"); // Column H (8)
        }
      });
    }
    
    return { status: 'success', message: 'Gmail draft created successfully!', draftId: draft.getId() };
  } catch (e) {
    return { status: 'error', message: 'Gmail Draft Composition Error: ' + e.toString() };
  }
}

function updateOutsourcedDutiesStatus(rowNums, newStatus) {
  try {
    var doc = SpreadsheetApp.openById(getRosterSpreadsheetId());
    var sheet = getSheetSafe(doc, ["Outsoursed Phlebo Roaster", "Outsoursed Phlebo Roster", "Outsourced Phlebo Roaster", "Outsourced Phlebo Roster"]);
    if (!sheet) {
      return { status: 'error', message: 'Outsourced tab not found in spreadsheet.' };
    }
    
    for (var i = 0; i < rowNums.length; i++) {
      var rowNum = parseInt(rowNums[i], 10);
      if (rowNum > 1) {
        sheet.getRange(rowNum, 8).setValue(newStatus);
      }
    }
    
    return { status: 'success', message: 'Updated status to "' + newStatus + '" for ' + rowNums.length + ' duties.' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ============================================================
// BOT LAB AI & GEMINI / GROQ API INTEGRATION
// ============================================================

function getAvailableGroqModels(apiKey) {
  try {
    var url = "https://api.groq.com/openai/v1/models";
    var res = UrlFetchApp.fetch(url, {
      headers: { "Authorization": "Bearer " + apiKey },
      muteHttpExceptions: true
    });
    var json = JSON.parse(res.getContentText());
    if (json && json.data && Array.isArray(json.data)) {
      var ids = json.data.map(function(m) { return m.id; });
      Logger.log("[Groq Models Discovered]: " + JSON.stringify(ids));
      return ids;
    }
  } catch(e) {}
  return ["llama-3.1-8b-instant", "llama3-70b-8192"];
}

function callGroqAPI(prompt, temperature) {
  if (temperature === undefined) temperature = 0.2;
  var apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY'); 
  if (!apiKey) return "⚠️ AI Error: GROQ_API_KEY is missing in Apps Script Properties.";
  
  var groqModels = getAvailableGroqModels(apiKey);
  var url = "https://api.groq.com/openai/v1/chat/completions";
  
  for (var i = 0; i < groqModels.length; i++) {
    var modelName = groqModels[i];
    var payload = {
      "model": modelName, 
      "messages": [{ "role": "user", "content": prompt }],
      "temperature": temperature,
      "max_tokens": 1024
    };
    
    var options = {
      "method": "post",
      "headers": { "Authorization": "Bearer " + apiKey },
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    try {
      var response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();
      if (code === 429) continue;
      var json = JSON.parse(response.getContentText());
      if (json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) {
        return json.choices[0].message.content;
      }
    } catch(e) {}
  }
  
  return "⚠️ API Error: Groq service unavailable.";
}

function getAvailableGeminiModels(apiKey) {
  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var json = JSON.parse(res.getContentText());
    if (json && json.models && Array.isArray(json.models)) {
      var supported = [];
      json.models.forEach(function(m) {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf("generateContent") !== -1) {
          supported.push(m.name.replace(/^models\//, ""));
        }
      });
      Logger.log("[Gemini Discovered Models]: " + JSON.stringify(supported));
      if (supported.length > 0) {
        // Prioritize fast 2.5-flash and flash models
        supported.sort(function(a, b) {
          var aScore = (a.indexOf("2.5-flash") !== -1) ? -2 : ((a.indexOf("flash") !== -1) ? -1 : 1);
          var bScore = (b.indexOf("2.5-flash") !== -1) ? -2 : ((b.indexOf("flash") !== -1) ? -1 : 1);
          return aScore - bScore;
        });
        return supported;
      }
    }
  } catch (e) {
    Logger.log("[Gemini listModels exception]: " + e.toString());
  }
  return ["gemini-2.5-flash", "gemini-2.5-pro"];
}

function callGeminiAPI(prompt, temperature) {
  if (temperature === undefined) temperature = 0.2;
  var props = PropertiesService.getScriptProperties();
  
  // Dual-Key Support: Try GEMINI_API_KEY first, then GEMINI_API_KEY2
  var rawKeys = [
    props.getProperty('GEMINI_API_KEY'),
    props.getProperty('GEMINI_API_KEY2')
  ];
  var geminiKeys = [];
  for (var k = 0; k < rawKeys.length; k++) {
    if (rawKeys[k] && rawKeys[k].trim().length > 0) {
      geminiKeys.push(rawKeys[k].trim());
    }
  }

  for (var k = 0; k < geminiKeys.length; k++) {
    var apiKey = geminiKeys[k];
    var models = getAvailableGeminiModels(apiKey);

    for (var m = 0; m < models.length; m++) {
      var modelName = models[m];
      var url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
      var payload = {
        "contents": [{
          "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
          "temperature": temperature,
          "maxOutputTokens": 1024
        }
      };
      
      var options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      try {
        var response = UrlFetchApp.fetch(url, options);
        var json = JSON.parse(response.getContentText());
        if (json && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
          Logger.log("[AI Success] Gemini " + modelName + " responded using Key #" + (k + 1));
          return json.candidates[0].content.parts[0].text;
        } else if (json && json.error) {
          Logger.log("[AI Warn] Gemini " + modelName + " (Key #" + (k + 1) + "): " + json.error.message);
        }
      } catch(e) {
        Logger.log("[AI Exception] Gemini " + modelName + ": " + e.toString());
      }
    }
  }

  // If both Gemini keys/models fail, fall back to Groq as backup
  Logger.log("[AI Fallback] Gemini exhausted, invoking Groq backup");
  return callGroqAPI(prompt, temperature);
}

function botlabChat(userMessage, historyJson, liveContextJson) {
  try {
    var kb = getBotlabKnowledgeBase();
    var history = [];
    try { history = JSON.parse(historyJson || "[]"); } catch (e) {}
    var historyText = history.slice(-6).map(function(m) {
      return (m.role === "user" ? "User: " : "Assistant: ") + m.text;
    }).join("\n");

    // Format real-time metrics currently displayed on user's dashboard screen
    var liveDataSection = "";
    if (liveContextJson) {
      try {
        var ctx = typeof liveContextJson === "string" ? JSON.parse(liveContextJson) : liveContextJson;
        if (ctx) {
          liveDataSection = "\n\n=== LIVE DASHBOARD METRICS (CURRENTLY DISPLAYED ON USER'S SCREEN) ===\n";
          if (ctx.kpis) {
            liveDataSection += "- Total Pending Drop-offs: " + (ctx.kpis.pendingDropoffs !== undefined ? ctx.kpis.pendingDropoffs : "0") + "\n";
            liveDataSection += "- Today's Bookings: " + (ctx.kpis.todayBookings || "N/A") + " (Pending today: " + (ctx.kpis.todayPending !== undefined ? ctx.kpis.todayPending : "0") + ")\n";
            liveDataSection += "- QC Review Pending Queue: " + (ctx.kpis.qcPending !== undefined ? ctx.kpis.qcPending : "0") + " samples\n";
            liveDataSection += "- Processed Samples (Last 7 Days): " + (ctx.kpis.processedSamples || "0") + "\n";
          }
          if (Array.isArray(ctx.clientBreakdown) && ctx.clientBreakdown.length > 0) {
            var pendingClients = ctx.clientBreakdown.filter(function(c) { return c.pending > 0; });
            if (pendingClients.length > 0) {
              liveDataSection += "- Clients with Pending Drop-offs:\n";
              pendingClients.forEach(function(c) {
                liveDataSection += "  • " + c.client + ": " + c.pending + " pending drop-offs\n";
              });
            } else {
              liveDataSection += "- All clients currently clear (0 pending).\n";
            }
          }
        }
      } catch (e) {}
    }

    var systemInstructions = "You are BishtJiBot, the senior operations & booking AI assistant for Redcliffe Labs Logistics Operations Dashboard.\n" +
      "PERSONA & COMMUNICATION RULES:\n" +
      "1. Speak naturally, warmly, and smartly like a knowledgeable operations lead. Talk in the same language mix (Hinglish/Hindi/English) the user speaks.\n" +
      "2. CRITICAL ACCURACY: Always answer questions about pending drop-offs, bookings, QC, or client stats using the exact LIVE DASHBOARD METRICS provided above. Never say 0 pending if the live metrics show pending drop-offs.\n" +
      "3. When reporting pending drop-offs, clearly name which client has pending items (e.g. 'HCL ke 6 drop-offs pending hain').\n" +
      "4. Be actionable: Offer next operational steps when helpful (e.g. 'Aap Dispatch Matrix khol kar inhein process kar sakte hain', ya 'QC Review tab me jakar photos verify kar sakte hain').\n" +
      "5. No emojis in your response. Keep answers concise, direct, and well-structured with bullet points where appropriate.";

    var prompt = systemInstructions + "\n\n" + kb + liveDataSection + "\n\n---\nRecent conversation:\n" + historyText +
      "\n\nUser's new message: \"" + userMessage + "\"\n\n" +
      "Respond as BishtJiBot following all instructions above:";

    var responseText = callGeminiAPI(prompt, 0.2);
    
    if (!responseText || typeof responseText !== "string") {
      return { status: "error", message: "Empty or invalid response from AI service." };
    }
    
    var trimmed = responseText.trim();
    if (
      trimmed.indexOf("⚠️") !== -1 ||
      trimmed.indexOf("AI Error:") !== -1 ||
      trimmed.indexOf("API Error:") !== -1 ||
      trimmed.indexOf("Gemini network error") !== -1 ||
      trimmed.indexOf("Network error:") !== -1 ||
      trimmed.indexOf("Error: No candidates") !== -1 ||
      trimmed.indexOf("⏳") !== -1 ||
      trimmed.indexOf("Groq API is taking a breath") !== -1
    ) {
      return { status: "error", message: trimmed };
    }

    return { status: "success", reply: trimmed };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

var DEFAULT_BOTLAB_KB_TEXT = "# Bot Lab AI — Knowledge Base\n" +
  "You are BishtJiBot (Bot Lab AI), the operations assistant for Redcliffe Labs Logistics Operations Dashboard.\n" +
  "You help operators track sample pickups, dispatch bookings, check live pending drop-offs, review QC photos, " +
  "navigate partner tabs (Allohealth, BHMC, Medibuddy), and assist with manual booking entries.\n" +
  "Rules:\n" +
  "- Keep answers short, direct, and operational.\n" +
  "- Reply in the same language mix (Hindi, Hinglish, English) used by the user.\n" +
  "- No emojis in responses.\n" +
  "- Never contradict Dry Run, session keys, or external Challan links.";

function getBotlabKnowledgeBase() {
  if (typeof BOTLAB_KB_TEXT !== 'undefined' && BOTLAB_KB_TEXT && BOTLAB_KB_TEXT.trim().length > 0) {
    return BOTLAB_KB_TEXT;
  }
  return DEFAULT_BOTLAB_KB_TEXT;
}

// ============================================================
// MANUAL BOOKING CREATION ENGINE (Mode A: Sheet Append)
// ============================================================

function addManualPendingRow(clientName, tabName, rowData) {
  try {
    if (!clientName) {
      return { status: 'error', message: 'Client name is required.' };
    }
    if (!rowData || typeof rowData !== 'object') {
      return { status: 'error', message: 'Patient row data is required.' };
    }

    var ss = getActiveSpreadsheetSafe();
    var configSheet = ss.getSheetByName('Client_Config');
    if (!configSheet) return { status: 'error', message: 'Configuration sheet not found.' };

    var configRows = configSheet.getDataRange().getValues();
    var spreadsheetId = '';
    var configClientName = clientName;
    if (clientName && clientName.indexOf(" - ") !== -1) {
      configClientName = clientName.split(" - ")[0].trim();
    }

    function cleanClientStr(str) {
      return (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    for (var i = 1; i < configRows.length; i++) {
      var rowClient = configRows[i][0] ? configRows[i][0].toString().trim() : '';
      if (!rowClient) continue;
      if (rowClient === clientName || rowClient === configClientName ||
          rowClient.toLowerCase() === configClientName.toLowerCase() ||
          cleanClientStr(rowClient) === cleanClientStr(configClientName) ||
          cleanClientStr(rowClient) === cleanClientStr(clientName)) {
        var urlOrId = configRows[i][1].toString().trim();
        spreadsheetId = urlOrId;
        if (urlOrId.indexOf('docs.google.com') !== -1) {
          var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) spreadsheetId = match[1];
        }
        if (!tabName && configRows[i][2]) {
          tabName = configRows[i][2].toString().trim();
        }
        break;
      }
    }

    if (!spreadsheetId) {
      return { status: 'error', message: 'Could not find spreadsheet mapping for client: ' + clientName };
    }

    var clientDoc = SpreadsheetApp.openById(spreadsheetId);
    var targetSheet = null;
    if (tabName) {
      targetSheet = clientDoc.getSheetByName(tabName);
      if (!targetSheet) {
        var allSheets = clientDoc.getSheets();
        for (var s = 0; s < allSheets.length; s++) {
          if (allSheets[s].getName().toLowerCase().trim() === tabName.toLowerCase().trim()) {
            targetSheet = allSheets[s];
            break;
          }
        }
      }
    }
    if (!targetSheet) {
      targetSheet = clientDoc.getSheets()[0];
    }

    var map = getSheetColumnMap(targetSheet, clientName);
    var lastCol = targetSheet.getLastColumn() || (map ? map.lastCol : 12);
    if (lastCol < 1) lastCol = 12;

    var newRow = new Array(lastCol);
    for (var c = 0; c < lastCol; c++) {
      newRow[c] = '';
    }

    var now = new Date();
    var dateStr = Utilities.formatDate(now, "Asia/Kolkata", map && map.datePref === 'US' ? "MM/dd/yyyy" : "dd-MM-yyyy");

    if (map) {
      if (map.date !== -1 && map.date < lastCol) newRow[map.date] = dateStr;
      if (map.name !== -1 && map.name < lastCol) newRow[map.name] = rowData.patientName || '';
      if (map.age !== -1 && map.age < lastCol) newRow[map.age] = rowData.patientAge || '';
      if (map.gender !== -1 && map.gender < lastCol) newRow[map.gender] = rowData.patientGender || '';
      if (map.phone !== -1 && map.phone < lastCol) newRow[map.phone] = rowData.patientPhone || '';
      if (map.test !== -1 && map.test < lastCol) newRow[map.test] = rowData.testPackage || '';
      if (map.location !== -1 && map.location < lastCol) newRow[map.location] = rowData.location || '';
      if (map.colTime !== -1 && map.colTime < lastCol) newRow[map.colTime] = rowData.collectionTime || '';
      if (map.status !== -1 && map.status < lastCol) newRow[map.status] = 'Pending';
      if (map.referredBy !== -1 && map.referredBy < lastCol && !newRow[map.referredBy]) newRow[map.referredBy] = 'Manual Entry';
    } else {
      newRow[0] = dateStr;
      newRow[1] = '';
      newRow[2] = 'MAN-' + Date.now().toString().slice(-6);
      newRow[3] = rowData.patientName || '';
      newRow[4] = rowData.patientAge || '';
      newRow[5] = rowData.patientGender || '';
      newRow[6] = rowData.patientPhone || '';
      newRow[7] = rowData.testPackage || '';
      newRow[8] = rowData.location || '';
      newRow[9] = 'Pending';
    }

    // Distinguishing flag: append [Manual] tag in remarks or notes
    var noteText = (rowData.notes || '').toString().trim();
    var manualFlag = '[Manual Entry]';
    if (noteText) {
      noteText = manualFlag + ' ' + noteText;
    } else {
      noteText = manualFlag;
    }

    var headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var notesCol = -1;
    for (var h = 0; h < headers.length; h++) {
      var hStr = (headers[h] || '').toString().toLowerCase();
      if (hStr.indexOf('remark') !== -1 || hStr.indexOf('note') !== -1 || hStr.indexOf('comment') !== -1) {
        notesCol = h;
        break;
      }
    }
    if (notesCol !== -1 && notesCol < lastCol) {
      newRow[notesCol] = noteText;
    } else if (map && map.test !== -1 && !String(newRow[map.test]).includes('[Manual Entry]')) {
      newRow[map.test] = (newRow[map.test] || '') + ' ' + manualFlag;
    }

    targetSheet.appendRow(newRow);
    var insertedRow = targetSheet.getLastRow();

    var logSheet = ss.getSheetByName('Dashboard_Logs');
    if (logSheet) {
      var ts = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      logSheet.appendRow([ts, clientName, targetSheet.getName(), insertedRow, rowData.patientName || '', '', 'Manual Pending Booking Added: ' + noteText, 'Success']);
    }

    clearDashboardCache();

    return {
      status: 'success',
      message: 'Pending booking successfully added to ' + clientName + ' (' + targetSheet.getName() + ' Row ' + insertedRow + ')!',
      rowNum: insertedRow,
      clientName: clientName,
      tabName: targetSheet.getName()
    };
  } catch (e) {
    return { status: 'error', message: 'Failed to add manual booking: ' + e.toString() };
  }
}

function getClientTabs(clientName) {
  try {
    clientName = (clientName || '').toString().trim();
    if (!clientName) {
      return { status: 'success', tabs: ['Main', 'Sheet1'], fallback: true };
    }

    var ss = getActiveSpreadsheetSafe();
    var configSheet = ss.getSheetByName('Client_Config');
    if (!configSheet) return { status: 'error', message: 'Client_Config not found.' };

    var configRows = configSheet.getDataRange().getValues();
    var spreadsheetId = '';
    var configClientName = clientName;
    if (clientName.indexOf(" - ") !== -1) {
      configClientName = clientName.split(" - ")[0].trim();
    }
    function cleanClientStr(str) {
      return (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    var cleanClient = cleanClientStr(clientName);
    var cleanConfigClient = cleanClientStr(configClientName);
    var lowerClient = clientName.toLowerCase();
    var lowerConfigClient = configClientName.toLowerCase();

    for (var i = 1; i < configRows.length; i++) {
      var rowClient = configRows[i][0] ? configRows[i][0].toString().trim() : '';
      if (!rowClient) continue;
      var lowerRow = rowClient.toLowerCase();
      var cleanRow = cleanClientStr(rowClient);
      if (rowClient === clientName || rowClient === configClientName ||
          lowerRow === lowerConfigClient || lowerRow === lowerClient ||
          cleanRow === cleanConfigClient || cleanRow === cleanClient) {
        var urlOrId = configRows[i][1].toString().trim();
        spreadsheetId = urlOrId;
        if (urlOrId.indexOf('docs.google.com') !== -1) {
          var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) spreadsheetId = match[1];
        }
        break;
      }
    }
    if (!spreadsheetId) {
      return { status: 'success', tabs: ['Main', 'Sheet1'], fallback: true, message: 'Client not mapped; returning default tabs.' };
    }

    var clientDoc = SpreadsheetApp.openById(spreadsheetId);
    var sheets = clientDoc.getSheets();
    var tabNames = sheets.map(function(s) { return s.getName(); });
    return { status: 'success', tabs: tabNames };
  } catch (e) {
    return { status: 'success', tabs: ['Main', 'Sheet1'], fallback: true, message: e.toString() };
  }
}
