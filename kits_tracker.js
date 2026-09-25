/**
 * =====================================================================
 * REDCLIFFE OPERATIONS: KITS & CONSUMABLES TRACKER CONTROLLER
 * =====================================================================
 * High-performance enterprise inventory & consignment tracking engine.
 * Supports dual views (Data Grid & Consignment Cards), multi-filtering,
 * courier docket intelligence, lead-time metrics, and instant caching.
 */

(function () {
  'use strict';

  // Global State
  window._kitsState = {
    allData: [],
    filteredData: [],
    viewMode: 'table', // 'table' | 'cards'
    filters: {
      search: '',
      status: 'all',
      clinic: 'all',
      city: 'all',
      startDate: '',
      endDate: ''
    },
    sort: {
      field: 'requestDate',
      direction: 'desc'
    },
    pagination: {
      currentPage: 1,
      pageSize: 25
    },
    isLoading: false,
    lastSyncTime: null
  };

  // Status Styling Configuration (matching Redcliffe & sheet palette)
  const STATUS_CONFIG = {
    'Delivered': {
      label: 'Delivered',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      borderClass: 'border-emerald-200/80 dark:border-emerald-800/80',
      dotClass: 'bg-emerald-500',
      icon: 'check_circle'
    },
    'In-Transit': {
      label: 'In-Transit',
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      textClass: 'text-amber-800 dark:text-amber-300',
      borderClass: 'border-amber-200/80 dark:border-amber-800/80',
      dotClass: 'bg-amber-500 animate-pulse',
      icon: 'local_shipping'
    },
    'In-Process': {
      label: 'In-Process',
      bgClass: 'bg-sky-50 dark:bg-sky-950/60',
      textClass: 'text-sky-700 dark:text-sky-300',
      borderClass: 'border-sky-200/80 dark:border-sky-800/80',
      dotClass: 'bg-sky-500 animate-pulse',
      icon: 'sync'
    },
    'Approval pending': {
      label: 'Approval pending',
      bgClass: 'bg-rose-50 dark:bg-rose-950/60',
      textClass: 'text-rose-700 dark:text-rose-300',
      borderClass: 'border-rose-200/80 dark:border-rose-800/80',
      dotClass: 'bg-rose-500',
      icon: 'schedule'
    },
    'Un-Delivered': {
      label: 'Un-Delivered',
      bgClass: 'bg-red-50 dark:bg-red-950/60',
      textClass: 'text-red-700 dark:text-red-300',
      borderClass: 'border-red-200/80 dark:border-red-800/80',
      dotClass: 'bg-red-600',
      icon: 'cancel'
    },
    'default': {
      label: 'Unknown',
      bgClass: 'bg-slate-50 dark:bg-slate-800/60',
      textClass: 'text-slate-600 dark:text-slate-300',
      borderClass: 'border-slate-200 dark:border-slate-700',
      dotClass: 'bg-slate-400',
      icon: 'info'
    }
  };

  function getStatusConfig(status) {
    if (!status) return STATUS_CONFIG['default'];
    const clean = status.trim();
    if (clean.toLowerCase() === 'not delivered') return STATUS_CONFIG['Un-Delivered'];
    return STATUS_CONFIG[clean] || STATUS_CONFIG['default'];
  }

  // Parse date into sortable Date object
  function parseDateForSort(dateStr) {
    if (!dateStr) return 0;
    const parts = dateStr.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3,})[-/\s](\d{2,4})/);
    if (parts) {
      const day = parseInt(parts[1], 10);
      const mStr = parts[2].toLowerCase().substring(0, 3);
      let year = parseInt(parts[3], 10);
      if (year < 100) year += 2000;
      const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      if (months[mStr] !== undefined) {
        return new Date(year, months[mStr], day).getTime();
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  // Calculate turnaround days
  function calculateLeadDays(reqDateStr, delDateStr) {
    if (!reqDateStr || !delDateStr) return null;
    const t1 = parseDateForSort(reqDateStr);
    const t2 = parseDateForSort(delDateStr);
    if (t1 > 0 && t2 > 0 && t2 >= t1) {
      const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  }

  // 1-Click Copy helper
  window.copyKitsDocket = function (text, event) {
    if (event) event.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (typeof window.wr === 'function') {
        window.wr(`Copied docket: ${text}`);
      } else {
        alert(`Copied: ${text}`);
      }
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (typeof window.wr === 'function') window.wr(`Copied docket: ${text}`);
    });
  };

  // Switch between Data Grid Table and Consignment Cards
  window.setKitsViewMode = function (mode) {
    window._kitsState.viewMode = mode;
    const btnTable = document.getElementById('btn-kits-view-table');
    const btnCards = document.getElementById('btn-kits-view-cards');

    if (btnTable && btnCards) {
      if (mode === 'table') {
        btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs flex items-center gap-1.5';
        btnCards.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5';
      } else {
        btnCards.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs flex items-center gap-1.5';
        btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5';
      }
    }

    renderKitsContent();
  };

  // Status Filter Setter with High-Contrast Active State & Micro-Interactions
  window.setKitsStatusFilter = function (status) {
    window._kitsState.filters.status = status;
    window._kitsState.pagination.currentPage = 1;

    document.querySelectorAll('[id^="kits-status-chip-"]').forEach(btn => {
      const btnStatus = btn.id.replace('kits-status-chip-', '');
      const badge = btn.querySelector('[id^="kits-status-count-"]');

      if (btnStatus === status) {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5';
        if (badge) badge.className = 'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900';
      } else {
        let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        let badgeColorClasses = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
        if (btnStatus === 'Delivered') {
          colorClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80';
          badgeColorClasses = 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200';
        } else if (btnStatus === 'In-Transit') {
          colorClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80';
          badgeColorClasses = 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
        } else if (btnStatus === 'In-Process') {
          colorClasses = 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80';
          badgeColorClasses = 'bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200';
        } else if (btnStatus === 'Approval pending') {
          colorClasses = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80';
          badgeColorClasses = 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200';
        } else if (btnStatus === 'Un-Delivered') {
          colorClasses = 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/80';
          badgeColorClasses = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        }
        btn.className = `px-3 py-1.5 rounded-xl text-xs font-bold ${colorClasses} border opacity-70 hover:opacity-100 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5`;
        if (badge) badge.className = `px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${badgeColorClasses}`;
      }
    });

    applyKitsFilters();
  };

  // Preset Date Filter
  window.setKitsDatePreset = function (preset) {
    const startInput = document.getElementById('kits-filter-start-date');
    const endInput = document.getElementById('kits-filter-end-date');

    const now = new Date();
    let sStr = '';
    let eStr = '';

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return `${y}-${m}-${day}`;
    };

    if (preset === 'all') {
      sStr = '';
      eStr = '';
    } else if (preset === 'this-month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      sStr = fmt(s);
      eStr = fmt(now);
    } else if (preset === 'last-30') {
      const s = new Date(now.getTime() - (30 * 86400000));
      sStr = fmt(s);
      eStr = fmt(now);
    } else if (preset === 'last-7') {
      const s = new Date(now.getTime() - (7 * 86400000));
      sStr = fmt(s);
      eStr = fmt(now);
    }

    if (startInput) startInput.value = sStr;
    if (endInput) endInput.value = eStr;

    window._kitsState.filters.startDate = sStr;
    window._kitsState.filters.endDate = eStr;
    window._kitsState.pagination.currentPage = 1;

    document.querySelectorAll('[id^="kits-preset-btn-"]').forEach(btn => {
      if (btn.id === `kits-preset-btn-${preset}`) {
        btn.classList.add('bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-slate-900');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
      } else {
        btn.classList.remove('bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-slate-900');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
      }
    });

    applyKitsFilters();
  };

  // Reset Filters
  window.resetKitsFilters = function () {
    window._kitsState.filters = {
      search: '',
      status: 'all',
      clinic: 'all',
      city: 'all',
      startDate: '',
      endDate: ''
    };
    window._kitsState.pagination.currentPage = 1;

    const sIn = document.getElementById('kits-search-input');
    if (sIn) sIn.value = '';

    const startInput = document.getElementById('kits-filter-start-date');
    if (startInput) startInput.value = '';

    const endInput = document.getElementById('kits-filter-end-date');
    if (endInput) endInput.value = '';

    const cSelect = document.getElementById('kits-clinic-select');
    if (cSelect) cSelect.value = 'all';

    const citySelect = document.getElementById('kits-city-select');
    if (citySelect) citySelect.value = 'all';

    window.setKitsStatusFilter('all');
    window.setKitsDatePreset('all');

    applyKitsFilters();
    if (typeof window.wr === 'function') window.wr('Filters reset to All Records');
  };

  // Apply Filters Logic
  function applyKitsFilters() {
    const s = window._kitsState;
    const f = s.filters;
    const q = f.search.toLowerCase().trim();

    const startD = f.startDate ? new Date(f.startDate + 'T00:00:00').getTime() : 0;
    const endD = f.endDate ? new Date(f.endDate + 'T23:59:59').getTime() : 0;

    s.filteredData = s.allData.filter(item => {
      // 1. Status Filter
      if (f.status !== 'all') {
        const itemStatus = (item.status || '').toLowerCase().trim();
        const targetStatus = f.status.toLowerCase().trim();
        if (targetStatus === 'un-delivered') {
          if (!itemStatus.includes('un-deliver') && !itemStatus.includes('not deliver')) return false;
        } else if (itemStatus !== targetStatus) {
          return false;
        }
      }

      // 2. Clinic Filter
      if (f.clinic !== 'all') {
        if ((item.clinic || '').toLowerCase() !== f.clinic.toLowerCase()) return false;
      }

      // 3. City Filter
      if (f.city !== 'all') {
        if ((item.city || '').toLowerCase() !== f.city.toLowerCase()) return false;
      }

      // 4. Date Filter (Check requestDate)
      if (startD > 0 || endD > 0) {
        const itemDate = parseDateForSort(item.requestDate || item.deliveryDate);
        if (itemDate > 0) {
          if (startD > 0 && itemDate < startD) return false;
          if (endD > 0 && itemDate > endD) return false;
        }
      }

      // 5. Global Search Text
      if (q) {
        const matchClinic = (item.clinic || '').toLowerCase().includes(q);
        const matchCity = (item.city || '').toLowerCase().includes(q);
        const matchAddress = (item.address || '').toLowerCase().includes(q);
        const matchItem = (item.item || '').toLowerCase().includes(q);
        const matchDocket = (item.docketNo || '').toLowerCase().includes(q);
        const matchCourier = (item.courierName || '').toLowerCase().includes(q);
        const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
        const matchRaised = (item.raisedBy || '').toLowerCase().includes(q);
        const matchIssued = (item.issuedBy || '').toLowerCase().includes(q);
        if (!matchClinic && !matchCity && !matchAddress && !matchItem && !matchDocket && !matchCourier && !matchRemarks && !matchRaised && !matchIssued) {
          return false;
        }
      }

      return true;
    });

    // Apply Sorting
    const sortField = s.sort.field;
    const sortDir = s.sort.direction === 'asc' ? 1 : -1;

    s.filteredData.sort((a, b) => {
      if (sortField === 'requestDate') {
        return (parseDateForSort(a.requestDate) - parseDateForSort(b.requestDate)) * sortDir;
      }
      if (sortField === 'deliveryDate') {
        return (parseDateForSort(a.deliveryDate) - parseDateForSort(b.deliveryDate)) * sortDir;
      }
      if (sortField === 'qty') {
        return ((a.qty || 0) - (b.qty || 0)) * sortDir;
      }
      if (sortField === 'clinic') {
        return (a.clinic || '').localeCompare(b.clinic || '') * sortDir;
      }
      if (sortField === 'status') {
        return (a.status || '').localeCompare(b.status || '') * sortDir;
      }
      return 0;
    });

    renderKitsKPIs();
    renderKitsContent();
  }


  // Update Navigation Rail Badge with Non-Delivered Consignments Count
  function updateKitsNavBadge() {
    const badge = document.getElementById('badge-kits');
    if (!badge) return;
    const data = window._kitsState.allData || [];
    const nonDelivered = data.filter(it => {
      const st = (it.status || '').toLowerCase().trim();
      return !st.includes('deliver') || st.includes('un-deliver') || st.includes('not deliver');
    }).length;

    if (nonDelivered > 0) {
      badge.innerText = nonDelivered;
      badge.setAttribute('data-count', String(nonDelivered));
      badge.style.display = 'inline-flex';
    } else {
      badge.setAttribute('data-count', '0');
      badge.style.display = 'none';
    }

    if (typeof window.updateNavBadges === 'function' && !window._inNavBadgeCall) {
      window._inNavBadgeCall = true;
      try { window.updateNavBadges(); } catch(e) {}
      window._inNavBadgeCall = false;
    }
  }
  window.updateKitsNavBadge = updateKitsNavBadge;

  // Open Consignment Full Details Modal (Showing 100% of all 14 attributes)
  window.openKitsDetailModal = function (itemIdx) {
    const s = window._kitsState;
    const page = s.pagination.pageSize === 'all' ? 0 : (s.pagination.currentPage - 1) * s.pagination.pageSize;
    const realIdx = page + itemIdx;
    const item = s.filteredData[realIdx] || s.filteredData[itemIdx] || s.allData[itemIdx];
    if (!item) return;

    const modal = document.getElementById('modal-kits-detail');
    if (!modal) return;

    const cfg = getStatusConfig(item.status);
    const leadDays = calculateLeadDays(item.requestDate, item.deliveryDate);

    const titleEl = document.getElementById('kd-item-title');
    if (titleEl) titleEl.innerText = item.item || 'Consignment Details';

    const subEl = document.getElementById('kd-clinic-city-sub');
    if (subEl) subEl.innerText = `${item.clinic || 'Unassigned Clinic'} • ${item.city || 'City'}`;

    const statusBadge = document.getElementById('kd-status-badge');
    if (statusBadge) {
      statusBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`;
      statusBadge.innerText = item.status || 'Unknown';
    }

    const rowNumEl = document.getElementById('kd-row-num');
    if (rowNumEl) rowNumEl.innerText = item.rowNum ? `Sheet Row #${item.rowNum}` : '';

    const fullItemEl = document.getElementById('kd-full-item');
    if (fullItemEl) fullItemEl.innerText = item.item || '-';

    const qtyEl = document.getElementById('kd-qty');
    if (qtyEl) qtyEl.innerText = `${(item.qty || 0).toLocaleString('en-IN')} Units`;

    const rateEl = document.getElementById('kd-rate');
    if (rateEl) rateEl.innerText = `₹${(item.rate || 0).toFixed(2)}`;

    const amountEl = document.getElementById('kd-amount');
    if (amountEl) amountEl.innerText = `₹${(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const leadBadge = document.getElementById('kd-lead-badge');
    if (leadBadge) {
      if (leadDays !== null) {
        leadBadge.innerText = `${leadDays} Days Lead Time`;
        leadBadge.className = 'px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
      } else {
        leadBadge.innerText = 'Transit Active / Pending';
        leadBadge.className = 'px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
      }
    }

    const reqDateEl = document.getElementById('kd-req-date');
    if (reqDateEl) reqDateEl.innerText = item.requestDate || '-';

    const appDateEl = document.getElementById('kd-app-date');
    if (appDateEl) appDateEl.innerText = item.approvalDate || 'Pending Approval';

    const delDateEl = document.getElementById('kd-del-date');
    if (delDateEl) delDateEl.innerText = item.deliveryDate || 'Pending Delivery';

    const clinicNameEl = document.getElementById('kd-clinic-name');
    if (clinicNameEl) clinicNameEl.innerText = item.clinic || '-';

    const cityEl = document.getElementById('kd-city');
    if (cityEl) cityEl.innerText = item.city || '-';

    const fullAddressEl = document.getElementById('kd-full-address');
    if (fullAddressEl) fullAddressEl.innerText = item.address || 'No specific street address provided';

    const issuedByEl = document.getElementById('kd-issued-by');
    if (issuedByEl) issuedByEl.innerText = item.issuedBy || 'Central Warehouse';

    const raisedByEl = document.getElementById('kd-raised-by');
    if (raisedByEl) raisedByEl.innerText = item.raisedBy || '-';

    const docketActionEl = document.getElementById('kd-docket-action');
    if (docketActionEl) {
      if (item.docketNo) {
        docketActionEl.innerHTML = `
          <button onclick="window.copyKitsDocket('${item.docketNo}', event)" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs border border-blue-200 dark:border-blue-800 transition cursor-pointer">
            <span class="material-symbols-outlined text-[13px]">content_copy</span>
            <span>Docket: ${item.docketNo}</span>
          </button>
        `;
      } else {
        docketActionEl.innerHTML = `<span class="text-xs text-slate-400 italic">No Docket Assigned</span>`;
      }
    }

    const fullRemarksEl = document.getElementById('kd-full-remarks');
    if (fullRemarksEl) fullRemarksEl.innerText = item.remarks || 'No special remarks recorded for this consignment.';

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  };

  window.closeKitsDetailModal = function () {
    const modal = document.getElementById('modal-kits-detail');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };


  // Render Top KPI Summary Cards & Dynamic Filter Chip Counts
  function renderKitsKPIs() {
    const items = window._kitsState.filteredData;
    const allItems = window._kitsState.allData;

    let totalQty = 0;
    let deliveredCount = 0;
    let inTransitCount = 0;
    let inProcessCount = 0;
    const uniqueClinics = new Set();
    const uniqueCities = new Set();

    items.forEach(it => {
      totalQty += (it.qty || 0);
      const st = (it.status || '').toLowerCase().trim();
      if (st.includes('deliver') && !st.includes('un-deliver') && !st.includes('not deliver')) {
        deliveredCount++;
      } else if (st.includes('transit')) {
        inTransitCount++;
      } else if (st.includes('process')) {
        inProcessCount++;
      }
      if (it.clinic && it.clinic !== 'Unassigned Clinic') uniqueClinics.add(it.clinic);
      if (it.city) uniqueCities.add(it.city);
    });

    // Compute live count totals for status filter chips
    let globDelivered = 0, globTransit = 0, globProcess = 0, globApproval = 0, globUnDelivered = 0;
    allItems.forEach(it => {
      const st = (it.status || '').toLowerCase().trim();
      if (st.includes('deliver') && !st.includes('un-deliver') && !st.includes('not deliver')) {
        globDelivered++;
      } else if (st.includes('transit')) {
        globTransit++;
      } else if (st.includes('process')) {
        globProcess++;
      } else if (st.includes('approval') || st.includes('pending')) {
        globApproval++;
      } else if (st.includes('un-deliver') || st.includes('not deliver')) {
        globUnDelivered++;
      }
    });

    const setChipCount = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.innerText = count.toLocaleString('en-IN');
    };
    setChipCount('kits-status-count-all', allItems.length);
    setChipCount('kits-status-count-Delivered', globDelivered);
    setChipCount('kits-status-count-In-Transit', globTransit);
    setChipCount('kits-status-count-In-Process', globProcess);
    setChipCount('kits-status-count-Approval-pending', globApproval);
    setChipCount('kits-status-count-Un-Delivered', globUnDelivered);

    const activePipeline = inTransitCount + inProcessCount;
    const totalCount = items.length;
    const deliveryRate = totalCount > 0 ? ((deliveredCount / totalCount) * 100).toFixed(1) : '100.0';

    const kpiTotalUnits = document.getElementById('kits-kpi-total-units');
    const kpiDelivered = document.getElementById('kits-kpi-delivered');
    const kpiPipeline = document.getElementById('kits-kpi-pipeline');
    const kpiClinics = document.getElementById('kits-kpi-clinics');
    const kpiSubCount = document.getElementById('kits-records-count-lbl');

    if (kpiTotalUnits) kpiTotalUnits.innerText = totalQty.toLocaleString('en-IN');
    if (kpiDelivered) kpiDelivered.innerHTML = `${deliveredCount} <span class="text-xs font-bold text-slate-400">(${deliveryRate}%)</span>`;
    if (kpiPipeline) kpiPipeline.innerText = activePipeline;
    if (kpiClinics) kpiClinics.innerHTML = `${uniqueClinics.size} <span class="text-xs font-bold text-slate-400">Clinics (${uniqueCities.size} Cities)</span>`;
    if (kpiSubCount) kpiSubCount.innerText = `Showing ${items.length} of ${allItems.length} consignments`;
    updateKitsNavBadge();
  }

  // Render Table or Cards view based on current state
  function renderKitsContent() {
    const container = document.getElementById('kits-content-container');
    if (!container) return;

    const s = window._kitsState;
    const data = s.filteredData;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-[32px]">search_off</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">No Consignments Match Your Filters</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md">Try clearing some filter criteria, expanding the date range, or searching for a different clinic/docket.</p>
          </div>
          <button onclick="window.resetKitsFilters()" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95">
            Reset All Filters
          </button>
        </div>
      `;
      return;
    }

    // Pagination slice
    const page = s.pagination.currentPage;
    const pageSize = s.pagination.pageSize;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(data.length / pageSize);
    const startIdx = pageSize === 'all' ? 0 : (page - 1) * pageSize;
    const pageItems = pageSize === 'all' ? data : data.slice(startIdx, startIdx + pageSize);

    if (s.viewMode === 'table') {
      renderKitsTableView(container, pageItems, page, totalPages, data.length);
    } else {
      renderKitsCardsView(container, pageItems, page, totalPages, data.length);
    }

    if (window.gsap) {
      gsap.fromTo(container.querySelectorAll('.kits-item-row, .kits-item-card'), 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }

  // View 1: Data Grid Table (Symmetrical Row Heights, Single-Line Address Truncation & Subtle Commercials)
  function renderKitsTableView(container, items, page, totalPages, totalCount) {
    const sortField = window._kitsState.sort.field;
    const sortDir = window._kitsState.sort.direction;

    const renderSortHeader = (field, label, align = 'left') => {
      const isSorted = sortField === field;
      const icon = isSorted ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
      return `
        <th class="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 text-${align} cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors select-none" onclick="window.toggleKitsSort('${field}')">
          <div class="inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}">
            <span>${label}</span>
            <span class="material-symbols-outlined text-[14px] ${isSorted ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}">${icon}</span>
          </div>
        </th>
      `;
    };

    let html = `
      <div class="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800">
                ${renderSortHeader('requestDate', 'Timeline')}
                ${renderSortHeader('status', 'Status')}
                ${renderSortHeader('item', 'Item & Qty')}
                ${renderSortHeader('amount', 'Commercials')}
                ${renderSortHeader('clinic', 'Destination Clinic & Address')}
                <th class="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Logistics</th>
                <th class="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Docket & Remarks</th>
                <th class="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
    `;

    items.forEach((it, idx) => {
      const cfg = getStatusConfig(it.status);
      const leadDays = calculateLeadDays(it.requestDate, it.deliveryDate);
      const leadBadge = leadDays !== null ? `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-1" title="Delivery Lead Time">${leadDays}d transit</span>` : '';

      const docketBtn = it.docketNo ? `
        <button onclick="window.copyKitsDocket('${it.docketNo}', event)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200/60 dark:border-blue-800/60 text-[11px] font-mono font-bold transition-all active:scale-95 group" title="Click to copy tracking docket">
          <span class="material-symbols-outlined text-[12px] group-hover:scale-110 transition-transform">content_copy</span>
          <span>${it.docketNo}</span>
        </button>
      ` : '';

      // Clean Commercials formatting (avoid large black 0.00)
      let commercialsHtml = '';
      if (!it.amount || it.amount === 0) {
        commercialsHtml = `
          <div class="flex flex-col">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 w-fit" title="Internal Consumable / Complimentary Delivery">Complimentary</span>
          </div>
        `;
      } else {
        commercialsHtml = `
          <div class="flex flex-col font-mono">
            <span class="font-black text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">₹${it.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span class="text-[10px] text-slate-400 font-semibold">₹${(it.rate || 0).toFixed(2)}/u</span>
          </div>
        `;
      }

      html += `
        <tr class="kits-item-row hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onclick="window.openKitsDetailModal(${idx})">
          <!-- 1. Timeline & Dates -->
          <td class="px-4 py-3 align-middle whitespace-nowrap">
            <div class="flex flex-col space-y-0.5">
              <span class="font-extrabold text-slate-900 dark:text-white tabular-nums">${it.requestDate || 'N/A'}</span>
              ${it.deliveryDate ? `
                <div class="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span class="material-symbols-outlined text-[13px] text-emerald-500 mr-0.5">task_alt</span>
                  <span>Del: ${it.deliveryDate}</span>
                  ${leadBadge}
                </div>
              ` : `
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  In Progress
                </span>
              `}
            </div>
          </td>

          <!-- 2. Status Badge -->
          <td class="px-4 py-3 align-middle whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} shadow-2xs">
              <span class="w-1.5 h-1.5 rounded-full ${cfg.dotClass}"></span>
              <span>${cfg.label}</span>
            </span>
          </td>

          <!-- 3. Item Description & Quantity -->
          <td class="px-4 py-3 align-middle min-w-[200px] max-w-xs">
            <div class="flex flex-col space-y-0.5">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10.5px] tabular-nums border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  ${(it.qty || 0).toLocaleString('en-IN')} Qty
                </span>
              </div>
              <span class="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight" title="${it.item || ''}">${it.item}</span>
            </div>
          </td>

          <!-- 4. Rate & Invoiced Amount -->
          <td class="px-4 py-3 align-middle whitespace-nowrap">
            ${commercialsHtml}
          </td>

          <!-- 5. Destination Clinic & Address (Symmetrical Single-Line Truncation) -->
          <td class="px-4 py-3 align-middle min-w-[220px] max-w-sm">
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[240px] block" title="${it.clinic || ''}">${it.clinic}</span>
                ${it.city ? `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">${it.city}</span>` : ''}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[250px] block mt-0.5" title="${it.address || ''}">
                ${it.address || 'Standard Clinic Hub'}
              </p>
            </div>
          </td>

          <!-- 6. Logistics: Dispatch Lab & Raised By -->
          <td class="px-4 py-3 align-middle whitespace-nowrap">
            <div class="flex flex-col space-y-0.5">
              <div class="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                <span class="material-symbols-outlined text-[14px] text-slate-400">domain</span>
                <span class="text-[11px]">${it.issuedBy || 'Central WH'}</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">Req: ${it.raisedBy || '-'}</span>
            </div>
          </td>

          <!-- 7. Courier / Docket & Remarks -->
          <td class="px-4 py-3 align-middle min-w-[180px] max-w-xs">
            <div class="flex flex-col gap-0.5">
              ${docketBtn}
              ${it.courierName && !docketBtn ? `<span class="font-bold text-slate-700 dark:text-slate-300 text-[11px]">${it.courierName}</span>` : ''}
              <p class="text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5" title="${it.remarks || ''}">
                ${it.remarks || '<span class="italic text-slate-400">No remarks</span>'}
              </p>
            </div>
          </td>

          <!-- 8. Actions (Details Modal) -->
          <td class="px-4 py-3 align-middle text-right whitespace-nowrap">
            <button onclick="window.openKitsDetailModal(${idx}); event.stopPropagation();" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:bg-white dark:hover:text-slate-900 text-slate-700 dark:text-slate-200 text-[11px] font-black border border-slate-200 dark:border-slate-700 transition-all shadow-xs flex items-center gap-1 ml-auto cursor-pointer active:scale-95 group-hover:bg-slate-900 group-hover:text-white" title="Click to view all 14 fields">
              <span class="material-symbols-outlined text-[14px]">visibility</span>
              <span>Details</span>
            </button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>

        <!-- Table Footer: Pagination & Stats -->
        ${renderKitsPagination(page, totalPages, totalCount)}
      </div>
    `;

    container.innerHTML = html;
  }

  // View 2: Consignment Cards View (Visual Tracking Progression & Complete Details)
  function renderKitsCardsView(container, items, page, totalPages, totalCount) {
    let html = `
      <div class="flex flex-col gap-5">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    `;

    items.forEach((it, idx) => {
      const cfg = getStatusConfig(it.status);
      const leadDays = calculateLeadDays(it.requestDate, it.deliveryDate);
      const isDelivered = (it.status || '').toLowerCase().includes('deliver') && !it.status.toLowerCase().includes('un-deliver');
      const isInTransit = (it.status || '').toLowerCase().includes('transit');

      html += `
        <div class="kits-item-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer" onclick="window.openKitsDetailModal(${idx})">
          <!-- Card Header: Clinic & Status -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h4 class="font-black text-sm text-slate-900 dark:text-white">${it.clinic}</h4>
                ${it.city ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${it.city}</span>` : ''}
              </div>
              ${it.address ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug whitespace-normal break-words mt-1">${it.address}</p>` : ''}
            </div>

            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border shrink-0 ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}">
              <span class="w-1.5 h-1.5 rounded-full ${cfg.dotClass}"></span>
              ${cfg.label}
            </span>
          </div>

          <!-- Item Details Card Box with Commercials -->
          <div class="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-col min-w-0">
                <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Item Consigned</span>
                <span class="font-extrabold text-xs text-slate-900 dark:text-white whitespace-normal break-words mt-0.5">${it.item}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-extrabold text-xs tabular-nums shadow-xs">
                  ${(it.qty || 0).toLocaleString('en-IN')} Qty
                </span>
              </div>
            </div>

            <!-- Rate & Total Amount (Clean Commercials) -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-xs">
              <span class="text-slate-400 text-[10.5px]">Unit Rate: ₹${(it.rate || 0).toFixed(2)}</span>
              ${(!it.amount || it.amount === 0) 
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">Complimentary</span>`
                : `<span class="font-black text-emerald-600 dark:text-emerald-400">₹${it.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>`
              }
            </div>
          </div>

          <!-- Visual Shipping Pipeline / Timeline -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Req: ${it.requestDate || 'N/A'}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full ${isDelivered ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}"></span>
                <span>${isDelivered ? `Delivered: ${it.deliveryDate}` : 'In Pipeline'}</span>
              </div>
            </div>

            <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div class="h-full bg-emerald-500 ${isDelivered ? 'w-full' : (isInTransit ? 'w-3/4 bg-amber-500' : 'w-1/3 bg-sky-500')} transition-all"></div>
            </div>
          </div>

          <!-- Card Footer: Logistics, Courier & Details Action -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">local_shipping</span>
              <span class="font-semibold">${it.issuedBy || 'Warehouse'}</span>
              ${it.raisedBy ? `<span class="text-[10px] text-slate-400">(by ${it.raisedBy})</span>` : ''}
            </div>

            <div class="flex items-center gap-1.5 ml-auto">
              ${it.docketNo ? `
                <button onclick="window.copyKitsDocket('${it.docketNo}', event)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono font-bold text-[11px] hover:bg-blue-100 transition-colors">
                  <span class="material-symbols-outlined text-[11px]">content_copy</span>
                  <span>${it.docketNo}</span>
                </button>
              ` : ''}
              <button onclick="window.openKitsDetailModal(${idx}); event.stopPropagation();" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px] font-black border border-slate-200 dark:border-slate-700 transition">
                Details
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        <!-- Cards Pagination -->
        ${renderKitsPagination(page, totalPages, totalCount)}
      </div>
    `;

    container.innerHTML = html;
  }

  // Pagination Toolbar
  function renderKitsPagination(page, totalPages, totalCount) {
    if (totalPages <= 1) return '';

    return `
      <div class="px-5 py-3.5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
        <span class="text-slate-500 dark:text-slate-400 font-semibold">
          Page <strong class="text-slate-900 dark:text-white font-extrabold">${page}</strong> of <strong class="text-slate-900 dark:text-white font-extrabold">${totalPages}</strong> (${totalCount} total)
        </span>

        <div class="flex items-center gap-1.5">
          <button onclick="window.setKitsPage(${page - 1})" ${page <= 1 ? 'disabled class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"' : 'class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold transition-all shadow-2xs"'}>
            &larr; Prev
          </button>
          
          <button onclick="window.setKitsPage(${page + 1})" ${page >= totalPages ? 'disabled class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"' : 'class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold transition-all shadow-2xs"'}>
            Next &rarr;
          </button>
        </div>
      </div>
    `;
  }

  // Pagination Change
  window.setKitsPage = function (newPage) {
    const s = window._kitsState;
    const pageSize = s.pagination.pageSize;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(s.filteredData.length / pageSize);
    if (newPage < 1 || newPage > totalPages) return;
    s.pagination.currentPage = newPage;
    renderKitsContent();
    const cont = document.getElementById('kits-content-container');
    if (cont) cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Sort Toggle
  window.toggleKitsSort = function (field) {
    const s = window._kitsState;
    if (s.sort.field === field) {
      s.sort.direction = s.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      s.sort.field = field;
      s.sort.direction = 'desc';
    }
    applyKitsFilters();
  };

  // Populate Filter Dropdowns dynamically
  function populateKitsDropdowns(data) {
    const clinicSelect = document.getElementById('kits-clinic-select');
    const citySelect = document.getElementById('kits-city-select');

    if (!clinicSelect || !citySelect) return;

    const clinics = new Set();
    const cities = new Set();

    data.forEach(it => {
      if (it.clinic && it.clinic !== 'Unassigned Clinic') clinics.add(it.clinic);
      if (it.city) cities.add(it.city);
    });

    const curClinic = clinicSelect.value;
    const curCity = citySelect.value;

    clinicSelect.innerHTML = '<option value="all">All Clinics (All Destinations)</option>';
    Array.from(clinics).sort().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.innerText = c;
      clinicSelect.appendChild(opt);
    });
    clinicSelect.value = curClinic || 'all';

    citySelect.innerHTML = '<option value="all">All Cities</option>';
    Array.from(cities).sort().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.innerText = c;
      citySelect.appendChild(opt);
    });
    citySelect.value = curCity || 'all';
  }

  // Export Filtered Records to CSV
  window.exportKitsToCSV = function () {
    const data = window._kitsState.filteredData;
    if (!data || data.length === 0) {
      if (typeof window.wr === 'function') window.wr('No records to export', true);
      return;
    }

    const headers = [
      'Request Date', 'Raised By', 'Approval Date', 'Delivery Date',
      'Item Description', 'Quantity', 'Rate', 'Amount', 'Status',
      'Clinic Name', 'Clinic City', 'Clinic Address', 'Issued By', 'Remarks', 'Docket Number'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csvContent = headers.join(',') + '\n';
    data.forEach(r => {
      const row = [
        escapeCSV(r.requestDate),
        escapeCSV(r.raisedBy),
        escapeCSV(r.approvalDate),
        escapeCSV(r.deliveryDate),
        escapeCSV(r.item),
        r.qty || 0,
        r.rate || 0,
        r.amount || 0,
        escapeCSV(r.status),
        escapeCSV(r.clinic),
        escapeCSV(r.city),
        escapeCSV(r.address),
        escapeCSV(r.issuedBy),
        escapeCSV(r.remarks),
        escapeCSV(r.docketNo)
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    link.download = `Kits_Tracker_Export_${nowStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof window.wr === 'function') {
      window.wr(`Exported ${data.length} records to CSV!`);
    }
  };

  // Data Loading & Hydration
  window.loadKitsTrackerData = async function (forceRefresh = false) {
    const s = window._kitsState;
    s.isLoading = true;

    const syncBtnIcon = document.getElementById('kits-sync-btn-icon');
    if (syncBtnIcon) syncBtnIcon.classList.add('animate-spin');

    // 1. Instant Cache Hydration (if not forced)
    if (!forceRefresh && s.allData.length === 0) {
      try {
        const ls = localStorage.getItem('kits_tracker_cache');
        if (ls) {
          const parsed = JSON.parse(ls);
          if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
            s.allData = parsed.data;
            populateKitsDropdowns(s.allData);
            applyKitsFilters();
            console.log(`[Kits Tracker] Instant hydrated ${s.allData.length} records from localStorage.`);
          }
        }
      } catch (e) {
        console.warn('Local cache read error:', e);
      }
    }

    // 2. Fallback to bundled /kits_data.json if still empty
    if (s.allData.length === 0) {
      try {
        const res = await fetch('kits_data.json');
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            s.allData = json.data;
            populateKitsDropdowns(s.allData);
            applyKitsFilters();
            console.log(`[Kits Tracker] Hydrated ${s.allData.length} records from bundled kits_data.json.`);
          }
        }
      } catch (err) {
        console.warn('Bundled JSON fetch note:', err);
      }
    }

    // 3. Live Sync from Google Apps Script Backend (if available)
    if (window.google && window.google.script && window.google.script.run) {
      window.google.script.run
        .withSuccessHandler((res) => {
          s.isLoading = false;
          if (syncBtnIcon) syncBtnIcon.classList.remove('animate-spin');

          if (res && res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
            s.allData = res.data;
            s.lastSyncTime = new Date();
            try {
              localStorage.setItem('kits_tracker_cache', JSON.stringify(res));
            } catch (e) {}

            populateKitsDropdowns(s.allData);
            applyKitsFilters();

            const syncLbl = document.getElementById('kits-sync-status-lbl');
            if (syncLbl) syncLbl.innerText = `Synced just now (${s.allData.length} records)`;
            if (forceRefresh && typeof window.wr === 'function') window.wr('Kits Tracker synced with Google Sheets!');
          }
        })
        .withFailureHandler((err) => {
          s.isLoading = false;
          if (syncBtnIcon) syncBtnIcon.classList.remove('animate-spin');
          console.warn('[Kits Tracker] Live sync delayed/failed, preserving cached records:', err);
          if (forceRefresh && typeof window.wr === 'function') window.wr('Live sync delayed; displaying cached records.', true);
        })
        .getKitsTrackerData(forceRefresh);
    } else {
      s.isLoading = false;
      if (syncBtnIcon) syncBtnIcon.classList.remove('animate-spin');
    }
  };

  // Main Render View Entrypoint (called when tab is activated)
  window.renderKitsTrackerView = function () {
    const s = window._kitsState;
    if (s.allData.length === 0) {
      window.loadKitsTrackerData(false);
    } else {
      renderKitsKPIs();
      renderKitsContent();
    }
  };

  // Wire up filter event listeners once DOM is ready
  window.initKitsTracker = function () {
    const searchIn = document.getElementById('kits-search-input');
    if (searchIn && !searchIn.dataset.bound) {
      searchIn.dataset.bound = 'true';
      let debounceTimer = null;
      searchIn.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          window._kitsState.filters.search = e.target.value;
          window._kitsState.pagination.currentPage = 1;
          applyKitsFilters();
        }, 250);
      });
    }

    const clinicSel = document.getElementById('kits-clinic-select');
    if (clinicSel && !clinicSel.dataset.bound) {
      clinicSel.dataset.bound = 'true';
      clinicSel.addEventListener('change', (e) => {
        window._kitsState.filters.clinic = e.target.value;
        window._kitsState.pagination.currentPage = 1;
        applyKitsFilters();
      });
    }

    const citySel = document.getElementById('kits-city-select');
    if (citySel && !citySel.dataset.bound) {
      citySel.dataset.bound = 'true';
      citySel.addEventListener('change', (e) => {
        window._kitsState.filters.city = e.target.value;
        window._kitsState.pagination.currentPage = 1;
        applyKitsFilters();
      });
    }

    const startIn = document.getElementById('kits-filter-start-date');
    const endIn = document.getElementById('kits-filter-end-date');
    if (startIn && !startIn.dataset.bound) {
      startIn.dataset.bound = 'true';
      startIn.addEventListener('change', (e) => {
        window._kitsState.filters.startDate = e.target.value;
        window._kitsState.pagination.currentPage = 1;
        applyKitsFilters();
      });
    }
    if (endIn && !endIn.dataset.bound) {
      endIn.dataset.bound = 'true';
      endIn.addEventListener('change', (e) => {
        window._kitsState.filters.endDate = e.target.value;
        window._kitsState.pagination.currentPage = 1;
        applyKitsFilters();
      });
    }

    // Auto-load initial cache
    window.loadKitsTrackerData(false);
  };

  // Auto initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initKitsTracker);
  } else {
    window.initKitsTracker();
  }

})();
