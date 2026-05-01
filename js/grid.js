/**
 * @fileoverview Grid management module for JSpreadsheet operations
 * Handles grid initialization, data rendering, and cell operations
 */

'use strict';

// Session-based cell styles storage
let sessionStyles = {};

/**
 * Initialize the spreadsheet grid
 * @param {Array} headers - Column headers
 * @param {Object} colVisible - Visibility map for columns
 * @param {Array} filteredData - Data rows to display
 * @param {Array} activeFilters - Active filter configurations
 */
function buildGrid(headers, colVisible, filteredData, activeFilters) {
  const container = document.getElementById('ss-jss');
  
  // Destroy existing grid instance
  if (window.jss) {
    try {
      const instance = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    } catch (e) {
      console.warn('Grid destroy error:', e);
    }
    container.innerHTML = '';
    window.jss = null;
  }

  // Get visible column indices
  const visibleIndices = Object.keys(colVisible)
    .filter(i => colVisible[i])
    .map(Number);
    
  if (visibleIndices.length === 0) {
    utils.toast('No visible columns');
    return;
  }

  // Apply filters if any
  let displayData = filteredData.slice();
  if (activeFilters.length) {
    displayData = filterModule.applyFilters(filteredData, activeFilters, headers);
  }

  // Build column definitions
  const columns = visibleIndices.map(i => ({
    title: headers[i],
    width: Math.max(90, Math.min(220, String(headers[i]).length * 9 + 24)),
    type: 'text'
  }));

  // Transform data for visible columns only
  const tableData = displayData.map(row => 
    visibleIndices.map(i => row[i] !== undefined ? String(row[i]) : '')
  );

  // Add empty row if no data
  if (tableData.length === 0) {
    tableData.push(new Array(visibleIndices.length).fill(''));
  }

  // Map session styles to current grid coordinates
  const gridStyles = mapSessionStyles(displayData, visibleIndices);

  try {
    window.jss = jspreadsheet(container, {
      data: tableData,
      columns: columns,
      tableOverflow: true,
      tableWidth: '100%',
      tableHeight: getGridHeight() + 'px',
      columnSorting: true,
      columnDrag: true,
      columnResize: true,
      rowResize: true,
      rowDrag: true,
      editable: true,
      allowInsertRow: true,
      allowInsertColumn: true,
      allowDeleteRow: true,
      allowDeleteColumn: true,
      allowRenameColumn: true,
      search: false,
      pagination: false,
      style: gridStyles,
      // Mobile-friendly touch settings
      touchMove: true,
      pinchZoom: false,
      updateTable: function(el, cell, x, y) {
        if (!cell.style.backgroundColor && !cell.style.background) {
          cell.style.background = y % 2 === 0 ? '' : '#f9fafb';
        }
      },
      onselection: function(el, x1, y1, x2, y2) {
        handleSelection(x1, y1, x2, y2);
      },
      onchange: function(el, cell, x, y, val) {
        if (filteredData[y]) {
          filteredData[y][visibleIndices[x]] = val;
        }
      },
      oncontextmenu: function(el, x, y, e) {
        window.ctxR = y;
        window.ctxC = x;
        contextMenu.open(e);
        return false;
      },
      oninsertrow: function() {
        syncData(window.jss, headers, colVisible, filteredData);
        statusBar.update();
      },
      deleterow: function() {
        syncData(window.jss, headers, colVisible, filteredData);
        statusBar.update();
      },
      oninsertcolumn: function() {
        syncHeaders(window.jss, headers, colVisible);
        statusBar.update();
      },
      ondeletecolumn: function() {
        syncHeaders(window.jss, headers, colVisible);
        syncData(window.jss, headers, colVisible, filteredData);
        statusBar.update();
      },
      onrenamecolumn: function(el, col, oldName, newName) {
        if (visibleIndices[col] !== undefined) {
          headers[visibleIndices[col]] = newName;
        }
        columnsPanel.buildColList();
        filterPanel.buildFpCols();
      }
    });
  } catch (e) {
    utils.toast('Grid error: ' + e.message);
    console.error('Grid initialization error:', e);
  }

  statusBar.update();
}

/**
 * Map session styles to grid coordinates
 */
function mapSessionStyles(displayData, visibleIndices) {
  const gridStyles = {};
  displayData.forEach((row, y) => {
    const oriRowIdx = window.filteredData.indexOf(row);
    if (oriRowIdx === -1) return;
    visibleIndices.forEach((oriColIdx, x) => {
      const key = oriRowIdx + '_' + oriColIdx;
      const s = sessionStyles[key];
      if (s) {
        const cellName = jspreadsheet.helpers.getColumnName(x) + (y + 1);
        let styleStr = '';
        for (const [k, v] of Object.entries(s)) {
          styleStr += k + ':' + v + ';';
        }
        gridStyles[cellName] = styleStr;
      }
    });
  });
  return gridStyles;
}

/**
 * Handle cell selection events
 */
