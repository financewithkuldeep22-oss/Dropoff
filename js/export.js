/**
 * @fileoverview Export module - CSV and XLSX export functionality
 */

'use strict';

const exportModule = {
  /**
   * Get exportable data from grid
   * @returns {Object} Object with headers and rows
   */
  getExportData: function() {
    if (!window.jss) return { headers: [], rows: [] };
    
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const visibleIndices = Object.keys(window.colVisible)
        .filter(x => window.colVisible[x])
        .map(Number);
      
      return {
        headers: visibleIndices.map(i => window.headers[i]),
        rows: inst.getData ? inst.getData() : []
      };
    } catch (e) {
      console.warn('Export error:', e);
      return { headers: [], rows: [] };
    }
  },
  
  /**
   * Export to CSV file
   */
  exportToCsv: function() {
    const data = this.getExportData();
    const lines = [data.headers, ...data.rows].map(row => 
      row.map(v => utils.escapeCsv(v)).join(',')
    );
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const filename = utils.generateFilename(window.curFile ? window.curFile.name : 'export', '.csv');
    
    utils.downloadBlob(blob, filename);
    uiModule.toast('CSV exported');
  },
  
  /**
   * Export to XLSX file
   */
  exportToXlsx: function() {
    const data = this.getExportData();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    const filename = utils.generateFilename(window.curFile ? window.curFile.name : 'export', '.xlsx');
    XLSX.writeFile(wb, filename);
    
    uiModule.toast('XLSX exported');
  },
  
  /**
   * Save to Google Drive (if in GAS environment)
   */
  saveToDrive: function() {
    const data = this.getExportData();
    const csvContent = [data.headers, ...data.rows].map(row => row.join(',')).join('\n');
    const filename = utils.generateFilename(window.curFile ? window.curFile.name : 'export', '.csv');
    
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      utils.setLoading(true);
      google.script.run
        .withSuccessHandler(url => {
          utils.setLoading(false);
          uiModule.toast('Saved to Drive' + (url ? ': ' + url : ''));
        })
        .withFailureHandler(err => {
          utils.setLoading(false);
          uiModule.toast('Drive error: ' + err.message);
        })
        .saveCsvToDrive(csvContent, filename);
    } else {
      uiModule.toast('Not in GAS — downloading locally');
      this.exportToCsv();
    }
  },
  
  /**
   * Copy selected rows to clipboard
   * @param {Array} rowIndexes - Row indexes to copy
   */
  copyRowsToClipboard: function(rowIndexes) {
    if (!window.jss || !rowIndexes.length) return;
    
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      const allData = inst.getData ? inst.getData() : [];
      
      const rowsToCopy = rowIndexes.map(i => allData[i]).filter(r => r);
      const text = rowsToCopy.map(row => row.join('\t')).join('\n');
      
      navigator.clipboard.writeText(text).then(() => {
        uiModule.toast('Copied ' + rowsToCopy.length + ' row(s)');
      }).catch(err => {
        console.warn('Clipboard error:', err);
        uiModule.toast('Failed to copy');
      });
    } catch (e) {
      console.warn('Copy error:', e);
      uiModule.toast('Failed to copy');
    }
  },
  
  /**
   * Validate data before export
   * @returns {boolean} True if valid
   */
  validateBeforeExport: function() {
    if (!window.jss) {
      uiModule.toast('No data to export');
      return false;
    }
    
    const data = this.getExportData();
    if (!data.rows || data.rows.length === 0) {
      uiModule.toast('No rows to export');
      return false;
    }
    
    // Check for very large datasets
    if (data.rows.length > 5000) {
      return confirm('Exporting ' + data.rows.length + ' rows may take a while. Continue?');
    }
    
    return true;
  }
};

// Export
window.exportModule = exportModule;
