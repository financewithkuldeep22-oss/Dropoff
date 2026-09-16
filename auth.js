/**
 * Authentication Manager
 * Handles login, session state, profile UI updates, and zero-flash security guards.
 */
window.AuthManager = (function() {
  const SESSION_KEY = 'dropoff_user_session';
  const DB_NAME = 'DropoffAuthDB';
  const STORE_NAME = 'sessions';
  let currentUser = null;

  function getDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  function saveSession(sessionData) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch(e) {}

    try {
      getDB().then(db => {
        if (!db) return;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(sessionData, SESSION_KEY);
      });
    } catch(e) {}
  }

  function loadSessionSync() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch(e) {}
    return null;
  }

  async function loadSession() {
    const syncUser = loadSessionSync();
    if (syncUser) return syncUser;

    try {
      const db = await getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(SESSION_KEY);
        req.onsuccess = () => {
          if (req.result) {
            try { localStorage.setItem(SESSION_KEY, JSON.stringify(req.result)); } catch(e) {}
          }
          resolve(req.result || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch(e) {
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch(e) {}

    try {
      getDB().then(db => {
        if (!db) return;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(SESSION_KEY);
      });
    } catch(e) {}
  }

  function init() {
    const syncUser = loadSessionSync();
    if (syncUser) {
      currentUser = syncUser;
      document.documentElement.classList.remove('is-unauthenticated', 'auth-pending');
      document.documentElement.classList.add('is-authenticated');
      updateProfileUI();
      hideLoginModal(true);
      if (typeof window.initAllDashboardLogic === 'function') {
        window.initAllDashboardLogic();
      }
      return;
    }

    loadSession().then(savedSession => {
      if (savedSession) {
        currentUser = savedSession;
        document.documentElement.classList.remove('is-unauthenticated', 'auth-pending');
        document.documentElement.classList.add('is-authenticated');
        updateProfileUI();
        hideLoginModal(true);
        if (typeof window.initAllDashboardLogic === 'function') {
          window.initAllDashboardLogic();
        }
      } else {
        document.documentElement.classList.add('is-unauthenticated');
        document.documentElement.classList.remove('is-authenticated', 'auth-pending');
        showLoginModal();
      }
    });
  }

  function showLoginModal() {
    document.documentElement.classList.add('is-unauthenticated');
    document.documentElement.classList.remove('is-authenticated', 'auth-pending');
    const overlay = document.getElementById('login-overlay');
    const box = document.getElementById('login-modal-box');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    }
    if (box) {
      box.style.transform = 'translateY(0) scale(1)';
    }
    document.body.style.overflow = 'hidden';
  }

  function hideLoginModal(immediate = false) {
    document.documentElement.classList.remove('is-unauthenticated', 'auth-pending');
    document.documentElement.classList.add('is-authenticated');
    const overlay = document.getElementById('login-overlay');
    const box = document.getElementById('login-modal-box');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }
  }

  function updateProfileUI() {
    if (!currentUser) return;
    
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const initialsEl = document.getElementById('user-initials');
    
    if (nameEl) nameEl.textContent = currentUser.username;
    if (roleEl) roleEl.textContent = currentUser.role || 'User';
    
    if (initialsEl) {
      initialsEl.textContent = (currentUser.username || 'RC').substring(0, 2).toUpperCase();
    }
  }

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    const usernameInput = (document.getElementById('login-username')?.value || '').trim();
    const passwordInput = document.getElementById('login-password')?.value || '';
    
    const btnText = document.getElementById('login-btn-text');
    const btnIcon = document.getElementById('login-btn-icon');
    const spinner = document.getElementById('login-spinner');
    const errorMsg = document.getElementById('login-error-msg');
    const errorText = document.getElementById('login-error-text');
    
    if (!usernameInput || !passwordInput) {
      if (errorText && errorMsg) {
        errorText.textContent = 'Please enter both username and password';
        errorMsg.classList.remove('hidden');
      }
      return;
    }

    if (btnText) btnText.textContent = 'Verifying credentials...';
    if (btnIcon) btnIcon.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbw91MSWxgTmiSGZTxlgDkniCbPFEZMUpQFiCwu6AnDd13bTfCquZJVDP6sut3JF9Eri/exec";
      
      const payload = {
        action: 'authenticateUser',
        args: [usernameInput, passwordInput]
      };
      
      let authenticated = false;
      let authUser = null;

      try {
        // Use Vercel proxy in production to avoid Google multi-account cookie 404 redirect
        let fetchUrl = scriptUrl;
        let fetchHeaders = { "Content-Type": "text/plain;charset=utf-8" };
        if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('redcliffelabs.com')) {
          fetchUrl = '/api/proxy?url=' + encodeURIComponent(scriptUrl);
          fetchHeaders = { "Content-Type": "application/json" };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(fetchUrl, {
          method: "POST",
          headers: fetchHeaders,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data && data.status === 'success' && data.user) {
          authenticated = true;
          authUser = data.user;
        } else if (data && data.status === 'error' && data.message && !data.message.includes('does not exist')) {
          if (errorText && errorMsg) {
            errorText.textContent = data.message || 'Invalid username or password';
            errorMsg.classList.remove('hidden');
          }
          return;
        }
      } catch (fetchErr) {
        console.warn("Backend auth error, checking master fallback...", fetchErr);
      }

      // Master admin credentials fallback
      if (!authenticated && usernameInput.toLowerCase() === 'admin' && passwordInput === 'admin123') {
        authenticated = true;
        authUser = { username: 'admin', role: 'Admin' };
      }

      if (authenticated && authUser) {
        currentUser = authUser;
        saveSession(currentUser);
        updateProfileUI();
        hideLoginModal(true);
        
        // Refresh data if app.js is ready
        if (typeof window.syncAllDashboardData === 'function') {
          window.syncAllDashboardData(false);
        }
      } else {
        if (errorText && errorMsg) {
          errorText.textContent = 'Invalid username or password';
          errorMsg.classList.remove('hidden');
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (usernameInput.toLowerCase() === 'admin' && passwordInput === 'admin123') {
        currentUser = { username: 'admin', role: 'Admin' };
        saveSession(currentUser);
        updateProfileUI();
        hideLoginModal(true);
        if (typeof window.syncAllDashboardData === 'function') {
          window.syncAllDashboardData(false);
        }
      } else {
        if (errorText && errorMsg) {
          errorText.textContent = 'Invalid username or password';
          errorMsg.classList.remove('hidden');
        }
      }
    } finally {
      if (btnText) btnText.textContent = 'Sign In Securely';
      if (btnIcon) btnIcon.classList.remove('hidden');
      if (spinner) spinner.classList.add('hidden');
    }
  }

  function logout() {
    currentUser = null;
    clearSession();
    
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) {
      menu.classList.remove('opacity-100', 'visible');
      menu.classList.add('opacity-0', 'invisible');
    }
    
    showLoginModal();
  }

  function getUser() {
    return currentUser;
  }

  return {
    init,
    handleLogin,
    logout,
    getUser
  };
})();

