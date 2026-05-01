/**
 * @fileoverview Format bar module - text formatting controls
 */

'use strict';

const formatBar = {
  /**
   * Update format button states based on current cell
   * @param {number} x - Cell x coordinate
   * @param {number} y - Cell y coordinate
   */
  updateStates: function(x, y) {
    if (!window.jss) return;
    
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const cell = inst.getCellFromCoords(x, y);
      if (!cell) return;
      
      // Toggle button states
      this.toggleButton('fb-bold', cell.style.fontWeight === 'bold');
      this.toggleButton('fb-italic', cell.style.fontStyle === 'italic');
      const td = cell.style.textDecoration || '';
      this.toggleButton('fb-under', td.includes('underline'));
      this.toggleButton('fb-strike', td.includes('line-through'));
      this.toggleButton('fb-wrap', cell.style.whiteSpace === 'normal');
    } catch (e) {
      console.warn('Update format states error:', e);
    }
  },
  
  /**
   * Toggle button on/off state
   * @param {string} id - Button element ID
   * @param {boolean} on - Whether button should be on
   */
  toggleButton: function(id, on) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.toggle('on', on);
    }
  },
  
  /**
   * Apply font family
   * @param {string} value - Font family
   */
  setFontFamily: function(value) {
    if (!window.jss) return;
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const selection = inst.getSelected ? inst.getSelected() : null;
      if (!selection) {
        uiModule.toast('Select a cell first');
        return;
      }
      
      const x1 = Math.min(selection[0], selection[2]);
      const y1 = Math.min(selection[1], selection[3]);
      const cell = inst.getCellFromCoords(x1, y1);
      if (cell) {
        cell.style.setProperty('font-family', value, 'important');
      }
      
      // Update session styles
      const visibleIndices = Object.keys(window.colVisible)
        .filter(i => window.colVisible[i])
        .map(Number);
      let displayData = window.filteredData.slice();
      if (window.activeFilters.length) {
        displayData = filterModule.applyFilters(window.filteredData, window.activeFilters, window.headers);
      }
      const rowData = displayData[y1];
      if (rowData) {
        const oriRowIdx = window.filteredData.indexOf(rowData);
        const oriColIdx = visibleIndices[x1];
        const key = oriRowIdx + '_' + oriColIdx;
        if (!gridModule.sessionStyles[key]) gridModule.sessionStyles[key] = {};
        gridModule.sessionStyles[key]['font-family'] = value;
      }
    } catch (e) {
      console.warn('Set font family error:', e);
    }
  },
  
  /**
   * Apply font size
   * @param {string} value - Font size in px
   */
  setFontSize: function(value) {
    if (!window.jss) return;
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const selection = inst.getSelected ? inst.getSelected() : null;
      if (!selection) {
        uiModule.toast('Select a cell first');
        return;
      }
      
      const x1 = Math.min(selection[0], selection[2]);
      const y1 = Math.min(selection[1], selection[3]);
      const cell = inst.getCellFromCoords(x1, y1);
      if (cell) {
        cell.style.setProperty('font-size', value + 'px', 'important');
      }
      
      // Update session styles
      const visibleIndices = Object.keys(window.colVisible)
        .filter(i => window.colVisible[i])
        .map(Number);
      let displayData = window.filteredData.slice();
      if (window.activeFilters.length) {
        displayData = filterModule.applyFilters(window.filteredData, window.activeFilters, window.headers);
      }
      const rowData = displayData[y1];
      if (rowData) {
        const oriRowIdx = window.filteredData.indexOf(rowData);
        const oriColIdx = visibleIndices[x1];
        const key = oriRowIdx + '_' + oriColIdx;
        if (!gridModule.sessionStyles[key]) gridModule.sessionStyles[key] = {};
        gridModule.sessionStyles[key]['font-size'] = value + 'px';
      }
    } catch (e) {
      console.warn('Set font size error:', e);
    }
  },
  
  /**
   * Apply text color
   * @param {string} value - Color value
   */
  setTextColor: function(value) {
    gridModule.applyFormat('color', value);
    const swatch = document.getElementById('tc-sw');
    if (swatch) swatch.style.background = value;
  },
  
  /**
   * Apply background color
   * @param {string} value - Color value
   */
  setBackgroundColor: function(value) {
    gridModule.applyFormat('background', value);
    const swatch = document.getElementById('bc-sw');
    if (swatch) swatch.style.background = value;
  },
  
  /**
   * Apply text alignment
   * @param {string} value - Alignment (left, center, right)
   */
  setTextAlign: function(value) {
    gridModule.applyFormat('textAlign', value);
  },
  
  /**
   * Toggle bold
   */
  toggleBold: function() {
    gridModule.applyFormat('bold');
  },
  
  /**
   * Toggle italic
   */
  toggleItalic: function() {
    gridModule.applyFormat('italic');
  },
  
  /**
   * Toggle underline
   */
  toggleUnderline: function() {
    gridModule.applyFormat('underline');
  },
  
  /**
   * Toggle strikethrough
   */
  toggleStrike: function() {
    gridModule.applyFormat('strike');
  },
  
  /**
   * Toggle text wrap
   */
  toggleWrap: function() {
    gridModule.applyFormat('wrap');
  },
  
  /**
   * Clear all formatting
   */
  clearFormatting: function() {
    gridModule.clearFormat();
  }
};

// Export
window.formatBar = formatBar;
