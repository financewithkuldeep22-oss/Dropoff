/**
 * @fileoverview Status bar module - display row/col counts and status
 */

'use strict';

const statusBar = {
  /**
   * Update status bar with current counts
   */
  update: function() {
    const visibleCount = Object.values(window.colVisible).filter(Boolean).length;
    const totalCount = window.headers.length;
    
    // Calculate displayed rows (after filtering)
    let displayedRows = window.filteredData.length;
    if (window.activeFilters.length) {
      displayedRows = filterModule.applyFilters(
        window.filteredData, 
        window.activeFilters, 
        window.headers
      ).length;
    }
    
    // Update DOM elements
    const rowsEl = document.getElementById('sb-r');
    const colsEl = document.getElementById('sb-c');
    const hiddenEl = document.getElementById('sb-h');
    const filteredEl = document.getElementById('sb-f');
    const badgeRows = document.getElementById('fbadge-r');
    const badgeCols = document.getElementById('fbadge-c');
    
    if (rowsEl) rowsEl.textContent = displayedRows;
    if (colsEl) colsEl.textContent = visibleCount;
    
    // Show hidden columns badge
    if (hiddenEl) {
      hiddenEl.innerHTML = visibleCount < totalCount 
        ? '<span class="badge badge-b">' + (totalCount - visibleCount) + ' hidden</span>' 
        : '';
    }
    
    // Show filtered badge
    if (filteredEl) {
      filteredEl.innerHTML = window.activeFilters.length 
        ? '<span class="badge badge-r">Filtered</span>' 
        : '';
    }
    
    // Update format bar badges
    if (badgeRows) badgeRows.textContent = displayedRows + ' rows';
    if (badgeCols) badgeCols.textContent = visibleCount + ' cols';
  },
  
  /**
   * Show custom message in status bar
   * @param {string} message - Message to display
   * @param {number} duration - Duration in ms
   */
  showMessage: function(message, duration) {
    const statusEl = document.getElementById('sb-s');
    if (statusEl) {
      statusEl.innerHTML = '<strong>' + utils.sanitizeHtml(message) + '</strong>';
      if (duration) {
        setTimeout(() => {
          statusEl.innerHTML = '';
        }, duration);
      }
    }
  },
  
  /**
   * Clear custom message
   */
  clearMessage: function() {
    const statusEl = document.getElementById('sb-s');
    if (statusEl) {
      statusEl.innerHTML = '';
    }
  }
};

// Export
window.statusBar = statusBar;
