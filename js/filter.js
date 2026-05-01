/**
 * @fileoverview Filter module - row filtering operations
 */

'use strict';

const filterModule = {
  /**
   * Apply filters to data
   * @param {Array} data - Data rows to filter
   * @param {Array} filters - Filter configurations
   * @param {Array} headers - Column headers
   * @returns {Array} Filtered data
   */
  applyFilters: function(data, filters, headers) {
    if (!filters || filters.length === 0) return data.slice();
    
    return data.filter(row => {
      return filters.every(f => {
        const cellValue = String(row[f.col] || '').toLowerCase();
        const filterValue = f.value.toLowerCase();
        
        switch (f.condition) {
          case 'contains':
            return cellValue.includes(filterValue);
          case 'not_contains':
            return !cellValue.includes(filterValue);
          case 'equals':
            return cellValue === filterValue;
          case 'not_equals':
            return cellValue !== filterValue;
          case 'starts_with':
            return cellValue.startsWith(filterValue);
          case 'ends_with':
            return cellValue.endsWith(filterValue);
          case 'gt':
            return parseFloat(cellValue) > parseFloat(filterValue);
          case 'lt':
            return parseFloat(cellValue) < parseFloat(filterValue);
          case 'not_empty':
            return cellValue.trim() !== '';
          case 'empty':
            return cellValue.trim() === '';
          default:
            return true;
        }
      });
    });
  },
  
  /**
   * Validate filter configuration
   * @param {Object} filter - Filter configuration
   * @returns {boolean} True if valid
   */
  validateFilter: function(filter) {
    if (!filter) return false;
    if (typeof filter.col !== 'number') return false;
    if (!filter.condition) return false;
    
    // Conditions that don't require a value
    const noValueConditions = ['not_empty', 'empty'];
    if (!noValueConditions.includes(filter.condition) && !filter.value) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Create filter object
   * @param {number} col - Column index
   * @param {string} condition - Filter condition
   * @param {string} value - Filter value
   * @returns {Object} Filter object
   */
  createFilter: function(col, condition, value) {
    return { col, condition, value };
  },
  
  /**
   * Get unique values from a column (for filter suggestions)
   * @param {Array} data - Data rows
   * @param {number} colIndex - Column index
   * @param {number} limit - Max values to return
   * @returns {Array} Unique values
   */
  getUniqueValues: function(data, colIndex, limit) {
    const values = new Set();
    for (const row of data) {
      if (row[colIndex] !== undefined && row[colIndex] !== '') {
        values.add(String(row[colIndex]));
      }
      if (values.size >= limit) break;
    }
    return Array.from(values).sort();
  }
};

// Export
window.filterModule = filterModule;
