/**
 * @fileoverview State management module - centralized application state
 */

'use strict';

const state = {
  // LocalStorage key for presets
  PKEY: 'rl_ps_v2',
  
  // Built-in presets
  BUILTIN: [
    { id: '__all__', name: 'Show All Columns', cols: null, bi: true },
    { id: '__hcl__', name: 'HCL', cols: [0, 1, 3, 5, 7], bi: true }
  ],
  
  // User presets loaded from localStorage
  userPresets: [],
  
  // Application state (initialized by init())
  rawData: [],
  filteredData: [],
  headers: [],
  colVisible: {},
  activeFilters: [],
  currentFile: null,
  searchOpen: false,
  ctxR: null,
  ctxC: null,
  
  /**
   * Initialize state from localStorage
   */
  init: function() {
    try {
      this.userPresets = JSON.parse(localStorage.getItem(this.PKEY) || '[]');
    } catch (e) {
      console.warn('Failed to load presets:', e);
      this.userPresets = [];
    }
    
    // Set up global references for backward compatibility
    window.headers = this.headers;
    window.filteredData = this.filteredData;
    window.colVisible = this.colVisible;
    window.activeFilters = this.activeFilters;
    window.ctxR = this.ctxR;
    window.ctxC = this.ctxC;
    window.curFile = this.currentFile;
  },
  
  /**
   * Load data into state
   */
  loadData: function(data, filename) {
    if (!data || data.length < 2) {
      uiModule.toast('Need a header row + at least one data row');
      return false;
    }
    
    this.rawData = data.map(r => r.slice());
    this.headers = this.rawData[0].map(String);
    this.filteredData = this.rawData.slice(1);
    this.activeFilters = [];
    this.currentFile = filename;
    
    // Initialize column visibility
    this.colVisible = {};
    this.headers.forEach((_, i) => {
      this.colVisible[i] = true;
    });
    
    // Update global references
    window.headers = this.headers;
    window.filteredData = this.filteredData;
    window.colVisible = this.colVisible;
    window.activeFilters = this.activeFilters;
    window.curFile = this.currentFile;
    
    return true;
  },
  
  /**
   * Clear all data
   */
  clear: function() {
    this.rawData = [];
    this.filteredData = [];
    this.headers = [];
    this.colVisible = {};
    this.activeFilters = [];
    this.currentFile = null;
    
    window.headers = [];
    window.filteredData = [];
    window.colVisible = {};
    window.activeFilters = [];
    window.curFile = null;
  },
  
  /**
   * Save user preset
   */
  savePreset: function(name, columns) {
    const preset = {
      id: 'p_' + Date.now(),
      name: name,
      cols: columns,
      bi: false
    };
    
    this.userPresets.push(preset);
    
    try {
      localStorage.setItem(this.PKEY, JSON.stringify(this.userPresets));
      return true;
    } catch (e) {
      console.warn('Failed to save preset:', e);
      return false;
    }
  },
  
  /**
   * Delete user preset
   */
  deletePreset: function(id) {
    this.userPresets = this.userPresets.filter(p => p.id !== id);
    try {
      localStorage.setItem(this.PKEY, JSON.stringify(this.userPresets));
      return true;
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Get all presets (built-in + user)
   */
  getAllPresets: function() {
    return this.BUILTIN.concat(this.userPresets);
  }
};

// Export
window.state = state;
