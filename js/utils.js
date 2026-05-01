/**
 * @fileoverview Utility functions - common helpers, sanitization, debounce
 */

'use strict';

const utils = {
  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   */
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Sanitize HTML string to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHtml: function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  /**
   * Escape special characters for CSV
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeCsv: function(str) {
    const s = String(str || '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  },
  
  /**
   * Generate filename with date suffix
   * @param {string} baseName - Base filename
   * @param {string} extension - File extension
   * @returns {string} Generated filename
   */
  generateFilename: function(baseName, extension) {
    const base = baseName ? baseName.replace(/\.[^/.]+$/, '') : 'export';
    const date = new Date().toISOString().slice(0, 10);
    return base + '_' + date + extension;
  },
  
  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename for download
   */
  downloadBlob: function(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  /**
   * Validate file type
   * @param {File} file - File to validate
   * @param {Array} allowedTypes - Allowed MIME types or extensions
   * @returns {boolean} True if valid
   */
  validateFileType: function(file, allowedTypes) {
    if (!file) return false;
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      return fileType === type || fileType.includes(type);
    });
  },
  
  /**
   * Validate file size
   * @param {File} file - File to validate
   * @param {number} maxSizeBytes - Maximum size in bytes
   * @returns {boolean} True if valid
   */
  validateFileSize: function(file, maxSizeBytes) {
    return !file || file.size <= maxSizeBytes;
  },
  
  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize: function(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Get current greeting based on time
   * @returns {string} Greeting message
   */
  getGreeting: function() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },
  
  /**
   * Log error with context
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  logError: function(context, error) {
    console.error('[Error][' + context + ']', error);
    // Could send to error tracking service here
  },
  
  /**
   * Show loading state
   * @param {boolean} show - Whether to show loading
   */
  setLoading: function(show) {
    const prog = document.getElementById('prog');
    if (prog) {
      prog.classList.toggle('act', show);
    }
  }
};

// Export
window.utils = utils;
