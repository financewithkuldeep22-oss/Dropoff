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
      this.toggleButton('fb-under', cell.style.textDecoration.includes('underline'));
      this.toggleButton('fb-strike', cell.style.textDecoration.includes('line-through'));
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
    gridModule.applyFormat('fontFamily', value);
  },
  
  /**
   * Apply font size
   * @param {string} value - Font size in px
   */
  setFontSize: function(value) {
    gridModule.applyFormat('fontSize', value + 'px');
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