function handleSelection(x1, y1, x2, y2) {
  const refCell = document.getElementById('ss-cref');
  const valCell = document.getElementById('ss-cval');
  const selIndicator = document.getElementById('sb-s');

  // Update cell reference display
  refCell.value = jspreadsheet.helpers.getColumnName(x1) + (y1 + 1);

  // Get cell value
  try {
    const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
    valCell.value = (inst.getValue ? inst.getValue(x1, y1) : '') || '';
  } catch (e) {
    valCell.value = '';
  }

  // Show selection size indicator
  const rs = Math.abs(y2 - y1) + 1;
  const cs = Math.abs(x2 - x1) + 1;
  selIndicator.innerHTML = (rs > 1 || cs > 1) 
    ? '<strong>' + rs + '×' + cs + '</strong>&nbsp;sel' 
    : '';

  // Update format toolbar state
  formatBar.updateStates(x1, y1);
}

/**
 * Calculate optimal grid height
 */
function getGridHeight() {
  const gridContainer = document.getElementById('ss-grid');
  const availableHeight = gridContainer.clientHeight;
  
  if (availableHeight > 60) {
    return Math.max(120, 
      availableHeight - 
      (document.getElementById('ss-fbar').offsetHeight || 30) - 
      (document.getElementById('ss-sb').offsetHeight || 26) - 4
    );
  }
  
  const searchHeight = document.getElementById('ss-srch').classList.contains('open') ? 38 : 0;
  const fmtHeight = document.getElementById('ss-fmt').classList.contains('vis') 
    ? (document.getElementById('ss-fmt').offsetHeight || 38) : 0;
  
  return Math.max(180, 
    window.innerHeight - 
    (document.getElementById('app-header').offsetHeight || 52) - 
    (document.getElementById('ss-tb').offsetHeight || 42) - 
    fmtHeight - searchHeight - 30 - 26 - 4
  );
}

/**
 * Sync grid data back to filteredData array
 */
function syncData(grid, headers, colVisible, filteredData) {
  if (!grid) return;
  try {
    const inst = Array.isArray(grid) ? grid[0] : grid;
    const data = inst.getData ? inst.getData() : [];
    const visibleIndices = Object.keys(colVisible)
      .filter(x => colVisible[x])
      .map(Number);
    
    filteredData.length = 0;
    data.forEach(row => {
      const fullRow = new Array(headers.length).fill('');
      visibleIndices.forEach((colIdx, x) => {
        fullRow[colIdx] = row[x] || '';
      });
      filteredData.push(fullRow);
    });
  } catch (e) {
    console.warn('Sync data error:', e);
  }
}

/**
 * Sync header changes from grid
 */
function syncHeaders(grid, headers, colVisible) {
  if (!grid) return;
  try {
    const inst = Array.isArray(grid) ? grid[0] : grid;
    const newHeaders = inst.getHeaders ? inst.getHeaders() : null;
    if (newHeaders) {
      const visibleIndices = Object.keys(colVisible)
        .filter(x => colVisible[x])
        .map(Number);
      newHeaders.split(',').forEach((hName, x) => {
        if (visibleIndices[x] !== undefined) {
          headers[visibleIndices[x]] = hName.trim();
        }
      });
    }
  } catch (e) {
    console.warn('Sync headers error:', e);
  }
}

/**
 * Apply formatting to selected cells
 */
