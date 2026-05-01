/**
 * @fileoverview Main application entry point - initializes modules and event handlers
 */

'use strict';

/**
 * Initialize the application
 */
function initApp() {
  // Initialize state management
  state.init();
  
  // Set up greeting
  document.getElementById('dgreet').textContent = utils.getGreeting() + ' 👋';
  
  // Set up global error handler
  window.addEventListener('error', function(e) {
    utils.logError('Global', e.error);
    uiModule.toast('An error occurred. Check console for details.');
  });
  
  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(e) {
    utils.logError('Promise rejection', e.reason);
  });
  
  // Initialize event listeners
  setupEventListeners();
  
  console.log('App initialized');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Sidebar toggle
  document.getElementById('hmbtn').addEventListener('click', function() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sb-ov');
    
    if (window.innerWidth <= 768) {
      sb.classList.toggle('mob-open');
      ov.classList.toggle('vis', sb.classList.contains('mob-open'));
    } else {
      sb.classList.toggle('collapsed');
    }
  });
  
  // Sidebar overlay click
  document.getElementById('sb-ov').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('mob-open');
    document.getElementById('sb-ov').classList.remove('vis');
  });
  
  // Global click to close panels and context menu
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#ctx')) {
      document.getElementById('ctx').classList.remove('open');
    }
    if (!e.target.closest('#cpanel') && !e.target.closest('#btn-cols')) {
      document.getElementById('cpanel').classList.remove('open');
    }
    if (!e.target.closest('#ppanel') && !e.target.closest('#btn-preset')) {
      document.getElementById('ppanel').classList.remove('open');
    }
    if (!e.target.closest('#fpanel') && !e.target.closest('#btn-filter')) {
      document.getElementById('fpanel').classList.remove('open');
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Window resize with debounce
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      if (window.jss) {
        const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
        const el = inst.content || document.querySelector('#ss-jss .jexcel_content');
        if (el) {
          el.style.height = gridModule.getGridHeight() + 'px';
        } else {
          gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
        }
      }
    }, 220);
  });
  
  // File input change
  document.getElementById('csvinp').addEventListener('change', function() {
    if (this.files[0]) {
      fileHandler.processFile(this.files[0]);
      this.value = '';
    }
  });
  
  // Drag and drop
  setupDragAndDrop();
  
  // Paste handler
  document.getElementById('csv-paste').addEventListener('input', function() {
    const value = this.value;
    if (value.trim().length > 30) {
      clearTimeout(window._pt);
      window._pt = setTimeout(function() {
        fileHandler.parseText(value, 'pasted-data.csv');
      }, 600);
    }
  });
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboard(e) {
  // Ctrl/Cmd + F - Search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    if (window.jss) {
      searchModule.toggle();
    }
  }
  
  // Escape - Close panels
  if (e.key === 'Escape') {
    uiModule.closeAllPanels();
    document.getElementById('ctx').classList.remove('open');
    if (window.searchOpen) {
      searchModule.toggle();
    }
  }
  
  // Ctrl/Cmd + B - Bold
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    formatBar.toggleBold();
  }
  
  // Ctrl/Cmd + I - Italic
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    formatBar.toggleItalic();
  }
  
  // Ctrl/Cmd + U - Underline
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
    e.preventDefault();
    formatBar.toggleUnderline();
  }
}

/**
 * Set up drag and drop for file upload
 */
function setupDragAndDrop() {
  const dz = document.getElementById('dz');
  
  dz.addEventListener('dragover', function(e) {
    e.preventDefault();
    dz.classList.add('over');
  });
  
  dz.addEventListener('dragleave', function() {
    dz.classList.remove('over');
  });
  
  dz.addEventListener('drop', function(e) {
    e.preventDefault();
    dz.classList.remove('over');
    if (e.dataTransfer.files[0]) {
      fileHandler.processFile(e.dataTransfer.files[0]);
    }
  });
}

/**
 * Load data and display grid
 */
function loadData(data, filename) {
  if (!state.loadData(data, filename)) return;
  
  // Navigate to shortener view
  uiModule.navigateTo('shortener');
  
  // Show/hide appropriate elements
  document.getElementById('ss-upload').style.display = 'none';
  document.getElementById('ss-grid').classList.add('vis');
  document.getElementById('ss-fmt').classList.add('vis');
  
  // Show file pill
  const pill = document.getElementById('ss-pill');
  pill.style.display = 'flex';
  document.getElementById('ss-pill-name').textContent = filename;
  
  // Enable toolbar buttons
  const buttonIds = [
    'btn-cols', 'btn-preset', 'btn-filter', 'btn-srch',
    'btn-addrow', 'btn-delrow', 'btn-delcol',
    'btn-csv', 'btn-xlsx', 'btn-drive'
  ];
  
  buttonIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
  
  // Build grid and panels
  gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
  columnsPanel.buildColList();
  filterPanel.buildFpCols();
  statusBar.update();
  
  uiModule.toast('✓ Loaded ' + filename + ' — ' + window.filteredData.length + ' rows, ' + window.headers.length + ' cols');
}

// Row/Column operations
function doAddRow() {
  if (!window.jss) return;
  try {
    const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
    inst.insertRow();
    gridModule.syncData(window.jss, window.headers, window.colVisible, window.filteredData);
    statusBar.update();
    uiModule.toast('Row added');
  } catch (e) {
    uiModule.toast('Error: ' + e.message);
  }
}

