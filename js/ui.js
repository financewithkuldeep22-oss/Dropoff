/**
 * @fileoverview UI management module - panels, navigation, toasts
 */

'use strict';

/**
 * Navigate to a different view
 * @param {string} view - View name ('dashboard' or 'shortener')
 */
function navigateTo(view) {
  // Hide all views
  document.querySelectorAll('.pview').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Show target view
  const viewEl = document.getElementById('view-' + view);
  const navEl = document.getElementById('nav-' + view);
  
  if (viewEl) viewEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  
  // Update header title
  const titles = { dashboard: 'Home', shortener: 'Sheet Shortener' };
  document.getElementById('hdr-title').textContent = titles[view] || view;
  
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mob-open');
  document.getElementById('sb-ov').classList.remove('vis');
  
  // Rebuild grid if navigating to shortener
  if (view === 'shortener' && window.jss) {
    setTimeout(() => gridModule.buildGrid(
      window.headers, 
      window.colVisible, 
      window.filteredData, 
      window.activeFilters
    ), 60);
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Display duration in ms
 */
function toast(message, duration) {
  duration = duration || 3000;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.getElementById('toasts').appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, duration);
}

/**
 * Position a panel relative to an anchor element
 */
function positionPanel(panel, anchor) {
  const rect = anchor.getBoundingClientRect();
  const panelWidth = panel.offsetWidth || parseInt(getComputedStyle(panel).minWidth) || 260;
  
  let left = rect.left;
  if (left + panelWidth > window.innerWidth - 8) {
    left = window.innerWidth - panelWidth - 8;
  }
  if (left < 8) left = 8;
  
  panel.style.top = (rect.bottom + 4) + 'px';
  panel.style.left = left + 'px';
}

/**
 * Close all open panels
 */
function closeAllPanels() {
  ['cpanel', 'ppanel', 'fpanel'].forEach(id => {
    document.getElementById(id).classList.remove('open');
  });
}

// Panel management modules
const columnsPanel = {
  open: function(e) {
    const panel = document.getElementById('cpanel');
    if (panel.classList.contains('open')) {
      closeAllPanels();
      return;
    }
    closeAllPanels();
    this.buildColList();
    document.getElementById('cp-srch').value = '';
    this.filterCols('');
    positionPanel(panel, e.currentTarget);
    panel.classList.add('open');
  },
  
  buildColList: function() {
    const list = document.getElementById('cp-list');
    list.innerHTML = '';
    
    window.headers.forEach((h, i) => {
      const item = document.createElement('div');
      item.className = 'cpItem';
      item.dataset.idx = i;
      item.innerHTML = 
        '<input type="checkbox" id="cc-' + i + '" ' + 
        (window.colVisible[i] ? 'checked' : '') + '/>' +
        '<label class="cpItem-lbl" for="cc-' + i + '">' + (h || '(empty)') + '</label>' +
        '<span class="cpItem-n">' + (i + 1) + '</span>';
      
      item.querySelector('input').addEventListener('change', ev => {
        window.colVisible[i] = ev.target.checked;
        gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
        statusBar.update();
      });
      
      list.appendChild(item);
    });
  },
  
  filterCols: function(query) {
    query = query.toLowerCase();
    document.querySelectorAll('.cpItem').forEach(item => {
      const label = item.querySelector('.cpItem-lbl');
      item.style.display = (label && label.textContent.toLowerCase().includes(query)) ? '' : 'none';
    });
  },
  
  toggleAll: function(show) {
    window.headers.forEach((_, i) => {
      window.colVisible[i] = show;
    });
    this.buildColList();
    gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
    statusBar.update();
  }
};

const presetPanel = {
  open: function(e) {
    const panel = document.getElementById('ppanel');
    if (panel.classList.contains('open')) {
      closeAllPanels();
      return;
    }
    closeAllPanels();
    this.renderPresets();
    positionPanel(panel, e.currentTarget);
    panel.classList.add('open');
  },
  
  renderPresets: function() {
    const list = document.getElementById('ps-list');
    const all = state.BUILTIN.concat(state.userPresets);
    
    if (!all.length) {
      list.innerHTML = '<div style="padding:12px 14px;font-size:12px;color:var(--ct3)">No presets yet.</div>';
      return;
    }
    
    list.innerHTML = '';
    all.forEach(preset => {
      const colDesc = preset.cols === null 
        ? 'All columns' 
        : 'Cols: ' + preset.cols.map(c => String.fromCharCode(65 + c)).join(', ');
      
      const badge = preset.bi 
        ? '<span class="pbdg pbdg-b">built-in</span>' 
        : '<span class="pbdg pbdg-c">custom</span>';
      
      const delBtn = !preset.bi 
        ? '<button class="psDel" onclick="presetPanel.deletePreset(\'' + preset.id + '\')" title="Delete"><span class="material-icons-round">delete_outline</span></button>' 
        : '';
      
      const row = document.createElement('div');
      row.className = 'psRow';
      row.innerHTML = 
        '<div class="psInfo">' +
          '<div class="psName">' + preset.name + '&nbsp;' + badge + '</div>' +
          '<div class="psCols">' + colDesc + '</div>' +
        '</div>' +
        '<button class="psApply" onclick="presetPanel.applyPreset(\'' + preset.id + '\')">Apply</button>' +
        delBtn;
      
      list.appendChild(row);
    });
  },
  
  applyPreset: function(id) {
    const preset = state.BUILTIN.find(x => x.id === id) || state.userPresets.find(x => x.id === id);
    if (!preset) return;
    
    if (preset.cols === null) {
      window.headers.forEach((_, i) => { window.colVisible[i] = true; });
    } else {
      window.headers.forEach((_, i) => {
        window.colVisible[i] = preset.cols.indexOf(i) !== -1;
      });
      
      if (!Object.values(window.colVisible).some(Boolean)) {
        window.headers.forEach((_, i) => { window.colVisible[i] = true; });
        toast('Preset cols exceed file width — showing all');
        return;
      }
    }
    
    gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
    columnsPanel.buildColList();
    statusBar.update();
    closeAllPanels();
    toast('✓ Preset "' + preset.name + '" applied');
  },
  
  deletePreset: function(id) {
    state.userPresets = state.userPresets.filter(p => p.id !== id);
    try {
      localStorage.setItem(state.PKEY, JSON.stringify(state.userPresets));
    } catch (e) {}
    this.renderPresets();
    toast('Preset deleted');
  },
  
  toggleForm: function() {
    const form = document.getElementById('ps-form');
    if (form.classList.contains('open')) {
      form.classList.remove('open');
    } else {
      form.classList.add('open');
      document.getElementById('pf-name').value = '';
      this.buildFormChips();
      setTimeout(() => document.getElementById('pf-name').focus(), 50);
    }
  },
  
  buildFormChips: function() {
    document.getElementById('pf-chips').innerHTML = window.headers.map((h, i) => 
      '<label class="pfChip">' +
        '<input type="checkbox" data-idx="' + i + '" checked/>' +
        '<span class="pfChip-l">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="pfChip-n">' + (h || '(empty)') + '</span>' +
      '</label>'
    ).join('');
  },
  
  saveForm: function() {
    const name = document.getElementById('pf-name').value.trim();
    if (!name) {
      toast('Enter a name');
      document.getElementById('pf-name').focus();
      return;
    }
    
    const cols = [];
    document.querySelectorAll('#pf-chips input[type=checkbox]').forEach(cb => {
      if (cb.checked) cols.push(parseInt(cb.getAttribute('data-idx')));
    });
    
    if (!cols.length) {
      toast('Select at least one column');
      return;
    }
    
    if (state.userPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast('"' + name + '" already exists');
      return;
    }
    
    state.userPresets.push({
      id: 'p_' + Date.now(),
      name: name,
      cols: cols,
      bi: false
    });
    
    try {
      localStorage.setItem(state.PKEY, JSON.stringify(state.userPresets));
    } catch (e) {}
    
    this.toggleForm();
    this.renderPresets();
    toast('✓ Preset "' + name + '" saved');
  }
};

const filterPanel = {
  open: function(e) {
    const panel = document.getElementById('fpanel');
    if (panel.classList.contains('open')) {
      closeAllPanels();
      return;
    }
    closeAllPanels();
    positionPanel(panel, e.currentTarget);
    panel.classList.add('open');
  },
  
  buildFpCols: function() {
    document.getElementById('fp-col').innerHTML = window.headers.map((h, i) => 
      '<option value="' + i + '">' + (h || 'Col ' + (i + 1)) + '</option>'
    ).join('');
  },
  
  apply: function() {
    const col = parseInt(document.getElementById('fp-col').value);
    const condition = document.getElementById('fp-cond').value;
    const value = document.getElementById('fp-val').value;
    
    window.activeFilters = [{ col, condition, value }];
    gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
    statusBar.update();
    closeAllPanels();
    toast('Filter on "' + (window.headers[col] || 'Col') + '"');
  },
  
  clear: function() {
    window.activeFilters = [];
    gridModule.buildGrid(window.headers, window.colVisible, window.filteredData, window.activeFilters);
    statusBar.update();
    closeAllPanels();
    toast('Filter cleared');
  }
};

const contextMenu = {
  open: function(e) {
    e.preventDefault();
    const menu = document.getElementById('ctx');
    menu.style.left = Math.min(e.clientX, window.innerWidth - 210) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - 260) + 'px';
    menu.classList.add('open');
  },
  
  execute: function(action) {
    document.getElementById('ctx').classList.remove('open');
    if (!window.jss) return;
    
    try {
      const inst = Array.isArray(window.jss) ? window.jss[0] : window.jss;
      
      switch(action) {
        case 'ins_above':
          inst.insertRow(1, window.ctxR, true);
          break;
        case 'ins_below':
          inst.insertRow(1, window.ctxR);
          break;
        case 'dup': {
          const data = inst.getData ? inst.getData() : [];
          if (data[window.ctxR]) {
            inst.insertRow(data[window.ctxR], window.ctxR + 1);
          }
          break;
        }
        case 'copy': {
          const data = inst.getData ? inst.getData() : [];
          if (data[window.ctxR]) {
            navigator.clipboard && navigator.clipboard.writeText(data[window.ctxR].join('\t'));
            toast('Row copied');
          }
          break;
        }
        case 'clear': {
          const numCols = inst.options && inst.options.columns 
            ? inst.options.columns.length 
            : window.headers.length;
          for (let x = 0; x < numCols; x++) {
            inst.setValue(x, window.ctxR, '');
          }
          break;
        }
        case 'del_row':
          inst.deleteRow(window.ctxR);
          break;
        case 'del_col':
          inst.deleteColumn(window.ctxC);
          gridModule.syncHeaders(window.jss, window.headers, window.colVisible);
          break;
      }
      
      gridModule.syncData(window.jss, window.headers, window.colVisible, window.filteredData);
      statusBar.update();
    } catch (e) {
      toast('Error: ' + e.message);
    }
  }
};

// Export modules
window.uiModule = {
  navigateTo,
  toast,
  closeAllPanels,
  positionPanel
};

window.columnsPanel = columnsPanel;
window.presetPanel = presetPanel;
window.filterPanel = filterPanel;
window.contextMenu = contextMenu;
