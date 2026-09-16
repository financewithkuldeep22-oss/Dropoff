window.google = window.google || {};
window.google.script = window.google.script || {};

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbw91MSWxgTmiSGZTxlgDkniCbPFEZMUpQFiCwu6AnDd13bTfCquZJVDP6sut3JF9Eri/exec';

function getActiveGasUrl() {
  try {
    const custom = localStorage.getItem('VITE_BACKEND_URL') || localStorage.getItem('backend_api_url');
    if (custom && custom.trim().startsWith('https://script.google.com/')) {
      return custom.trim();
    }
  } catch(e) {}
  return DEFAULT_GAS_URL;
}

let _lastDashboardDataCache = null;
let _lastAllohealthQCCache = null;

function createRunContext(successHandler = null, failureHandler = null) {
  return new Proxy({}, {
    get: function(target, prop) {
      if (prop === 'withSuccessHandler') {
        return function(fn) { return createRunContext(fn, failureHandler); };
      }
      if (prop === 'withFailureHandler') {
        return function(fn) { return createRunContext(successHandler, fn); };
      }
      
      return async function(...args) {
        const gasUrl = getActiveGasUrl();
        if (!gasUrl) {
            console.error("Please configure GAS_URL in api.js");
            if (failureHandler) failureHandler(new Error("API URL not configured in api.js"));
            return;
        }

        // AbortController created per-attempt below
        
        // Auto-inject username for mutation requests
        const user = window.AuthManager && typeof window.AuthManager.getUser === 'function' ? window.AuthManager.getUser() : null;
        const username = user ? user.username : 'System';
        
        if (prop === 'updateAllohealthQC') {
          args[3] = username;
        } else if (prop === 'updateBookingIdInSourceSheet') {
          args[5] = username;
        }
        const payload = { action: prop, args: args };
        const isHeavyRead = (prop === 'getDashboardLogsData' || prop === 'getAllohealthQCData');
        const maxRetries = isHeavyRead ? 0 : 1;
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          const controller = new AbortController();
          const timeoutMs = (prop === 'getDashboardLogsData') ? 38000 : 
                            (prop === 'getAllohealthQCData') ? 28000 : 
                            (prop === 'getGoogleDriveImageBase64') ? 25000 : 20000;
          const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            let fetchUrl = gasUrl;
            let fetchOptions = {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload),
              signal: controller.signal,
              redirect: 'follow'
            };

            const response = await fetch(fetchUrl, fetchOptions);

            if (!response.ok) {
              const statusText = response.statusText ? ` (${response.statusText})` : '';
              const err = new Error(`Server returned HTTP ${response.status}${statusText}`);
              if (attempt < maxRetries && (response.status >= 500 || response.status === 404 || response.status === 408)) {
                console.warn(`[API] Attempt ${attempt + 1} failed: ${err.message}. Retrying in 1.5s...`);
                await new Promise(r => setTimeout(r, 1500));
                continue;
              }
              throw err;
            }

            const rawText = await response.text();
            let result;
            try {
              result = JSON.parse(rawText);
            } catch (jsonErr) {
              console.error("[API] Failed to parse JSON response. Raw text:", rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""));
              throw new Error("Invalid JSON from server. Received: " + rawText.substring(0, 50));
            }
            
            clearTimeout(timeoutTimer);

            if (result && typeof result === 'object' && result.status === 'error' && result.message) {
              if (prop === 'getGoogleDriveImageBase64') {
                if (successHandler) {
                  successHandler(result);
                  return;
                }
              }
              throw new Error(result.message);
            }

            // Cache successful dashboard & QC queue data for memory & offline / fallback resilience
            if (prop === 'getDashboardLogsData' && result && result.status === 'success') {
              _lastDashboardDataCache = result;
              window._lastDashboardDataCache = result;
              try {
                localStorage.setItem('dropoff_dashboard_cache', JSON.stringify(result));
              } catch(e) {}
            } else if (prop === 'getAllohealthQCData' && result && result.status === 'success') {
              _lastAllohealthQCCache = result;
              window._lastAllohealthQCCache = result;
              try {
                localStorage.setItem('allohealth_qc_cache', JSON.stringify(result));
              } catch(e) {}
            }

            if (successHandler) successHandler(result);
            return;
          } catch (error) {
            clearTimeout(timeoutTimer);
            lastError = error;
            if (error.name === 'AbortError') {
              if (attempt < maxRetries) {
                console.warn('[API] Attempt ' + (attempt + 1) + ' timed out for ' + prop + '. Retrying...');
                await new Promise(r => setTimeout(r, 2000));
                continue;
              }
              break;
            }
            if (attempt < maxRetries) {
              console.warn(`[API] Attempt ${attempt + 1} error: ${error.message}. Retrying in 1.5s...`);
              await new Promise(r => setTimeout(r, 1500));
            }
          }
        }

        // Trigger offline screen if user is truly offline
        if (!navigator.onLine && window.showOfflineScreen) {
          window.showOfflineScreen();
        }
        
        const errorMsg = lastError && lastError.name === 'AbortError'
          ? 'Request timed out. Server is busy, please try again in a moment.'
          : (lastError ? lastError.message : 'Unknown network connection error');
          
        // If dashboard logs call failed but we have cached data, seamlessly serve cached data without console errors
        if (prop === 'getDashboardLogsData') {
          try {
            let cachedObj = _lastDashboardDataCache || window._lastDashboardDataCache;
            if (!cachedObj && window.Qs && window.Qs.status === 'success') {
              cachedObj = window.Qs;
            }
            if (!cachedObj) {
              const ls = localStorage.getItem('dropoff_dashboard_cache');
              if (ls) cachedObj = JSON.parse(ls);
            }
            if (!cachedObj && typeof fetch === 'function' && window.location.protocol !== 'file:') {
              try {
                const staticRes = await fetch('/dashboard_data.json');
                if (staticRes.ok) {
                  cachedObj = await staticRes.json();
                }
              } catch(sErr) {}
            }
            if (cachedObj && cachedObj.status === 'success') {
              console.warn("[API] Transient network delay; seamlessly serving active dashboard snapshot.");
              if (successHandler) {
                successHandler(cachedObj);
                return;
              }
            }
          } catch(e) {}
        } else if (prop === 'getAllohealthQCData') {
          try {
            let cachedObj = _lastAllohealthQCCache || window._lastAllohealthQCCache;
            if (!cachedObj) {
              const ls = localStorage.getItem('allohealth_qc_cache');
              if (ls) cachedObj = JSON.parse(ls);
            }
            if (cachedObj && cachedObj.status === 'success') {
              console.warn("[API] Serving active cached QC queue.");
              if (successHandler) {
                successHandler(cachedObj);
                return;
              }
            }
          } catch(e) {}
        } else if (prop === 'getGoogleDriveImageBase64') {
          // Photo fetching has built-in UI fallback to drive thumbnails
          if (successHandler) {
            successHandler({ status: 'fallback', message: errorMsg });
            return;
          }
        }

        if (isHeavyRead) {
          console.warn(`[API] Background fetch delayed for ${prop}: ${errorMsg}`);
        } else {
          console.error("API Call failed:", prop, errorMsg);
        }

        if (failureHandler) {
          failureHandler(new Error(errorMsg));
        } else if (successHandler) {
          successHandler({ status: 'error', message: errorMsg });
        }
      };
    }
  });
}

window.google.script.run = createRunContext();