// Make user menu toggle global
window.toggleUserMenu = function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) {
    if (menu.classList.contains('opacity-0')) {
      menu.classList.remove('opacity-0', 'invisible');
      menu.classList.add('opacity-100', 'visible');
    } else {
      menu.classList.remove('opacity-100', 'visible');
      menu.classList.add('opacity-0', 'invisible');
    }
  }
};

// Close menus when clicking outside
document.addEventListener('click', function(e) {
  const menu = document.getElementById('user-dropdown-menu');
  const btn = document.getElementById('user-profile-btn');
  if (menu && btn) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('opacity-100', 'visible');
      menu.classList.add('opacity-0', 'invisible');
    }
  }
  
  const nMenu = document.getElementById('notifications-dropdown-menu');
  const nBtn = e.target.closest ? e.target.closest('[aria-label="Notifications"]') : null;
  const nBtnActual = document.querySelector('[aria-label="Notifications"]');
  if (nMenu && nBtnActual) {
    if (!nMenu.contains(e.target) && (!nBtn || !nBtnActual.contains(e.target))) {
      nMenu.classList.remove('opacity-100', 'visible');
      nMenu.classList.add('opacity-0', 'invisible');
    }
  }
});

// Notifications menu toggle
window.toggleNotificationsMenu = function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const menu = document.getElementById('notifications-dropdown-menu');
  if (menu) {
    if (menu.classList.contains('opacity-0')) {
      menu.classList.remove('opacity-0', 'invisible');
      menu.classList.add('opacity-100', 'visible');
    } else {
      menu.classList.remove('opacity-100', 'visible');
      menu.classList.add('opacity-0', 'invisible');
    }
  }
};

// Toggle password visibility eye button
window.togglePasswordVisibility = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const pwdInput = document.getElementById('login-password');
  const icon = document.getElementById('password-toggle-icon');
  if (!pwdInput) return;
  
  const start = pwdInput.selectionStart;
  const end = pwdInput.selectionEnd;
  
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (icon) {
      icon.textContent = 'visibility_off';
      icon.setAttribute('title', 'Hide password');
    }
  } else {
    pwdInput.type = 'password';
    if (icon) {
      icon.textContent = 'visibility';
      icon.setAttribute('title', 'Show password');
    }
  }
  
  try {
    pwdInput.focus();
    if (start !== null && end !== null) {
      pwdInput.setSelectionRange(start, end);
    }
  } catch (err) {}
};

function bindPasswordToggle() {
  const toggleBtn = document.getElementById('toggle-password-btn');
  if (toggleBtn) {
    toggleBtn.removeEventListener('click', window.togglePasswordVisibility);
    toggleBtn.addEventListener('click', window.togglePasswordVisibility);
    // Also set inline onclick as bulletproof fallback
    toggleBtn.onclick = function(e) { window.togglePasswordVisibility(e); };
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AuthManager.init();
    bindPasswordToggle();
  });
} else {
  window.AuthManager.init();
  bindPasswordToggle();
}