function doDelRows() {
  if (!window.jss) return;
  if (!confirm('Delete selected row(s)?')) return;
  
  try {
    const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
    const sel = inst.getSelectedRows ? inst.getSelectedRows() : null;
    
    if (sel && sel.length) {
      sel.sort((a, b) => b - a).forEach(r => inst.deleteRow(r));
    } else {
      inst.deleteRow(window.ctxR || 0);
    }
    
    gridModule.syncData(window.jss, window.headers, window.colVisible, window.filteredData);
    statusBar.update();
    uiModule.toast('Row(s) deleted');
  } catch (e) {
    uiModule.toast('Error: ' + e.message);
  }
}

function doDelCols() {
  if (!window.jss) return;
  if (!confirm('Delete selected column(s)? This cannot be undone.')) return;
  
  try {
    const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
    const sel = inst.getSelectedColumns ? inst.getSelectedColumns() : null;
    
    if (sel && sel.length) {
      sel.sort((a, b) => b - a).forEach(c => inst.deleteColumn(c));
    } else {
      inst.deleteColumn(window.ctxC || 0);
    }
    
    gridModule.syncHeaders(window.jss, window.headers, window.colVisible);
    gridModule.syncData(window.jss, window.headers, window.colVisible, window.filteredData);
    statusBar.update();
    uiModule.toast('Col(s) deleted');
  } catch (e) {
    uiModule.toast('Error: ' + e.message);
  }
}

// Search functionality
const searchModule = {
  toggle: function() {
    const bar = document.getElementById('ss-srch');
    window.searchOpen = !window.searchOpen;
    bar.classList.toggle('open', window.searchOpen);
    
    if (window.searchOpen) {
      document.getElementById('ss-srch-inp').focus();
    } else {
      document.getElementById('ss-srch-inp').value = '';
      this.clearHighlights();
    }
  },
  
  execute: utils.debounce(function(query) {
    if (!window.jss) return;
    
    query = query.toLowerCase().trim();
    const countEl = document.getElementById('ss-srch-n');
    
    if (!query) {
      countEl.textContent = '';
      this.clearHighlights();
      return;
    }
    
    let matchCount = 0;
    
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const data = inst.getData ? inst.getData() : [];
      
      data.forEach((row, y) => {
        row.forEach((cell, x) => {
          const td = inst.getCellFromCoords ? inst.getCellFromCoords(x, y) : null;
          if (!td) return;
          
          const hit = cell !== '' && String(cell).toLowerCase().includes(query);
          td.style.background = hit ? '#fef08a' : '';
          if (hit) matchCount++;
        });
      });
      
      countEl.textContent = matchCount 
        ? matchCount + ' match' + (matchCount > 1 ? 'es' : '') 
        : 'No matches';
    } catch (e) {
      console.warn('Search error:', e);
    }
  }, 300),
  
  clearHighlights: function() {
    if (!window.jss) return;
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const data = inst.getData ? inst.getData() : [];
      
      data.forEach((row, y) => {
        row.forEach((_, x) => {
          const td = inst.getCellFromCoords ? inst.getCellFromCoords(x, y) : null;
          if (td) td.style.background = '';
        });
      });
    } catch (e) {}
  }
};

// File handling
const fileHandler = {
  processFile: function(file) {
    // Validate file type
    if (!utils.validateFileType(file, ['.csv', '.tsv', '.txt', 'text/csv', 'text/tab-separated-values'])) {
      uiModule.toast('Please select a CSV, TSV, or TXT file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (!utils.validateFileSize(file, 10 * 1024 * 1024)) {
      uiModule.toast('File too large. Maximum size is 10MB');
      return;
    }
    
    window.curFile = file;
    utils.setLoading(true);
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        utils.setLoading(false);
        loadData(result.data, file.name);
      },
      error: (error) => {
        utils.setLoading(false);
        uiModule.toast('Parse error: ' + error.message);
      }
    });
  },
  
  parseText: function(text, filename) {
    if (text.trim().length < 30) return;
    
    const result = Papa.parse(text, {
      header: false,
      skipEmptyLines: true
    });
    
    loadData(result.data, filename);
  }
};

// Export functions to global scope for HTML onclick handlers
window.goTo = uiModule.navigateTo;
window.openCP = columnsPanel.open.bind(columnsPanel);
window.openPP = presetPanel.open.bind(presetPanel);
window.openFP = filterPanel.open.bind(filterPanel);
window.closeAll = uiModule.closeAllPanels;
window.allCols = columnsPanel.toggleAll.bind(columnsPanel);
window.filterCols = columnsPanel.filterCols.bind(columnsPanel);
window.applyPs = presetPanel.applyPreset.bind(presetPanel);
window.delPreset = presetPanel.deletePreset.bind(presetPanel);
window.togglePsForm = presetPanel.toggleForm.bind(presetPanel);
window.savePsForm = presetPanel.saveForm.bind(presetPanel);
window.applyFilter = filterPanel.apply.bind(filterPanel);
window.clearFilter = filterPanel.clear.bind(filterPanel);
window.cx = contextMenu.execute.bind(contextMenu);
window.doAddRow = doAddRow;
window.doDelRows = doDelRows;
window.doDelCols = doDelCols;
window.toggleSearch = searchModule.toggle.bind(searchModule);
window.doSearch = searchModule.execute.bind(searchModule);
window.expCSV = exportModule.exportToCsv.bind(exportModule);
window.expXLSX = exportModule.exportToXlsx.bind(exportModule);
window.saveDrive = exportModule.saveToDrive.bind(exportModule);
window.onFileInput = function(inp) {
  if (inp.files[0]) fileHandler.processFile(inp.files[0]);
  inp.value = '';
};
window.onPaste = fileHandler.parseText.bind(fileHandler);
window.fmt = gridModule.applyFormat;
window.fmtClear = gridModule.clearFormat;

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
