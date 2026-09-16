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
      Logger.log("Failed to open spreadsheet by primary ID: " + e.message);
    }
  }
  if (!ss) {
    try {
      ss = SpreadsheetApp.openById("1wZ9RK_u_CnjXji3h5YiH1fEiR2CHx7TiUvaHGxrceq8");
    } catch(e) {
      Logger.log("Failed to open spreadsheet by secondary ID: " + e.message);
    }
  }
  return ss;
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Drop-Off Dashboard')
    .addItem('🖥️ Open Operations Dashboard', 'showDashboard')
    .addSeparator()
    .addItem('🔍 Run Data Sync Diagnostics', 'runDiagnostics')
    .addItem('⚙️ Initialize Config & Log Sheets', 'initializeDashboardSheets')
    .addItem('🔑 Authorize Spreadsheet Scopes', 'triggerGoogleAuthorizationPrompt')
    .addToUi();
}

/**
 * Force-triggers the Google authorization popup inside Sheets by calling openById.
 * This resolves any "Authorization required" blocks instantly!
 */
function triggerGoogleAuthorizationPrompt() {
  var ui = SpreadsheetApp.getUi();
  var testId = "1MJKP8Jet9z6V815Zlna5aogmTnrLlaH_3UlUJz5NDxc";
  try {
    var doc = SpreadsheetApp.openById(testId);
    ui.alert('🔑 Scope Authorization Success', 'Your Google account has successfully authorized external sheets access! You can now open the dashboard.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('🔑 Authorization Action Needed', 'Please open the Apps Script editor (Extensions -> Apps Script), select "triggerGoogleAuthorizationPrompt" in the top toolbar dropdown, and click the "Run" button to complete the Google security prompt.', ui.ButtonSet.OK);
  }
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

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
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
      ['Juvius Healthcare', '10WUT7Mc08EleXJY9Zt3AsnWQgyLTvE-zgVRpWtxBXwk', '', 'Active']
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
  map.age = findCol(['patientage', 'age', 'patient_age']);
  map.gender = findCol(['patientgender', 'gender', 'sex']);
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
      map.datePref = 'US';
      if (map.date === -1) map.date = 0;
      if (map.bookingId === -1) map.bookingId = 1;
      if (map.name === -1) map.name = 4;
      if (map.age === -1) map.age = 5;
      if (map.gender === -1) map.gender = 6;
      if (map.colTime === -1) map.colTime = 7;
      if (map.phone === -1) map.phone = 8;
    } else if (lowerClient.indexOf('tghs') !== -1) {
      if (map.date === -1) map.date = 0;
      if (map.bookingId === -1) map.bookingId = 1;
      if (map.reqId === -1) map.reqId = 2;
      if (map.name === -1) map.name = 3;
      if (map.age === -1) map.age = 4;
      if (map.gender === -1) map.gender = 5;
    } else if (lowerClient.indexOf('juvius') !== -1) {
      if (map.date === -1) map.date = 0;
      if (map.bookingId === -1) map.bookingId = 1;
      if (map.name === -1) map.name = 2;
      if (map.age === -1) map.age = 3;
      if (map.gender === -1) map.gender = 4;
    } else if (lowerClient.indexOf('hcl') !== -1) {
      map.datePref = 'UK';
      if (map.date === -1) map.date = 0;
      if (map.name === -1) map.name = 1;
      if (map.age === -1) map.age = 2;
      if (map.gender === -1) map.gender = 3;
      
      var orderIdCol = findCol(['orderid', 'order id']);
      var redcliffeBookingCol = findCol(['redcliffebookingid', 'redcliffe booking id']);
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
      
      var contactCol = findCol(['contactno', 'contact no', 'contact number', 'contact']);
      if (contactCol !== -1) {
        map.phone = contactCol;
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
  var s = dateVal.toString().trim().replace(/\./g, '-').replace(/\//g, '-');
  if (s === "" || s === "-" || s === "--" || s.toLowerCase() === "n/a") return null;
  
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
      if (formatPref === 'US') {
        day = second;
        month = first;
      } else {
        day = first;
        month = second;
      }
    }
    
    var d = new Date(year, month - 1, day);
    return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd");
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

function getDatesInRange(startStr, endStr) {
  var startParts = startStr.split('-');
  var endParts = endStr.split('-');
  var startDateObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  var endDateObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  
  var dates = [];
  var current = new Date(startDateObj);
  var limit = 30; // Cap at 30 days max to prevent performance degradation
  while (current <= endDateObj && limit > 0) {
    dates.push(formatDateString(current));
    current.setDate(current.getDate() + 1);
    limit--;
  }
  return dates;
}

function getDashboardLogsData(forceSync, filterStartDateStr, filterEndDateStr) {
  try {
    var today = getISTDate();
    var todayStr = formatDateString(today);
    
    var yesterday = new Date(today.getTime() - 86400000);
    var yesterdayStr = formatDateString(yesterday);
    
    var startDateStr = filterStartDateStr || yesterdayStr;
    var endDateStr = filterEndDateStr || todayStr;
    
    var isDefaultRange = (startDateStr === yesterdayStr && endDateStr === todayStr);
    
    if ((forceSync === false || forceSync === "false" || !forceSync) && isDefaultRange) {
      var cachedData = getLargeCache("dashboard_data_cache");
      if (cachedData) {
        cachedData.isCached = true;
        return cachedData;
      }
    }

    var ss = getActiveSpreadsheetSafe();
    if (!ss) {
      return { status: 'error', message: 'Spreadsheet connection failed. Please ensure the host Spreadsheet ID is accessible and authorized.' };
    }
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
        var id = urlOrId;
        if (urlOrId.indexOf('docs.google.com') !== -1) {
          var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) id = match[1];
        }
        clientsList.push({ name: name, id: id, tabName: tabName });
      }
    }
    
    // Dynamic dates in range
    var trendDays = getDatesInRange(startDateStr, endDateStr);
    
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
    
    var pendingLogsMap = {}; // Maps bookingKey -> logObject for de-duplication and test merging
    var seenBookingMaps = {};
    
    clientsList.forEach(function(client) {
      try {
        var clientDoc = SpreadsheetApp.openById(client.id);
        var sheets = [];
        
        if (client.tabName) {
          var sheetObj = clientDoc.getSheetByName(client.tabName);
          if (sheetObj) {
            sheets.push(sheetObj);
          } else {
            // Dynamic Tab Name Fallback
            var fallbacks = ["Sample Tracking", "Data", "Order History", "Form Responses 1", "Sheet1"];
            var foundFallback = null;
            for (var f = 0; f < fallbacks.length; f++) {
              var fbSheet = clientDoc.getSheetByName(fallbacks[f]);
              if (fbSheet) {
                foundFallback = fbSheet;
                break;
              }
            }
            if (foundFallback) {
              sheets.push(foundFallback);
            } else {
              if (clientStats[client.name]) {
                clientStats[client.name].error = "Tab '" + client.tabName + "' not found.";
              }
            }
          }
        } else {
          var allSheets = clientDoc.getSheets();
          var ignore = ['Dashboard', 'Master Data', 'Instructions', 'Pending List', 'Dropdowns', 'Comments_DB', 'API_Not_Found', 'Client_Config', 'Dashboard_Logs'];
          allSheets.forEach(function(sh) {
            var name = sh.getName();
            if (ignore.indexOf(name) === -1) sheets.push(sh);
          });
          if (sheets.length === 0) {
            if (clientStats[client.name]) {
              clientStats[client.name].error = "No valid data tabs found.";
            }
          }
        }
        
        var useSplitName = sheets.length > 1 || client.name.toLowerCase().trim() === 'hcl';
        
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
            
            var maxRows = isDefaultRange ? 450 : 1500;
            var startRow = Math.max(2, lastRow - maxRows + 1);
            var numRows = lastRow - startRow + 1;
            var readCols = colMap.maxColToRead || colMap.lastCol;
            var data = sheet.getRange(startRow, 1, numRows, readCols).getValues();
            
            var groupedBookings = {};
            
            // Resolve dates first
            var rowDates = [];
            for (var r = 0; r < data.length; r++) {
              var dateVal = data[r][colMap.date];
              var dateStr = normalizeDate(dateVal, 'UK'); // Medibuddy Drop-Off is strictly UK format in the sheet!
              rowDates.push(dateStr);
            }
            
            // Loop backwards (bottom-up chronological scan)
            for (var r = data.length - 1; r >= 0; r--) {
              var dateStr = rowDates[r];
              if (!dateStr) continue;
              
              if (dateStr < startDateStr) {
                break; // Stop scanning since we reached data older than the range!
              }
              if (dateStr > endDateStr) {
                continue; // Skip data newer than range
              }
              
              var row = data[r];
              var actualRowNum = startRow + r;
              
              var name = colMap.name !== -1 && row[colMap.name] ? row[colMap.name].toString().trim() : '';
              var bId = colMap.bookingId !== -1 && row[colMap.bookingId] ? row[colMap.bookingId].toString().trim() : '';
              var refId = colMap.reqId !== -1 && row[colMap.reqId] ? row[colMap.reqId].toString().trim() : '';
              var status = colMap.status !== -1 && row[colMap.status] ? row[colMap.status].toString().trim() : '';
              
              if (!name && !refId && !bId) continue;
              if (name.toLowerCase() === 'unknown' && !refId && !bId) continue;
              
              var stLow = status.toLowerCase();
              if (stLow === 'n/a' || stLow === 'na') continue;
              
              var cleanBId = bId.toLowerCase().replace(/\s+/g, '');
              if (cleanBId.indexOf('cancel') !== -1 || cleanBId.indexOf('reject') !== -1 || cleanBId.indexOf('notcollect') !== -1 || cleanBId.indexOf('bloodnot') !== -1) {
                continue;
              }
              
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
                
                groupedBookings[groupKey] = {
                  client: displayName,
                  sheetName: sheetName,
                  rowNum: actualRowNum,
                  date: dateStr,
                  name: name || 'N/A',
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
              
              if (isPending) {
                var bookingKey = displayName + '_' + key;
                pendingLogsMap[bookingKey] = booking;
              }
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
          
          // Scan fewer rows for default date range to significantly speed up extraction
          var maxRows = isDefaultRange ? 450 : 1500;
          var startRow = Math.max(2, lastRow - maxRows + 1);
          var numRows = lastRow - startRow + 1;
          var readCols = colMap.maxColToRead || colMap.lastCol;
          var data = sheet.getRange(startRow, 1, numRows, readCols).getValues();
          
          // Resolve dates first so we can safely scan backwards
          var rowDates = [];
          var lastValidDateStr = null;
          for (var r = 0; r < data.length; r++) {
            var dateVal = data[r][colMap.date];
            var dateStr = normalizeDate(dateVal, colMap.datePref);
            if (dateStr) {
              lastValidDateStr = dateStr;
            } else if (lastValidDateStr) {
              dateStr = lastValidDateStr;
            }
            rowDates.push(dateStr);
          }
          
          // Loop backwards (bottom-up chronological scan)
          for (var r = data.length - 1; r >= 0; r--) {
            var dateStr = rowDates[r];
            if (!dateStr) continue;
            
            if (dateStr < startDateStr) {
              break; // Stop scanning since we reached data older than the range!
            }
            if (dateStr > endDateStr) {
              continue; // Skip data newer than range
            }
            
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
            
            var normName = patientName ? patientName.toLowerCase()
              .replace(/^(mr|mrs|ms|dr|miss|master)\.?\s+/g, '')
              .replace(/[^a-z0-9]/g, '')
              .trim() : '';
            
            if (!normName && !cleanBId && !cleanRId) continue;
            
            var isPending = (!bookingId || bookingId === "" || bookingId === "-" || bookingId === "--" || bookingId.toLowerCase() === "na" || bookingId.toLowerCase() === "n/a");
            
            // Weekly check: Within last 7 days (trend Days)
            var isWeekly = trendDays.indexOf(dateStr) !== -1;
            
            var isDuplicate = false;
            
            if (displayName.toLowerCase().indexOf('flebo') !== -1) {
              isDuplicate = false;
            } else {
              if (cleanBId && cleanBId !== "na" && cleanBId !== "n/a") {
                var bidDateKey = cleanBId + '_' + dateStr;
                if (seenBookingIds[bidDateKey]) {
                  isDuplicate = true;
                }
              }
              if (cleanRId && cleanRId !== "na" && cleanRId !== "n/a") {
                var ridDateKey = cleanRId + '_' + dateStr;
                if (seenReqIds[ridDateKey]) {
                  isDuplicate = true;
                }
              }
              
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
            
            // Unique key construction for logs and test merging
            var bookingKey = cleanRId ? cleanRId : (cleanBId ? cleanBId : (normName + '_' + dateStr));
            bookingKey = displayName + '_' + bookingKey; // Isolate keys per display name
            
            if (isDuplicate) {
              if (isPending && pendingLogsMap[bookingKey] && test && test !== 'N/A') {
                var existingLog = pendingLogsMap[bookingKey];
                var currentTests = existingLog.test.split(',').map(function(t) { return t.trim(); });
                if (currentTests.indexOf(test) === -1) {
                  existingLog.test += ', ' + test;
                }
              }
              continue;
            }
            
            if (cleanBId && cleanBId !== "na" && cleanBId !== "n/a") seenBookingIds[cleanBId + '_' + dateStr] = true;
            if (cleanRId && cleanRId !== "na" && cleanRId !== "n/a") seenReqIds[cleanRId + '_' + dateStr] = true;
            if (nameDateKey && normName !== "") {
              seenPatientDates[nameDateKey] = {
                phone: phone || '',
                age: row[colMap.age] || ''
              };
            }
            
            if (dateStr === todayStr) {
              if (isPending) pendingToday++; else createdToday++;
            }
            
            // Dynamically ensure dateStr and displayName keys are initialized in trendData
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
            
            if (isPending) {
              pendingLogsMap[bookingKey] = {
                client: displayName,
                sheetName: sheetName,
                rowNum: actualRowNum,
                date: dateStr,
                name: patientName || 'N/A',
                reqId: reqId || 'N/A',
                bookingId: '',
                status: 'Pending Creation',
                test: test || 'N/A',
                location: location || sheetName,
                phone: phone || 'N/A'
              };
            }
          }
        });
      } catch (e) {
        Logger.log("Error reading sheet for " + client.name + ": " + e.message);
        if (clientStats[client.name]) {
          clientStats[client.name].error = e.message;
        }
      }
    });
    
    // Cleanup original unsplit keys for split clients
    clientsList.forEach(function(client) {
      if (client.name.toLowerCase().trim() === 'hcl') {
        delete clientStats[client.name];
      }
    });
    
    // Extract all pending logs
    var logs = Object.keys(pendingLogsMap).map(function(key) {
      return pendingLogsMap[key];
    });
    
    // Sort logs by date descending
    logs.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    
    var alloPendingCount = 0;
    try {
      var alloDoc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
      var alloSheet = alloDoc.getSheetByName("Sample Tracking") || alloDoc.getSheetByName("Daily Sample Tracking") || alloDoc.getSheets()[0];
      var alloLastRow = alloSheet.getLastRow();
      if (alloLastRow >= 2) {
        var alloLastCol = alloSheet.getLastColumn();
        var fetchCols = Math.min(Math.max(16, alloLastCol), alloSheet.getMaxColumns());
        if (fetchCols >= 4) {
          // Dynamically find the real last row with data in Column D (to skip trailing blank rows)
          var checkRange = alloSheet.getRange(Math.max(1, alloLastRow - 1000 + 1), 4, Math.min(alloLastRow, 1000), 1).getValues();
          var realLastRow = alloLastRow;
          for (var i = checkRange.length - 1; i >= 0; i--) {
            if (checkRange[i][0] && checkRange[i][0].toString().trim() !== "") {
              realLastRow = Math.max(1, alloLastRow - 1000 + 1) + i;
              break;
            }
          }
          
          // Scan last 300 rows starting from realLastRow
          var alloStartRow = Math.max(2, realLastRow - 300 + 1);
          var alloNumRows = realLastRow - alloStartRow + 1;
          if (alloNumRows < 1) alloNumRows = 1;
          var alloData = alloSheet.getRange(alloStartRow, 1, alloNumRows, fetchCols).getValues();
          
          for (var r = 0; r < alloData.length; r++) {
            var row = alloData[r];
            var bId = row[3]; // Column D
            var qcStatus = row[15] ? row[15].toString().trim() : ''; // Column P
            
            // Filter by date range for Allohealth pending QC count
            var bookingDateStr = null;
            if (row[1]) {
              bookingDateStr = normalizeDate(row[1], 'UK');
            }
            
            if (bId && bId.toString().trim() !== "" && (!qcStatus || qcStatus.toString().trim() === "")) {
              alloPendingCount++;
            }
          }
        }
      }
    } catch (e) {
      Logger.log("Error checking Allohealth count: " + e.message);
    }
    
    var result = {
      status: 'success',
      lastSync: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss"),
      kpis: {
        pendingToday: pendingToday,
        createdToday: createdToday,
        totalPendingAcrossClients: Object.keys(clientStats).reduce(function(acc, k) { return acc + clientStats[k].pending; }, 0),
        totalWeeklyAcrossClients: Object.keys(clientStats).reduce(function(acc, k) { return acc + clientStats[k].weeklyTotal; }, 0),
        activeClientsCount: clientsList.length,
        alloPendingCount: alloPendingCount
      },
      logs: logs,
      clientStats: clientStats,
      trendData: trendData,
      trendDays: trendDays
    };
    
    if (isDefaultRange) {
      putLargeCache("dashboard_data_cache", result, 300); // Cache for 5 minutes
    }
    
    return result;
  } catch (err) {
    Logger.log("getDashboardLogsData error: " + err.toString());
    return { status: 'error', message: 'Backend Aggregator Error: ' + err.toString() };
  }
}

function clearDashboardCache() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove("dashboard_data_cache_manifest");
    for (var i = 0; i < 20; i++) {
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

function updateBookingIdInSourceSheet(clientName, sheetTab, rowNum, newBookingId, comments, operatorName) {
  var ss = getActiveSpreadsheetSafe();
  var configSheet = ss.getSheetByName('Client_Config');
  if (!configSheet) return { status: 'error', message: 'Configuration sheet not found.' };
  
  var configRows = configSheet.getDataRange().getValues();
  var spreadsheetId = '';
  
  var configClientName = clientName;
  if (clientName.indexOf(" - ") !== -1) {
    configClientName = clientName.split(" - ")[0].trim();
  }
  
  for (var i = 1; i < configRows.length; i++) {
    if (configRows[i][0] && configRows[i][0].toString().trim() === configClientName) {
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
    var targetSheet = clientDoc.getSheetByName(sheetTab);
    if (!targetSheet) {
      targetSheet = clientDoc.getSheets()[0];
    }
    
    var map = getSheetColumnMap(targetSheet, clientName);
    if (!map || map.bookingId === -1) {
      return { status: 'error', message: 'Could not detect the Booking ID column in ' + clientName + ' spreadsheet.' };
    }
    
    rowNum = parseInt(rowNum, 10);
    var patientName = map.name !== -1 ? targetSheet.getRange(rowNum, map.name + 1).getValue().toString().trim() : 'N/A';
    
    targetSheet.getRange(rowNum, map.bookingId + 1).setValue(newBookingId);
    if (map.status !== -1) {
      targetSheet.getRange(rowNum, map.status + 1).setValue('Booking Created');
    }
    
    var logSheet = ss.getSheetByName('Dashboard_Logs');
    if (logSheet) {
      var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      logSheet.appendRow([ts, clientName, sheetTab, rowNum, patientName, newBookingId, comments || '', 'Success']);
    }
    
    clearDashboardCache(); // Clear cache on data update!
    
    return { status: 'success', message: 'Booking ID successfully updated in ' + clientName + ' (' + sheetTab + ' Row ' + rowNum + ')!' };
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
    
    var cleanId = driveId.toString().trim();
    if (cleanId.indexOf('http') !== -1) {
      var match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/) || cleanId.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (match) cleanId = match[1];
    }

    // Stage 1: DriveApp getFileById
    try {
      var file = DriveApp.getFileById(cleanId);
      var blob = file.getBlob();
      var bytes = blob.getBytes();
      var contentType = blob.getContentType() || file.getMimeType() || "image/jpeg";
      var base64 = Utilities.base64Encode(bytes);
      return {
        status: 'success',
        mimeType: contentType,
        base64Data: 'data:' + contentType + ';base64,' + base64
      };
    } catch (driveErr) {
      Logger.log("Stage 1 DriveApp failed for " + cleanId + ": " + driveErr.toString());
    }

    // Stage 2: UrlFetchApp download
    try {
      var fetchUrl = "https://drive.google.com/uc?export=download&id=" + cleanId;
      var resp = UrlFetchApp.fetch(fetchUrl, { muteHttpExceptions: true, followRedirects: true });
      if (resp.getResponseCode() === 200) {
        var blob = resp.getBlob();
        var bytes = blob.getBytes();
        var contentType = blob.getContentType() || "image/jpeg";
        var base64 = Utilities.base64Encode(bytes);
        return {
          status: 'success',
          mimeType: contentType,
          base64Data: 'data:' + contentType + ';base64,' + base64
        };
      }
    } catch (fetchErr) {
      Logger.log("Stage 2 UrlFetchApp failed for " + cleanId + ": " + fetchErr.toString());
    }

    // Stage 3: Direct CDN URL fallback
    return {
      status: 'success',
      mimeType: 'image/jpeg',
      base64Data: 'https://lh3.googleusercontent.com/d/' + cleanId
    };
  } catch (e) {
    return { status: 'error', message: 'Drive Access Error: ' + e.toString() };
  }
}

function getAllohealthQCData(filterStartDateStr, filterEndDateStr) {
  try {
    var today = getISTDate();
    var todayStr = formatDateString(today);
    
    var yesterday = new Date(today.getTime() - 86400000);
    var yesterdayStr = formatDateString(yesterday);
    
    var startDateStr = filterStartDateStr || yesterdayStr;
    var endDateStr = filterEndDateStr || todayStr;
    
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
        
        
        
        // Filter collected rows that are pending QC Status update
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
            phlebotomist: row[10] ? row[10].toString().trim() : 'N/A',
            refrigeratorPhoto: row[11] ? row[11].toString().trim() : '', // Column L
            vials: row[12] ? row[12].toString().trim() : 'N/A',
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
    
    return { status: 'success', data: pendingQC };
  } catch (e) {
    return { status: 'error', message: 'Allohealth QC Fetch Error: ' + e.toString() };
  }
}

function updateAllohealthQC(rowNum, status, remarks) {
  try {
    rowNum = parseInt(rowNum, 10);
    var doc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
    var sheet = doc.getSheetByName("Sample Tracking") || doc.getSheetByName("Daily Sample Tracking") || doc.getSheets()[0];
    
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

function getAllohealthPendingCountAndIDs(filterStartDateStr, filterEndDateStr) {
  try {
    var today = getISTDate();
    var todayStr = formatDateString(today);
    
    var yesterday = new Date(today.getTime() - 86400000);
    var yesterdayStr = formatDateString(yesterday);
    
    var startDateStr = filterStartDateStr || yesterdayStr;
    var endDateStr = filterEndDateStr || todayStr;
    
    var doc = SpreadsheetApp.openById(getAllohealthSpreadsheetId());
    var sheet = doc.getSheetByName("Sample Tracking") || doc.getSheetByName("Daily Sample Tracking") || doc.getSheets()[0];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'success', pendingIds: [], pendingCount: 0 };
    
    // Scan Column D (Booking ID)
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
    
    // Fetch Columns B to P (Column 2 to 16, width 15)
    var values = sheet.getRange(startRow, 2, numRows, 15).getValues();
    
    var pendingIds = [];
    var pendingCount = 0;
    for (var r = values.length - 1; r >= 0; r--) {
      var dateVal = values[r][0]; // Column B
      var bId = values[r][2] ? values[r][2].toString().trim() : ''; // Column D
      var qcStatus = values[r][14] ? values[r][14].toString().trim() : ''; // Column P
      
      
      
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

// ==========================================
// 8. PHLEBO ROSTER & MANAGER ENGINE
// ==========================================

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

/**
 * REST API Entry Point for Vercel/Vite Client-side SPA Redirection.
 * Parses action & parameters payload and routes call to corresponding global backend functions.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No post data contents received.");
    }
    
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var parameters = requestData.parameters || [];
    
    if (!action) {
      throw new Error("Missing 'action' parameter in request payload.");
    }
    
    // Locate the function globally
    var targetFunc = this[action];
    if (typeof targetFunc !== 'function') {
      throw new Error("Backend function '" + action + "' does not exist or is not exposed.");
    }
    
    // Execute the action with parameters
    var result = targetFunc.apply(this, parameters);
    
    // Return output as JSON
    return ContentService.createTextOutput(JSON.stringify(result || {}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errResponse = {
      status: 'error',
      message: error.toString(),
      stack: error.stack
    };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Supabase integration disabled

/**
 * ============================================================
 * BOOKING OPERATIONS SUITE - BACKEND
 * ============================================================
 */


/* ============================================================
 * WEB APP
 * ============================================================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Operations Suite')
    .addItem('Open App in Sidebar', 'openSidebar')
    .addToUi();
}


function openSidebar() {
  var html = HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Booking Operations Suite');

  SpreadsheetApp.getUi().showSidebar(html);
}


function getUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (e) {
    return '';
  }
}


/* ============================================================
 * GMAIL AUTHORIZATION
 * ============================================================ */

/**
 * Run this ONCE manually from the Apps Script editor to trigger
 * the OAuth consent screen for Gmail scopes before deploying.
 */
function authorizeGmail() {
  GmailApp.getDrafts();
  return 'Gmail authorization successful.';
}


/* ============================================================
 * CSV BATCHING - MASTER CSV
 * ============================================================ */

function processAndGenerateBatchZip(csvContent, batchSize) {

  try {

    batchSize = parseInt(batchSize, 10) || 100;

    var parsed = parseCSVRows(csvContent);

    if (!parsed || parsed.length < 2) {
      throw new Error('CSV file is empty or missing headers.');
    }

    var headers = parsed[0].map(function(h) {
      return h.trim();
    });

    var dataRows = parsed
      .slice(1)
      .filter(function(row) {
        return row.length > 0 && row.some(function(cell) {
          return cell.trim() !== '';
        });
      });

    if (dataRows.length === 0) {
      throw new Error('No valid data rows found in CSV.');
    }

    var hasExactHeaders =
      headers.length >= 2 &&
      headers[0].toLowerCase() === 'booking_id' &&
      headers[1].toLowerCase() === 'add_booking_id';

    var zipBlobs = [];
    var totalRows = dataRows.length;

    for (var i = 0; i < totalRows; i += batchSize) {

      var chunk = dataRows.slice(i, i + batchSize);
      var startIdx = i + 1;
      var endIdx = Math.min(i + batchSize, totalRows);
      var filename = 'Batch_' + startIdx + '_to_' + endIdx + '.csv';

      var csvLines = ['booking_id,add_booking_id'];

      chunk.forEach(function(row) {
        if (hasExactHeaders) {
          var idVal = escapeCSVCell(row[0] || '');
          var addIdVal = escapeCSVCell(row[1] || row[0] || '');
          csvLines.push(idVal + ',' + addIdVal);
        } else {
          var extractedId = '';
          for (var col = 0; col < row.length; col++) {
            if (row[col] && row[col].trim() !== '') {
              extractedId = row[col].trim();
              break;
            }
          }
          var escaped = escapeCSVCell(extractedId);
          csvLines.push(escaped + ',' + escaped);
        }
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
    return {
      success: false,
      error: error.message || error.toString()
    };
  }
}


/* ============================================================
 * CSV BATCHING - RAW IDS
 * ============================================================ */

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
    return {
      success: false,
      error: err.message || err.toString()
    };
  }
}


/* ============================================================
 * LOCATION-WISE GMAIL DRAFTS
 * ============================================================
 * FIX: previously a single bad location (missing "to" email,
 * empty rows, etc.) threw and aborted the ENTIRE batch, even
 * drafts already created were left un-reported. This version
 * processes each location independently, keeps going on error,
 * and reports back which locations succeeded/failed.
 * ============================================================ */

function createLocationDrafts(drafts) {

  var createdCount = 0;
  var errors = [];

  try {

    if (!Array.isArray(drafts) || drafts.length === 0) {
      throw new Error('No location data received.');
    }

    var mailDate = formatMailDate();

    // FIX: logoBlob may legitimately be null now (see getSignatureLogoBlob).
    // A missing/broken logo must never take down draft creation.
    var logoBlob = getSignatureLogoBlob();

    for (var i = 0; i < drafts.length; i++) {

      var draft = drafts[i];
      if (!draft) continue;

      var location = String(draft.location || '').trim();
      var toEmail = String(draft.to || '').trim();
      var ccEmail = String(draft.cc || '').trim();

      try {

        if (!location) {
          throw new Error('Location is missing.');
        }

        if (!toEmail) {
          throw new Error('"To Email" is missing.');
        }

        var sourceRows = Array.isArray(draft.rows) ? draft.rows : [];

        if (sourceRows.length === 0) {
          throw new Error('No booking records found for this location.');
        }

        var normalizedRows = sourceRows.map(normalizeBookingRecord);

        var subject = 'HCL-Sample Drop-off || ' + location + ' || ' + mailDate;

        var htmlBody = buildLocationEmailBody(normalizedRows, !!logoBlob);

        var options = { htmlBody: htmlBody };

        if (logoBlob) {
          options.inlineImages = { signatureLogo: logoBlob };
        }

        if (ccEmail) {
          options.cc = ccEmail;
        }

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
      error: success
        ? undefined
        : (errors.length
            ? errors.map(function(e) { return e.location + ': ' + e.error; }).join(' | ')
            : 'No drafts were created.')
    };

  } catch (err) {
    return {
      success: false,
      count: createdCount,
      errors: errors,
      error: err.message || err.toString()
    };
  }
}


/* ============================================================
 * EMAIL BODY
 * ============================================================
 * FIX: now accepts hasLogo so it only renders the <img> tag
 * when a real logo blob was actually attached — otherwise the
 * signature degrades gracefully to text-only instead of a
 * broken-image icon in the sent draft.
 * ============================================================ */

function buildLocationEmailBody(rows, hasLogo) {

  var html = '';

  html += '<div style="font-family:Arial,sans-serif;font-size:13px;color:#000;line-height:1.5;">';

  html += '<p style="margin:0 0 14px 0;">Dear Team,</p>';

  html += '<p style="margin:0 0 16px 0;">Kindly find the booking ids below for your reference,</p>';

  html +=
    '<table border="1" cellpadding="0" cellspacing="0" style="' +
    'border-collapse:collapse;width:auto;min-width:360px;' +
    'font-family:Arial,sans-serif;font-size:12px;line-height:1.2;margin:0 0 18px 0;">';

  html +=
    '<thead>' +
    '<tr style="background-color:#ffff00;color:#000000;font-weight:bold;">' +
    '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">S. No.</th>' +
    '<th style="padding:4px 10px;border:1px solid #777;white-space:nowrap;">Name</th>' +
    '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">Age</th>' +
    '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">Gender</th>' +
    '<th style="padding:4px 7px;border:1px solid #777;white-space:nowrap;">Booking id</th>' +
    '</tr>' +
    '</thead>';

  html += '<tbody>';

  rows.forEach(function(row, index) {

    html += '<tr>';

    html +=
      '<td style="padding:4px 7px;border:1px solid #777;text-align:center;white-space:nowrap;">' +
      (index + 1) + '</td>';

    html +=
      '<td style="padding:4px 10px;border:1px solid #777;white-space:nowrap;">' +
      escapeHTML(row.name) + '</td>';

    html +=
      '<td style="padding:4px 7px;border:1px solid #777;text-align:center;white-space:nowrap;">' +
      escapeHTML(row.age) + '</td>';

    html +=
      '<td style="padding:4px 7px;border:1px solid #777;text-align:center;white-space:nowrap;">' +
      escapeHTML(row.gender) + '</td>';

    html +=
      '<td style="padding:4px 7px;border:1px solid #777;font-family:Arial,sans-serif;font-weight:600;white-space:nowrap;">' +
      escapeHTML(row.bookingId) + '</td>';

    html += '</tr>';
  });

  html += '</tbody>';
  html += '</table>';

  html += '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.35;color:#000;">';
  html += '<div style="margin:0;">Thanks and Regards,</div>';
  html += '<div style="margin:0;font-weight:bold;">Rishabh Jain</div>';
  html += '<div style="margin:0 0 6px 0;font-weight:bold;">Strategic Alliances (B2B Operations)</div>';

  if (hasLogo) {
    html +=
      '<img src="cid:signatureLogo" alt="Redcliffe Labs" width="200" ' +
      'style="display:block;width:200px;height:auto;border:0;margin:0;">';
  }

  html += '</div>';
  html += '</div>';

  return html;
}


/* ============================================================
 * SIGNATURE LOGO
 * ============================================================
 * FIX: the previous Base64 constant was truncated (~140 chars —
 * far too short for a real PNG), which produced either a
 * corrupt/broken image in the sent draft or, worse, could throw
 * inside Utilities.base64Decode and abort the ENTIRE batch of
 * drafts before any were created.
 *
 * This version:
 *   1. Tries a Drive-hosted file first (most reliable, and easy
 *      to swap the logo later without touching code) if you set
 *      SIGNATURE_LOGO_DRIVE_FILE_ID below.
 *   2. Falls back to an inline Base64 constant if you paste one.
 *   3. Returns null (never throws) if neither is configured or
 *      valid — buildLocationEmailBody() then skips the <img> tag
 *      entirely so the draft still gets created, just without a
 *      logo, instead of failing outright.
 * ============================================================ */

// OPTION 1 (recommended): paste a Drive file ID here.
// Get it from the file's share link: drive.google.com/file/d/FILE_ID_HERE/view
var SIGNATURE_LOGO_DRIVE_FILE_ID = '';

// OPTION 2 (fallback): paste the FULL Base64 string of the logo PNG here.
// To generate it correctly, upload the logo to Drive, then run in the
// Apps Script editor:
//   Logger.log(Utilities.base64Encode(DriveApp.getFileById('YOUR_FILE_ID').getBlob().getBytes()));
// and paste the ENTIRE logged string below (it will be long — thousands
// of characters for a real logo image). A short/placeholder string here
// is intentionally rejected by the length check below.
var SIGNATURE_LOGO_BASE64 = '';

function getSignatureLogoBlob() {

  if (SIGNATURE_LOGO_DRIVE_FILE_ID) {
    try {
      return DriveApp.getFileById(SIGNATURE_LOGO_DRIVE_FILE_ID).getBlob();
    } catch (e) {
      // Fall through to the Base64 fallback below.
    }
  }

  if (!SIGNATURE_LOGO_BASE64) {
    return null;
  }

  try {
    var bytes = Utilities.base64Decode(SIGNATURE_LOGO_BASE64);
    if (!bytes || bytes.length < 100) {
      // Guards against a truncated/placeholder string silently
      // producing a broken image in every sent draft.
      return null;
    }
    return Utilities.newBlob(bytes, 'image/png', 'redcliffe_signature_logo.png');
  } catch (e) {
    return null;
  }
}


/* ============================================================
 * NORMALIZE BOOKING RECORD
 * ============================================================ */

function normalizeBookingRecord(row) {

  row = row || {};

  var bookingId = firstNonEmptyValue([
    row.bookingId,
    row.booking_id,
    row['Booking ID'],
    row['Booking id'],
    row['booking id']
  ]);

  var name = firstNonEmptyValue([
    row.name,
    row.Name,
    row['Patient Name'],
    row.patientName,
    row.patient_name
  ]);

  var age = firstNonEmptyValue([
    row.age,
    row.Age,
    row['Patient Age'],
    row.patientAge
  ]);

  var gender = firstNonEmptyValue([
    row.gender,
    row.Gender,
    row['Patient Gender'],
    row.patientGender
  ]);

  return {
    bookingId: String(bookingId || '').trim(),
    name: String(name || '').trim(),
    age: String(age || '').trim(),
    gender: String(gender || '').trim()
  };
}


/* ============================================================
 * FIRST NON-EMPTY VALUE
 * ============================================================ */

function firstNonEmptyValue(values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i] !== undefined && values[i] !== null && String(values[i]).trim() !== '') {
      return values[i];
    }
  }
  return '';
}


/* ============================================================
 * DATE FORMAT
 * ============================================================ */

function formatMailDate() {
  var timeZone = Session.getScriptTimeZone();
  if (!timeZone) {
    timeZone = 'Asia/Kolkata';
  }
  return Utilities.formatDate(new Date(), timeZone, 'dd/MM/yyyy');
}


/* ============================================================
 * CSV PARSER
 * ============================================================ */

function parseCSVRows(text) {

  var lines = [];
  var row = [''];
  var inQuotes = false;

  for (var i = 0; i < text.length; i++) {

    var c = text.charAt(i);
    var next = text.charAt(i + 1);

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }

  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }

  return lines;
}


/* ============================================================
 * CSV ESCAPE
 * ============================================================ */

function escapeCSVCell(val) {
  val = String(val);
  if (
    val.indexOf('"') !== -1 ||
    val.indexOf(',') !== -1 ||
    val.indexOf('\n') !== -1 ||
    val.indexOf('\r') !== -1
  ) {
    val = '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}


/* ============================================================
 * HTML ESCAPE
 * ============================================================ */

function escapeHTML(value) {
  value = value === undefined || value === null ? '' : String(value);
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}