function applyFormat(type, value) {
  if (!window.jss) return;
  
  try {
    const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
    const selection = inst.getSelected ? inst.getSelected() : null;
    if (!selection || selection.length === 0) {
      uiModule.toast('Select a cell first');
      return;
    }

    const x1 = Math.min(selection[0], selection[2]);
    const x2 = Math.max(selection[0], selection[2]);
    const y1 = Math.min(selection[1], selection[3]);
    const y2 = Math.max(selection[1], selection[3]);

    const visibleIndices = Object.keys(window.colVisible)
      .filter(i => window.colVisible[i])
      .map(Number);
    
    let displayData = window.filteredData.slice();
    if (window.activeFilters.length) {
      displayData = filterModule.applyFilters(window.filteredData, window.activeFilters, window.headers);
    }

    // Check if toggling off
    let toggleOn = false;
    const firstCell = inst.getCellFromCoords(x1, y1);
    if (firstCell) {
      if (type === 'bold') toggleOn = firstCell.style.fontWeight === 'bold';
      if (type === 'italic') toggleOn = firstCell.style.fontStyle === 'italic';
      if (type === 'underline') {
        const td = firstCell.style.textDecoration || '';
        toggleOn = td.includes('underline');
      }
      if (type === 'strike') {
        const td = firstCell.style.textDecoration || '';
        toggleOn = td.includes('line-through');
      }
      if (type === 'wrap') toggleOn = firstCell.style.whiteSpace === 'normal';
    }

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const cell = inst.getCellFromCoords(x, y);
        if (!cell) continue;

        const rowData = displayData[y];
        if (!rowData) continue;
        
        const oriRowIdx = window.filteredData.indexOf(rowData);
        if (oriRowIdx === -1) continue;
        
        const oriColIdx = visibleIndices[x];
        const key = oriRowIdx + '_' + oriColIdx;
        if (!sessionStyles[key]) sessionStyles[key] = {};

        switch(type) {
          case 'bold': {
            const val = toggleOn ? 'normal' : 'bold';
            cell.style.setProperty('font-weight', val, 'important');
            sessionStyles[key]['font-weight'] = val;
            break;
          }
          case 'italic': {
            const val = toggleOn ? 'normal' : 'italic';
            cell.style.setProperty('font-style', val, 'important');
            sessionStyles[key]['font-style'] = val;
            break;
          }
          case 'underline': {
            // Get current text-decoration value
            let currentTd = cell.style.textDecoration || sessionStyles[key]['text-decoration'] || '';
            if (toggleOn) {
              // Remove underline
              currentTd = currentTd.replace('underline', '').trim();
              if (!currentTd) currentTd = 'none';
            } else {
              // Add underline
              if (currentTd === 'none' || !currentTd) {
                currentTd = 'underline';
              } else if (!currentTd.includes('underline')) {
                currentTd = currentTd + ' underline';
              }
            }
            cell.style.setProperty('text-decoration', currentTd, 'important');
            sessionStyles[key]['text-decoration'] = currentTd;
            break;
          }
          case 'strike': {
            // Get current text-decoration value
            let currentTd = cell.style.textDecoration || sessionStyles[key]['text-decoration'] || '';
            if (toggleOn) {
              // Remove line-through
              currentTd = currentTd.replace('line-through', '').trim();
              if (!currentTd) currentTd = 'none';
            } else {
              // Add line-through
              if (currentTd === 'none' || !currentTd) {
                currentTd = 'line-through';
              } else if (!currentTd.includes('line-through')) {
                currentTd = currentTd + ' line-through';
              }
            }
            cell.style.setProperty('text-decoration', currentTd, 'important');
            sessionStyles[key]['text-decoration'] = currentTd;
            break;
          }
          case 'color':
            cell.style.setProperty('color', value, 'important');
            sessionStyles[key]['color'] = value;
            if (document.getElementById('tc-sw')) {
              document.getElementById('tc-sw').style.background = value;
            }
            break;
          case 'background':
            cell.style.setProperty('background-color', value, 'important');
            sessionStyles[key]['background-color'] = value;
            if (document.getElementById('bc-sw')) {
              document.getElementById('bc-sw').style.background = value;
            }
            break;
          case 'textAlign':
            cell.style.setProperty('text-align', value, 'important');
            sessionStyles[key]['text-align'] = value;
            break;
          case 'fontFamily':
            cell.style.setProperty('font-family', value, 'important');
            sessionStyles[key]['font-family'] = value;
            break;
          case 'fontSize':
            cell.style.setProperty('font-size', value, 'important');
            sessionStyles[key]['font-size'] = value;
            break;
          case 'wrap': {
            const val = toggleOn ? 'nowrap' : 'normal';
            cell.style.setProperty('white-space', val, 'important');
            cell.style.setProperty('overflow', toggleOn ? 'hidden' : 'visible', 'important');
            sessionStyles[key]['white-space'] = val;
            sessionStyles[key]['overflow'] = toggleOn ? 'hidden' : 'visible';
            break;
          }
        }
      }
    }
    formatBar.updateStates(x1, y1);
  } catch (e) {
    console.warn('Format error:', e);
  }
}

/**
 * Clear formatting from selected cells
 */
function clearFormat() {
  if (!window.jss) return;
  
  try {
    const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
    const selection = inst.getSelected ? inst.getSelected() : null;
    if (!selection) return;

    const x1 = Math.min(selection[0], selection[2]);
    const x2 = Math.max(selection[0], selection[2]);
    const y1 = Math.min(selection[1], selection[3]);
    const y2 = Math.max(selection[1], selection[3]);

    const visibleIndices = Object.keys(window.colVisible)
      .filter(i => window.colVisible[i])
      .map(Number);
    
    let displayData = window.filteredData.slice();
    if (window.activeFilters.length) {
      displayData = filterModule.applyFilters(window.filteredData, window.activeFilters, window.headers);
    }

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const cell = inst.getCellFromCoords ? inst.getCellFromCoords(x, y) : null;
        if (cell) cell.removeAttribute('style');
        
        const rowData = displayData[y];
        if (rowData) {
          const oriRowIdx = window.filteredData.indexOf(rowData);
          const oriColIdx = visibleIndices[x];
          delete sessionStyles[oriRowIdx + '_' + oriColIdx];
        }
      }
    }
    formatBar.updateStates(x1, y1);
    utils.toast('Formatting cleared');
  } catch (e) {
    console.warn('Clear format error:', e);
  }
}

// Export functions
window.gridModule = {
  buildGrid,
  getGridHeight,
  syncData,
  syncHeaders,
  applyFormat,
  clearFormat,
  sessionStyles
};
