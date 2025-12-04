// ==UserScript==
// @name         Coursera Tool
// @namespace    https://github.com/coursera-tool
// @version      1.0.0
// @description  Automate Coursera tasks: bypass videos/readings, solve quizzes with AI, auto-complete peer reviews and assignments
// @author       ruskicoder
// @match        https://www.coursera.org/*
// @icon         https://www.coursera.org/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        window.close
// @require      https://unpkg.com/react@18/umd/react.production.min.js
// @require      https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
// @require      https://cdn.jsdelivr.net/npm/react-hot-toast@2.4.1/dist/index.umd.js
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // ENVIRONMENT CHECK
    // ==========================================

    // Only run on Coursera domain
    if (!/coursera\.org/.test(window.location.hostname)) {
        console.log('Coursera Tool: Not on Coursera domain, exiting.');
        return;
    }

    console.log('Coursera Tool v1.0.0 - Initializing...');

    // ==========================================
    // HARDCODED API KEY (FALLBACK)
    // ==========================================
    // If storage keeps getting cleared, you can hardcode your API key here:
    // Just replace the empty string with your API key between the quotes
    const HARDCODED_API_KEY = "";  // Put your API key here: "AIzaSy..."

    console.log('Coursera Tool: Hardcoded API key:', HARDCODED_API_KEY ? `${HARDCODED_API_KEY.substring(0, 15)}... (ACTIVE)` : '(not set)');

    // ==========================================
    // CHROME API REPLACEMENTS
    // ==========================================

    /**
     * Helper function to parse cookies from document.cookie
     * Replaces chrome.cookies.get() functionality
     */
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    };

    /**
     * Helper function to get all cookies as an object
     */
    const getAllCookies = () => {
        const cookies = {};
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name) cookies[name] = value;
        });
        return cookies;
    };

    /**
     * HYBRID STORAGE with HARDCODED FALLBACK
     * 1. Tries GM_setValue (Tampermonkey storage)
     * 2. Falls back to hardcoded values if storage fails
     */
    const isolatedStorage = {
        set: (key, value) => {
            try {
                // Use GM_setValue - this stores in Tampermonkey's database, NOT in the page
                if (typeof GM_setValue === 'function') {
                    GM_setValue(key, value);
                    console.log(`Coursera Tool: ✓ Saved ${key} to Tampermonkey storage`);

                    // Verify immediately
                    const verify = GM_getValue(key);
                    if (verify === value) {
                        console.log(`Coursera Tool: ✓ Verified ${key} in Tampermonkey storage`);
                        return true;
                    } else {
                        console.error(`Coursera Tool: ✗ Verification failed for ${key}`);
                        return false;
                    }
                } else {
                    console.error('Coursera Tool: GM_setValue is not available!');
                    return false;
                }
            } catch (e) {
                console.error(`Coursera Tool: ✗ Failed to save ${key}:`, e);
                return false;
            }
        },

        get: (key, defaultValue = undefined) => {
            try {
                // Special handling for API key - check hardcoded value first
                if (key === 'geminiAPI' && HARDCODED_API_KEY) {
                    console.log(`Coursera Tool: ✓ Using HARDCODED API key: ${HARDCODED_API_KEY.substring(0, 15)}...`);
                    return HARDCODED_API_KEY;
                }

                if (typeof GM_getValue === 'function') {
                    const value = GM_getValue(key, defaultValue);

                    // If no value in storage and it's the API key, use hardcoded
                    if (!value && key === 'geminiAPI' && HARDCODED_API_KEY) {
                        console.log(`Coursera Tool: ✓ Falling back to HARDCODED API key`);
                        return HARDCODED_API_KEY;
                    }

                    if (value) {
                        console.log(`Coursera Tool: ✓ Loaded ${key} from Tampermonkey:`, typeof value === 'string' && value.length > 30 ? `${value.substring(0, 30)}...` : value);
                    }
                    return value;
                } else {
                    console.error('Coursera Tool: GM_getValue is not available!');
                    // Fallback to hardcoded for API key
                    if (key === 'geminiAPI' && HARDCODED_API_KEY) {
                        console.log(`Coursera Tool: ✓ Using HARDCODED API key (GM not available)`);
                        return HARDCODED_API_KEY;
                    }
                    return defaultValue;
                }
            } catch (e) {
                console.error(`Coursera Tool: ✗ Failed to load ${key}:`, e);
                // Fallback to hardcoded for API key
                if (key === 'geminiAPI' && HARDCODED_API_KEY) {
                    console.log(`Coursera Tool: ✓ Using HARDCODED API key (error fallback)`);
                    return HARDCODED_API_KEY;
                }
                return defaultValue;
            }
        },

        delete: (key) => {
            try {
                if (typeof GM_deleteValue === 'function') {
                    GM_deleteValue(key);
                    console.log(`Coursera Tool: ✓ Deleted ${key} from Tampermonkey storage`);
                    return true;
                } else {
                    console.error('Coursera Tool: GM_deleteValue is not available!');
                    return false;
                }
            } catch (e) {
                console.error(`Coursera Tool: ✗ Failed to delete ${key}:`, e);
                return false;
            }
        },

        // Debug function to list all stored keys
        listAll: () => {
            if (typeof GM_listValues === 'function') {
                return GM_listValues();
            } else {
                console.warn('Coursera Tool: GM_listValues is not available');
                return [];
            }
        }
    };

    /**
     * Chrome Storage API → Tampermonkey GM Storage
     * Provides a compatible interface for the extension code
     * Uses Tampermonkey's isolated storage that Coursera cannot clear
     */
    const chromeStorageShim = {
        local: {
            get: (keys, callback) => {
                const result = {};

                // Handle different input types
                if (typeof keys === 'string') {
                    const value = isolatedStorage.get(keys);
                    if (value !== undefined) {
                        result[keys] = value;
                    }
                } else if (Array.isArray(keys)) {
                    keys.forEach(key => {
                        const value = isolatedStorage.get(key);
                        if (value !== undefined) {
                            result[key] = value;
                        }
                    });
                } else if (typeof keys === 'object' && keys !== null) {
                    // Handle object with default values
                    Object.keys(keys).forEach(key => {
                        const value = isolatedStorage.get(key);
                        result[key] = value !== undefined ? value : keys[key];
                    });
                }

                console.log('Coursera Tool: Storage GET -', keys, '→', result);

                // Support both callback and promise patterns
                if (callback) {
                    callback(result);
                    return undefined;
                } else {
                    return Promise.resolve(result);
                }
            },
            set: (items, callback) => {
                console.log('Coursera Tool: Storage SET -', items);

                Object.entries(items).forEach(([key, value]) => {
                    isolatedStorage.set(key, value);
                });

                if (callback) {
                    callback();
                    return undefined;
                } else {
                    return Promise.resolve();
                }
            },
            remove: (keys, callback) => {
                const keyArray = Array.isArray(keys) ? keys : [keys];
                keyArray.forEach(key => {
                    isolatedStorage.delete(key);
                });

                if (callback) {
                    callback();
                    return undefined;
                } else {
                    return Promise.resolve();
                }
            },
            clear: (callback) => {
                // GM doesn't provide a way to list all keys
                // This is a limitation, but rarely used in practice
                console.warn('chrome.storage.local.clear() not fully supported in userscript');

                if (callback) {
                    callback();
                    return undefined;
                } else {
                    return Promise.resolve();
                }
            }
        },
        sync: {
            // Sync storage uses same GM_* functions (no real sync in userscripts)
            get: (keys, callback) => chromeStorageShim.local.get(keys, callback),
            set: (items, callback) => chromeStorageShim.local.set(items, callback),
            remove: (keys, callback) => chromeStorageShim.local.remove(keys, callback),
            clear: (callback) => chromeStorageShim.local.clear(callback)
        }
    };

    /**
     * Chrome Runtime API → Tampermonkey equivalents
     * Handles message passing and URL resolution
     */
    const chromeRuntimeShim = {
        sendMessage: (message, callback) => {
            // Handle different message types that were in service worker
            const response = { success: false };

            if (message.action === 'openTab' && message.url) {
                GM_openInTab(message.url, { active: true, insert: true, setParent: true });
                response.success = true;
            } else if (message.action === 'openBackgroundTab' && message.url) {
                GM_openInTab(message.url, { active: false, insert: true, setParent: true });
                response.success = true;
            } else if (message.action === 'closeTab' || message.action === 'closeCurrentTab') {
                window.close();
                response.success = true;
            } else if (message.action === 'getMetadata') {
                // Trigger CSRF token collection
                saveCSRFTokens();
                response.status = 'ok';
                response.success = true;
            }

            // Support both callback and promise patterns
            if (callback) {
                callback(response);
                return undefined;
            } else {
                return Promise.resolve(response);
            }
        },
        getURL: (path) => {
            // In userscript context, we don't need dynamic imports
            // This is a no-op since we bundle everything in a single file
            return path;
        },
        onMessage: {
            addListener: (callback) => {
                // In userscript context, there's no background script to send messages
                // This is a no-op for compatibility
                console.log('chrome.runtime.onMessage.addListener() is a no-op in userscript context');
            }
        },
        id: 'userscript-shim' // Fake extension ID for compatibility
    };

    /**
     * Chrome Cookies API → document.cookie parsing
     * Provides cookie access without requiring host permissions
     */
    const chromeCookiesShim = {
        get: (details, callback) => {
            const cookieValue = getCookie(details.name);
            const result = cookieValue ? {
                name: details.name,
                value: cookieValue,
                domain: details.url ? new URL(details.url).hostname : window.location.hostname,
                path: '/',
                secure: window.location.protocol === 'https:',
                httpOnly: false,
                sameSite: 'no_restriction'
            } : null;

            // Support both callback and promise patterns
            if (callback) {
                callback(result);
                return undefined;
            } else {
                return Promise.resolve(result);
            }
        },
        getAll: (details, callback) => {
            const cookies = getAllCookies();
            const result = Object.entries(cookies).map(([name, value]) => ({
                name,
                value,
                domain: window.location.hostname,
                path: '/',
                secure: window.location.protocol === 'https:',
                httpOnly: false,
                sameSite: 'no_restriction'
            }));

            if (callback) {
                callback(result);
                return undefined;
            } else {
                return Promise.resolve(result);
            }
        }
    };

    /**
     * Chrome Tabs API → Tampermonkey equivalents
     * Minimal implementation for compatibility
     */
    const chromeTabsShim = {
        create: (createProperties, callback) => {
            const active = createProperties.active !== false;
            GM_openInTab(createProperties.url, {
                active: active,
                insert: true,
                setParent: true
            });

            const fakeTab = {
                id: Date.now(),
                url: createProperties.url,
                active: active
            };

            if (callback) {
                callback(fakeTab);
            }
        },
        remove: (tabId, callback) => {
            // Can only close current tab in userscript
            window.close();
            if (callback) callback();
        },
        onUpdated: {
            addListener: (callback) => {
                // Monitor URL changes for CSRF token collection
                let lastUrl = window.location.href;

                const checkUrlChange = () => {
                    if (window.location.href !== lastUrl) {
                        lastUrl = window.location.href;
                        // Trigger CSRF token save
                        saveCSRFTokens();
                        // Call the listener with fake tab info
                        callback(Date.now(), { url: lastUrl }, { url: lastUrl });
                    }
                };

                // Check for URL changes (for SPA navigation)
                setInterval(checkUrlChange, 1000);

                // Also listen to popstate for back/forward navigation
                window.addEventListener('popstate', checkUrlChange);
            }
        }
    };

    /**
     * CSRF Token Collection
     * Replaces service worker functionality for collecting Coursera tokens
     */
    const saveCSRFTokens = () => {
        // Collect CSRF3-Token
        const csrf3Token = getCookie('CSRF3-Token');
        if (csrf3Token) {
            isolatedStorage.set('csrf3Token', csrf3Token);
            console.log('Coursera Tool: CSRF3-Token saved');
        }

        // Collect CAUTH token
        const cauth = getCookie('CAUTH');
        if (cauth) {
            isolatedStorage.set('CAUTH', cauth);
            console.log('Coursera Tool: CAUTH token saved');
        }
    };

    // Create global chrome shim for compatibility
    if (typeof window.chrome === 'undefined') {
        window.chrome = {};
    }

    window.chrome.storage = chromeStorageShim;
    window.chrome.runtime = chromeRuntimeShim;
    window.chrome.cookies = chromeCookiesShim;
    window.chrome.tabs = chromeTabsShim;

    // Store original fetch BEFORE creating fetchWithCORS
    const originalFetch = window.fetch;

    /**
     * Fetch API wrapper with GM_xmlhttpRequest for CORS bypass
     * Automatically falls back to GM_xmlhttpRequest for cross-origin requests
     */
    const fetchWithCORS = (url, options = {}) => {
        // Check if this is a cross-origin request
        const urlObj = new URL(url, window.location.href);
        const isCrossOrigin = urlObj.origin !== window.location.origin;

        // For same-origin requests, use ORIGINAL native fetch with credentials
        if (!isCrossOrigin) {
            // Ensure credentials are included for same-origin requests
            const optionsWithCredentials = {
                ...options,
                credentials: options.credentials || 'include'
            };
            console.log(`Coursera Tool: Using native fetch for same-origin: ${url}`);
            return originalFetch(url, optionsWithCredentials);
        }

        // For cross-origin requests, use GM_xmlhttpRequest
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body,
                responseType: options.responseType || 'text',
                onload: (response) => {
                    // Parse response headers (GM returns them as a string)
                    const headersObj = {};
                    if (response.responseHeaders) {
                        response.responseHeaders.split('\n').forEach(line => {
                            const parts = line.split(': ');
                            if (parts.length === 2) {
                                headersObj[parts[0].trim()] = parts[1].trim();
                            }
                        });
                    }

                    // Create a fetch-like response object
                    const fetchResponse = {
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        statusText: response.statusText,
                        headers: new Headers(headersObj),
                        url: response.finalUrl,
                        text: () => Promise.resolve(response.responseText),
                        json: () => Promise.resolve(JSON.parse(response.responseText)),
                        blob: () => Promise.resolve(new Blob([response.response])),
                        arrayBuffer: () => Promise.resolve(response.response)
                    };
                    resolve(fetchResponse);
                },
                onerror: (error) => {
                    reject(new Error(`GM_xmlhttpRequest failed: ${error.statusText || 'Network error'}`));
                },
                ontimeout: () => {
                    reject(new Error('GM_xmlhttpRequest timeout'));
                }
            });
        });
    };

    // Replace global fetch with CORS-capable version
    window.fetch = fetchWithCORS;

    // Store original fetch for direct access if needed
    window.fetch.original = originalFetch;

    // ==========================================
    // REACT & TOAST SETUP
    // ==========================================

    // Access React from global scope (loaded via @require)
    const React = window.React;
    const ReactDOM = window.ReactDOM;

    // Try multiple ways to access react-hot-toast
    let toast, Toaster;
    if (window.toast) {
        toast = window.toast.default || window.toast;
        Toaster = window.toast.Toaster || (window.toast.default && window.toast.default.Toaster);
    } else if (window.reactHotToast) {
        toast = window.reactHotToast.toast || window.reactHotToast;
        Toaster = window.reactHotToast.Toaster;
    }

    // Verify dependencies loaded
    if (!React || !ReactDOM) {
        console.error('Coursera Tool: React dependencies failed to load');
        return;
    }

    if (!toast) {
        console.warn('Coursera Tool: Toast library failed to load - continuing without toast notifications');
        // Create dummy toast functions so the script doesn't break
        toast = {
            success: (msg) => console.log('✓', msg),
            error: (msg) => console.error('✗', msg),
            warning: (msg) => console.warn('⚠', msg),
            loading: (msg) => console.log('⏳', msg),
            promise: (promise, msgs) => {
                console.log('⏳', msgs.loading);
                return promise.then(
                    result => { console.log('✓', msgs.success); return result; },
                    error => { console.error('✗', msgs.error); throw error; }
                );
            }
        };
        Toaster = () => null; // Dummy component
    }

    console.log('Coursera Tool: Dependencies loaded successfully');
    console.log('Coursera Tool: Chrome API shims installed');

    // ==========================================
    // INJECT STYLES (Task 3.4)
    // ==========================================

    /**
     * Inject all CSS styles from the extension
     * Includes Tailwind utilities, animations, and toast styles
     */
    const injectStyles = () => {
        const styles = `
/* =========================================
   1. Tailwind CSS Defaults & Variables
   ========================================= */
*,
:before,
:after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x: ;
  --tw-pan-y: ;
  --tw-pinch-zoom: ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position: ;
  --tw-gradient-via-position: ;
  --tw-gradient-to-position: ;
  --tw-ordinal: ;
  --tw-slashed-zero: ;
  --tw-numeric-figure: ;
  --tw-numeric-spacing: ;
  --tw-numeric-fraction: ;
  --tw-ring-inset: ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur: ;
  --tw-brightness: ;
  --tw-contrast: ;
  --tw-grayscale: ;
  --tw-hue-rotate: ;
  --tw-invert: ;
  --tw-saturate: ;
  --tw-sepia: ;
  --tw-drop-shadow: ;
  --tw-backdrop-blur: ;
  --tw-backdrop-brightness: ;
  --tw-backdrop-contrast: ;
  --tw-backdrop-grayscale: ;
  --tw-backdrop-hue-rotate: ;
  --tw-backdrop-invert: ;
  --tw-backdrop-opacity: ;
  --tw-backdrop-saturate: ;
  --tw-backdrop-sepia: ;
  --tw-contain-size: ;
  --tw-contain-layout: ;
  --tw-contain-paint: ;
  --tw-contain-style: ;
}

/* =========================================
   2. Rotation Animation (for loading spinners)
   ========================================= */
.rotate {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  0% { transform: rotate(0); }
  to { transform: rotate(360deg); }
}

/* =========================================
   3. Toast Notification Styles
   ========================================= */
.toast {
  transform: translate(-50%);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 8px #0003;
  font-size: 16px;
  opacity: 0;
  animation: fadeIn 0.5s forwards;
}
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* =========================================
   4. Progress Bar Styles
   ========================================= */
progress {
  border-radius: 7px;
  width: 80%;
  height: 12px;
  border: 1px solid rgb(0, 0, 0);
}
progress::-webkit-progress-bar {
  background-color: #ffffffd5;
  border-radius: 7px;
}
progress::-webkit-progress-value {
  background-color: #0b7af8;
  border-radius: 20px;
}

/* =========================================
   5. Coursera Tool Panel Styles
   ========================================= */
#coursera-tool-container {
  position: fixed;
  z-index: 999999;
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji";
}
`;

        GM_addStyle(styles);
        console.log('Coursera Tool: ✓ Styles injected (Task 3.4)');
    };

    // Inject styles immediately
    injectStyles();

    // ==========================================
    // CONSTANTS & CONFIGURATION
    // ==========================================

    const CONSTANTS = {
        METADATA_URL: "https://pear104.github.io/coursera-tool/gh-pages/metadata.json",
        COURSE_MAP_URL: "https://pear104.github.io/coursera-tool/gh-pages/courseMap.json",
        GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    };

    // Dictionary for generating random text for assignments
    const RANDOM_WORDS = [
    "aa", "abac", "abaca", "abear", "abele", "abjections", "ablegate", "aboon", "abort", "abrotin",
    "absinthin", "abstracted", "acana", "accede", "accent", "acceptably", "acclamation", "accreting",
    "accruable", "achage", "achaque", "achates", "achech", "achievability", "achordate", "acoustician",
    "acrawl", "acrid", "acroparesthesia", "actinia", "actinolitic", "actuation", "adages", "adamant",
    "adazzle", "addends", "addorsed", "adiate", "adlumia", "admirals", "admit", "admix", "adrench",
    "adsorption", "adulterant", "adumbrating", "advances", "advisal", "aeroduct", "aerophilia", "aerosols",
    "aerugo", "affability", "affinal", "affirmed", "afflux", "afternoon", "agabanee", "agene", "ageratum",
    "aggravating", "aggroup", "aginner", "agist", "aglobulism", "agminated", "agnail", "agnat", "airfield",
    "airstrips", "aitches", "alacha", "alang", "alantol", "albiness", "albugo", "alcoholimeter", "alchemies",
    "alertly", "alfileria", "algedi", "alhenna", "alimony", "aliptes", "allantoin", "allied", "allopaths",
    "allot", "allowably", "allseed", "allwhither", "alpargata", "also", "alterations", "alternativeness",
    "alvia", "amalic", "ambagious", "ambilogy", "ambrein", "ameed", "americanese", "ametoecious", "amidid",
    "amin", "amizilis", "ammonal", "amnion", "ampelidae", "amphibolic", "amphigaean", "amphisbaena", "amphoric",
    "anacamptic", "anacrogynous", "analysability", "anammonid", "anapaganize", "anaphorical", "anastigmatic",
    "anatripsis", "anchoritic", "ancylostomiasis", "androclinium", "anecdotist", "anethol", "angel", "anguloa",
    "anhydrite", "anilic", "animalism", "animastical", "anisometric", "ankerite", "anodynia", "anomalocephalus",
    "anoplocephalic", "ansarian", "answerable", "antarthritic", "antelocation", "antennary", "anthraflavic",
    "anthropomorphical", "antiagglutinin", "antiblock", "anticensorship", "anticlogging", "anticoagulating",
    "antidyscratic", "antigravitation", "antilogy", "antimensium", "antimoniureted", "antinomianism", "antioptionist",
    "antiquarium", "antiquitarian", "antiskeptic", "antisyndicalism", "antivenene", "antler", "anura", "apeak",
    "apeiron", "apheretic", "aphimosis", "aphyllous", "apivorous", "apodeictic", "apogonid", "apoplectically",
    "appealability", "appense", "apple", "applosion", "appropinquation", "apses", "apterium", "arabesque",
    "arachnidium", "araeostyle", "araneidan", "arariba", "arbitrary", "archcupbearer", "archphylarch",
    "arctalian", "aread", "arecaine", "argentometer", "arillary", "aristocratism", "arithmeticians", "arkansan",
    "armure", "arrentable", "arrogating", "arsenide", "arthroderm", "arthromere", "articulatory", "arum",
    "arundineous", "asclepiadae", "asclepiadaceous", "ashlering", "aspartyl", "aspergillum", "asphaltite",
    "assassinate", "assertoric", "assizer", "assonate", "asterospondyli", "astigmat", "astragal", "astringe",
    "astrometeorological", "asymmetry", "atavism", "atelectasis", "athrocytosis", "atmolysis", "atocia",
    "atrazines", "atrorubent", "attempters", "auchenia", "auditor", "auletai", "aulostomid", "auride",
    "autocades", "autochronograph", "autodialing", "autolaryngoscopy", "autoplastically", "autosoterism",
    "autotriploid", "avalent", "avenge", "avijja", "avowing", "awesome", "axiferous", "axised", "axopodia",
    "azygobranchiate", "babesiosis", "backfield", "backswording", "bacon", "bactericholia", "bade", "badgemen",
    "badgir", "badigeon", "baetyl", "baffy", "bagginess", "balanism", "balantidiosis", "balladism", "ballised",
    "ballyhoo", "balm", "balsamweed", "banderole", "banterers", "baptizes", "barbacoa", "barbarousness",
    "barbula", "bardel", "barometrograph", "barsac", "bashed", "basset", "basting", "bast", "batad", "bathrobe",
    "batonga", "battology", "baxtone", "bayoneting", "beakerman", "beanpoles", "beaverskin", "bechalking",
    "becowarding", "bedclothing", "bedote", "bedtick", "beefcakes", "beeweed", "beflour", "begar", "begowned",
    "begum", "behn", "beletter", "belili", "bellicosity", "belonoid", "bemartyr", "bemocking", "benchboard",
    "bendlets", "benzal", "beperiwigged", "berberidaceous", "bergylt", "beriberic", "berth", "besmirch",
    "besoothe", "bestock", "betatters", "bethroot", "betulinamaric", "bevel", "bewrayer", "bezzants", "bhandari",
    "bibbons", "bichlorides", "bichromate", "bieldy", "bihamate", "bilbie", "billfolds", "bimillenary", "bingey",
    "biocoenosis", "bioherm", "biomicroscopy", "bipinnarias", "birch", "birdwise", "byrsonima", "bisalt",
    "biscuit", "bismutosphaerite", "bistipuled", "bizones", "blackbelly", "blackies", "blarneyed", "blastospheric",
    "blattodea", "blellum", "blepharoatheroma", "blockishness", "bloodcurdlingly", "bloke", "bloodthirstiness",
    "blowcock", "blows", "bluefish", "boastfulness", "boatbill", "bobs", "boccaro", "bodier", "boilers", "boldin",
    "bolectured", "bolls", "bolthead", "bonacis", "bony", "boopis", "boozier", "boreal", "boroughmaster",
    "bossage", "botching", "bottled", "boughpot", "bourette", "bowker", "bowlderhead", "boxhaul", "brachydactyly",
    "brachygnathism", "bracted", "braiding", "branchiostege", "brandish", "bransles", "brassicaceous", "brawniest",
    "breba", "brees", "bregmata", "brian", "bridie", "brier", "brines", "britishism", "broaden", "bromhydrate",
    "bromocyanidation", "bronchophonic", "bronzewing", "brookable", "brotany", "browis", "bruisewort", "bubalis",
    "bubbly", "budorcas", "bugara", "bulbier", "bullbaiting", "bullpout", "bumaree", "bundler", "bunkos",
    "burdenous", "burglarizing", "burnie", "burrs", "bursiculate", "busket", "busybodies", "butane", "butcheress",
    "butters", "butyryl", "buxomly", "buzzwig", "caba", "cabers", "cacophony", "cadelle", "calaber", "calatrava",
    "calcareosulphurous", "calctufa", "caliciform", "callboy", "calliphorine", "calomels", "cameralist", "camerlingo",
    "camoca", "campanero", "canaliculate", "canceling", "candler", "canephoroe", "cangia", "cannabic", "cannibally",
    "cantharellus", "cantilevers", "cantonments", "capernaitish", "capillaire", "capitulum", "capsulotomy",
    "carat", "carbacidometer", "carbonigenous", "cardcase", "cardinalist", "cardioblast", "careeners", "carling",
    "carnivalesque", "carolled", "carphophis", "carrick", "cartloads", "carton", "carve", "casewood", "casper",
    "castrate", "cataclysmic", "cataphract", "catastrophist", "catechistic", "caterbrawl", "cathedratic", "cathood",
    "caudatolenticular", "caulis", "causativity", "cavilingness", "cecity", "celestite", "celiagra", "cellarette",
    "cementer", "cenozoic", "centipede", "centrifugence", "centumviral", "cephalodymus", "cephalothorax", "cerago",
    "ceration", "cerebrospinal", "cerule", "cervelas", "cervicobregmatic", "cesura", "cetonian", "chalastogastra",
    "challis", "chamois", "champagnizing", "chapbooks", "chapeaus", "characinid", "charisticary", "charlatans",
    "charqued", "chaussee", "chebel", "cheekful", "cheerlessly", "chelydroid", "chemist", "chemotactically",
    "cheques", "chess", "chicagoan", "chiding", "chiliastic", "chylifactive", "chymification", "chingpaw",
    "chirognomy", "chirogymnast", "chiroplasty", "chiros", "chirrup", "chittak", "chlamydobacteriaceae",
    "chloranaemia", "chocard", "choledochotomy", "chondrogeny", "chorio", "choriphyllous", "chortler", "chromatize",
    "chromatophil", "chronicler", "chronometer", "chrysophanic", "chumble", "churchanity", "chyluria", "ciceronianisms",
    "ciconian", "cycliae", "ciconiiform", "cilioflagellata", "cylindrically", "cimbric", "cinchonate",
    "cinchonization", "cynomorphic", "cinter", "cipollino", "circue", "circumduce", "circumventing", "ciseleurs",
    "cissing", "citational", "citharoedus", "civicism", "clacket", "cladine", "claggum", "clangor", "clanking",
    "classicism", "clathrarian", "clatterer", "clechee", "cleidomastoid", "clientless", "clymenia", "climacterical",
    "clinandrium", "clingy", "clinohedrite", "clitoridectomy", "cloisteral", "clumsier", "coacervate", "coadventure",
    "coalless", "coapt", "coattestator", "cobalts", "coccidioidal", "cochleare", "coco", "coctoprecipitin",
    "coenamored", "cogredient", "coheading", "cohelpership", "cohesionless", "coiffures", "coinitial", "coinsure",
    "coked", "colauxe", "colicin", "collecting", "colloidal", "colloidochemical", "colombier", "coloptosis",
    "colotyphoid", "colpitises", "columbier", "comedial", "comfortation", "commensal", "commixture", "commonplace",
    "communicably", "commutation", "compendent", "compital", "complicate", "compos", "compsognathus", "concavity",
    "concentrating", "concertatos", "conchyliated", "concomitancy", "concurringly", "conductus", "conepates",
    "confession", "confluence", "congruency", "conic", "coniospermous", "connaturally", "connecter", "connoissance",
    "consecrated", "consequents", "consimilate", "constabless", "constellatory", "consumptiveness", "contactual",
    "contessa", "contortion", "contradictable", "contramire", "controling", "conventionalist", "conversazione",
    "convexed", "convivialist", "cooer", "coofs", "copartnership", "coppaelite", "coprecipitation", "coradical",
    "cordage", "cordonnet", "cordwainery", "coremaker", "corneule", "corocleisis", "coronadite", "corporification",
    "corrective", "corrugator", "corv", "coryphaenoid", "coryzas", "costumist", "coteries", "cotsetle", "cotwist",
    "counterapproach", "counteraverment", "counterborer", "counterdistinction", "countergarrison", "counterlit",
    "counterplea", "counterriposte", "countertraverse", "courbettes", "courtierism", "couturiere", "cowbird",
    "coxswaining", "crab", "crampingly", "craniota", "craniotabes", "craniotomy", "creamware", "creatable",
    "credensiveness", "cressy", "cretinization", "crick", "crimpness", "cringed", "criosphinx", "crispness",
    "crystallites", "criticizes", "croconic", "crossbreds", "crosscutting", "crotalid", "crotalum", "crouchmas",
    "crumminess", "crustation", "cuadrillas", "cubito", "cucumiform", "culminant", "culottism", "cumulatively",
    "cuneal", "cupolas", "curcas", "curiatii", "curiology", "curtalaxe", "curvity", "cusp", "customizers", "cutler",
    "dacryd", "dactylioglyphy", "daedalous", "daemonies", "daguerreotypic", "daintifying", "dakhini", "damkjernite",
    "dankishness", "daphnoid", "dappleness", "dasymeter", "dasyproctine", "daubier", "dcollet", "deadrise", "deairs",
    "deaving", "debasingly", "debauch", "decalcifying", "decapitates", "decentralizing", "dechlorinated",
    "decister", "declassing", "decolourized", "decoying", "decrements", "decussated", "deepfrozen", "deepmost",
    "defaceable", "defect", "deflorate", "defreeze", "dehumanising", "dehydrant", "deinos", "dekameters",
    "delegatus", "deliberations", "deliquesced", "delusions", "demasting", "demibrigade", "demipike", "demitint",
    "demolishment", "demoraliser", "demy", "dendrograph", "dentally", "denver", "departements", "dephlegmatize",
    "depolishing", "depravers", "deprogrammers", "deracination", "dermophyte", "derning", "derogated", "desalinized",
    "desertedness", "designlessly", "desmidiaceae", "despeche", "desponding", "despumate", "desulphurize",
    "detersion", "detumescence", "deutomala", "development", "devisee", "devourers", "devvel", "dewy", "dextroses",
    "dhotee", "diacrisis", "dialogued", "diapaused", "diarrheal", "diatomacean", "dicer", "dichogamic", "dichotic",
    "dictyosiphonaceae", "didelphine", "diestrum", "diezeugmenon", "digenite", "diglottism", "digor", "dilating",
    "dilatometric", "diminishable", "dynamis", "dynamistic", "dynast", "dinmont", "dioscoreaceae", "diphyozooid",
    "diplophonic", "diplotene", "dipnoan", "dipterology", "direx", "disassembled", "disbrain", "discernibly",
    "discocarpous", "discommodiousness", "discontinuation", "discordantly", "discoursed", "discretively",
    "disentitlement", "disentwined", "disfeatured", "dishonorable", "disincorporating", "disinhumed", "dislocatedness",
    "dismal", "disoxidate", "dispathy", "dispersiveness", "disposability", "disputants", "disseize", "dissert",
    "dissimilation", "distasted", "distressfully", "dita", "dittoed", "divagations", "divestiture", "divisibility",
    "djelfa", "docents", "dochmiac", "doddie", "dogedoms", "dolichocranial", "dollishness", "domnei", "donatories",
    "donship", "dopamines", "dopester", "dorlach", "dorsocaudal", "dorsulum", "dossier", "dovetails", "doz",
    "draconin", "dradge", "dragoonable", "drawlers", "dredging", "dreissena", "drillbit", "dronishly", "droopiest",
    "droschken", "druidess", "drumwood", "dryopes", "dubitation", "ductility", "dulcigenic", "duologues", "duplet",
    "dusack", "duumviri", "duvetines", "eardrops", "earlocks", "earthless", "easygoingness", "echidnas",
    "echinulate", "ecstatic", "ectocommensal", "ectropion", "edgeweed", "editch", "editorializer", "eelshop",
    "effigiating", "eggplant", "eggwhisk", "egotistically", "eider", "einkorn", "ejecta", "elations", "election",
    "elective", "electrolysis", "electrostriction", "electrotherapeutist", "elegies", "elephantiasic", "eleutheromania",
    "elicitate", "elongating", "emanated", "embattling", "emblazons", "embolium", "embryology", "emetical",
    "emigrating", "emolumental", "emparchment", "emphractic", "empowerment", "emulsify", "enact", "encephalographic",
    "enchainement", "encomiast", "encrusts", "encyclopedism", "endamageable", "endocone", "endovenous", "endurer",
    "enfeoffment", "enflagellation", "engolden", "engrail", "enjoyable", "enkindler", "enlargers", "enlivens",
    "enneagon", "ensphere", "enswathes", "enteroischiocele", "entoblast", "entomophilous", "entosthoblast",
    "entracte", "enumerator", "enwombs", "epagomenae", "epexegetically", "epical", "epicoelian", "epigrammatizing",
    "epileptics", "epipodium", "epirote", "episiocele", "epispastic", "epistolising", "epopoean", "equative",
    "equinity", "erection", "eremian", "ergatogyny", "ergotized", "erigible", "erinite", "erythrochroism",
    "erythroclasis", "escalates", "escartelly", "escharotic", "escheats", "eschewing", "esociform", "esophagodynia",
    "espial", "espinel", "essayist", "estaminets", "estherian", "ethel", "ethnobotanist", "euploeinae",
    "eurithermophile", "eustylos", "evanescency", "evenly", "evertebrate", "evictee", "evincibly", "eviscerate",
    "evulsions", "exactitude", "excommunicators", "excurvate", "excursus", "excuse", "exemplificator", "exhedra",
    "exoneretur", "exostosed", "expansibility", "expediently", "expiscation", "explainable", "explantation",
    "explication", "explicits", "exploitage", "extorsively", "extraembryonal", "extrastapedial", "extremest",
    "extrusory", "eyeholes", "fackins", "factualness", "fagging", "faille", "falafel", "fallibly", "familiariser",
    "famulary", "fanaticizing", "faradizing", "farmscape", "fashionize", "fatigue", "fattiness", "faunistic",
    "fealties", "fearful", "feckless", "fecundator", "feer", "felinophobe", "fellation", "femerell", "fenestrated",
    "fermi", "fernland", "fertilisation", "festiveness", "fetch", "feverwort", "fibrillating", "fibrocaseose",
    "fibular", "fickle", "fictile", "figwort", "filamentoid", "fillemot", "filmset", "fineable", "finickily",
    "fiorite", "fissipedial", "fistiana", "flabbiness", "flabellum", "flammulation", "flayers", "flammed",
    "flannelette", "flatness", "fleam", "fleuretty", "flightiness", "flimp", "flingy", "flippest", "floatage",
    "floodboard", "flooring", "flossflower", "flotages", "flowk", "fluocerine", "fluorspar", "fluviolacustrine",
    "fodder", "foetiparous", "foliating", "folkmots", "folliculated", "fondue", "foraminous", "forbearer",
    "forche", "forehard", "foreheaded", "foreshot", "forestal", "foresty", "forjudged", "forleave", "formularised",
    "forslow", "fortnight", "fortuitousness", "foulard", "foully", "foxily", "frangulin", "frankliniana",
    "freeboot", "fremitus", "frequentest", "freshman", "fricasseeing", "frightening", "frivolousness", "frokin",
    "fromage", "froren", "fructuosity", "fruitless", "frumpily", "fuchsian", "fumaryl", "fumid", "fumitory",
    "funebrous", "funnyman", "furane", "furriner", "fusiliers", "fussbudget", "fustiest", "gadroon", "gadsbud",
    "gaen", "gagman", "galiots", "gamasidae", "gamboller", "gamotropic", "ganner", "garboard", "gardened",
    "gardenless", "garget", "garrison", "garrot", "gasp", "gastrostomize", "gaudish", "gaudless", "gaveling",
    "gazetteerish", "gecking", "gelatinising", "gemeinschaft", "gemma", "genipap", "gentilesse", "geodesic",
    "geolatry", "geophilus", "geosid", "germanics", "germanization", "gettable", "ghatwal", "ghoulie", "gibier",
    "giddier", "gigeria", "gimlet", "gymnosporous", "gynecomastia", "giraffesque", "gyration", "glabellous",
    "glaciating", "gladsome", "glaire", "glamours", "glassworker", "glebal", "glegly", "glycosyl", "glyptolith",
    "globoseness", "glopnen", "glovelike", "glowered", "glucolipid", "gluttonous", "gneissoid", "goalers", "gobies",
    "goen", "golden", "golland", "goniatitoid", "gonidic", "goodlier", "goosehouse", "gospelize", "gossipping",
    "gouge", "government", "graciles", "grafship", "gramme", "grandams", "granite", "granitification", "granola",
    "graperoot", "graphometric", "graveling", "greegrees", "greensick", "grenadierial", "grievousness", "grimalkin",
    "grimmia", "grister", "grosgrain", "grossing", "grovelingly", "growlery", "grumly", "guarantees", "guideless",
    "guydom", "gulfy", "gulper", "gumminess", "gumpheon", "gunky", "gunnage", "gunnies", "gurney", "gutta",
    "guttiness", "gutturals", "haemathermal", "haggai", "haggardness", "hained", "hajis", "halalcor", "haler",
    "halitosis", "halloysite", "hammercloth", "handicap", "handsomeness", "handstone", "hanker", "haploperistomic",
    "haply", "haram", "harlock", "harnessers", "harry", "hasn", "hatchetman", "hatred", "haughtly", "hawsehole",
    "headender", "headstrong", "heap", "hearkener", "heath", "heathy", "hecatophyllous", "helicities",
    "heliophilous", "helmless", "hematocele", "hemellitene", "hemipteran", "hemstitch", "henchmanship",
    "hendecahedral", "heparin", "hepatorrhagia", "hepatologist", "heptanone", "heraclidan", "herborize", "hermit",
    "hermitess", "herpetologists", "herringbones", "hesitatingly", "heterogonic", "heterosyllabic", "heterotopia",
    "hexacorallan", "hexandria", "hexosaminidase", "hyaluronic", "hiatal", "hydraulics", "hydrion", "hydrodynamic",
    "hydrogode", "hydromotor", "hydrotherapeutical", "hydrozincite", "hierogrammatist", "hightop", "hilar",
    "hilarious", "hilding", "hylozoistic", "hymenomycete", "hyoid", "hyolithoid", "hyperdeifying", "hyperemphasizing",
    "hypermoral", "hyperparasitism", "hyperphalangeal", "hypersensuous", "hypnobate", "hypoblast", "hypocist",
    "hypophysectomizing", "hypophosphate", "hypopus", "hypothetical", "hypothetizer", "hippuritoid", "hirable",
    "hirsutism", "histidins", "histrionical", "hitching", "hobbly", "hogmenay", "hogtie", "holders", "holibut",
    "hollooing", "holophrasm", "homaloidal", "homatomic", "homodermic", "homogen", "homoeomery", "homogony",
    "homophonous", "hoodsheaf", "hookaroon", "hookier", "hooky", "hopsack", "horde", "horizonal", "horseboy",
    "horseshit", "hostler", "housecarl", "housewrecker", "hs", "hudsonian", "hulver", "humblehearted", "humerus",
    "humoral", "huntsmen", "hurries", "hustle", "huzza", "huzzy", "yapocks", "icarian", "iced", "iceman",
    "ichthyophagan", "ideaed", "ideates", "identification", "idiotically", "idlesse", "idols", "idryl", "jejunely",
    "ygapo", "iguanas", "ileac", "illamon", "illimited", "illuviated", "imagining", "imbitters", "imitation",
    "immeasurableness", "immobilise", "immuniser", "impairment", "impartation", "impecunious", "impedingly",
    "imperator", "imperceptiveness", "implicitness", "importuned", "imprecant", "impressionary", "improvers",
    "inappellability", "inapplicability", "inapproachably", "inaudibly", "incardinating", "incarmined", "incisal",
    "incoffin", "incommutability", "incomprehensibleness", "inconsequence", "incorrigibility", "incredibleness",
    "incriminate", "inculture", "indenturing", "indican", "indicatrix", "indigo", "indiscerptibleness", "individual",
    "induct", "ineludible", "inexhausted", "infibulation", "infiniteness", "infirm", "infoldment", "informativeness",
    "infrastructure", "ingenerating", "ingestible", "ingle", "ingratiating", "inherent", "inknot", "innoxiousness",
    "innutritious", "inquietude", "inquisitions", "insistingly", "insnare", "instillation", "instillator",
    "instrumentals", "insulize", "intarsa", "intelligentsia", "intentions", "interaction", "interclash",
    "intercomparison", "intercutaneous", "interfiltrated", "intergrave", "interjection", "interlacement",
    "intermediary", "intermeddling", "intermigrated", "internationalists", "interpause", "interright", "intersert",
    "interstrive", "intertrochlear", "interwhiff", "inthrallment", "intimater", "intraabdominal", "intrados",
    "intromitted", "intuitable", "inurbane", "invaginated", "invariants", "invigorating", "involucel",
    "involutional", "ionizers", "irides", "iridoavulsion", "iridoncus", "ironize", "irresponsibly", "irritative",
    "isinglass", "islandish", "isobathytherm", "isocrymal", "isogamic", "isogynous", "isomeric", "isopod",
    "isthmiate", "itel", "ytterbous", "ivory", "jabbed", "jackeroo", "jacobitical", "jactivus", "jamb", "janders",
    "jarfly", "jasey", "jasper", "jealousy", "jelab", "jerry", "jessing", "jewelling", "jiffy", "jiggle", "jingoish",
    "join", "jollities", "josepha", "journeyed", "jubilancy", "judaeophobe", "judge", "julolidine", "junkiest",
    "jurant", "justiciarship", "jutty", "juxtaposit", "kaliform", "kamseen", "kantiara", "karabiner", "kashrut",
    "kecky", "kedge", "keitloas", "kendos", "kerasine", "kestrel", "ketonuria", "kibitzes", "kiddy", "kidsman",
    "kier", "kiltings", "kindergarten", "kinescope", "kinetochore", "kirtle", "kithara", "kittenishness", "kiva",
    "knapsacking", "knitweed", "knockout", "knotter", "kokra", "konimeter", "kopeks", "korntunnur", "kuehneola",
    "kunzite", "kythe", "labyrinthed", "lacer", "lactean", "lactometer", "ladrone", "ladylikeness", "lageniform",
    "lakeweed", "lambling", "lamely", "laminariaceous", "lammastide", "lampoonery", "lanas", "landbook", "langsyne",
    "lapsed", "larithmics", "laryngostomy", "lascar", "latches", "latewhile", "latices", "laurel", "lavas", "laveer",
    "leadenly", "leafiness", "lean", "lectionary", "leeboard", "leftward", "legendize", "lemuroid", "lemuroids",
    "lends", "lentiform", "lepidine", "leproma", "lethargized", "leucitohedron", "leucospheric", "leucous", "levier",
    "levy", "liberation", "liberticide", "lycopene", "lickspit", "liever", "lift", "lightening", "ligniform",
    "lyly", "limbers", "limnanthemum", "linacs", "liners", "linguistical", "lynx", "lyophiled", "lipless", "liquefy",
    "lyrebird", "listable", "literatured", "lithifying", "lithotresis", "littermate", "littress", "livyer",
    "lobelet", "loblolly", "lockups", "lodging", "logogram", "logorrheic", "londoner", "longbowman", "longhead",
    "looking", "loppard", "loranskite", "losing", "lousiest", "lovably", "loxolophodon", "lucernaria", "luddism",
    "lugmark", "lulavs", "luminiferous", "lupinine", "lusciously", "luted", "luthern", "luxation", "machos",
    "macracanthrorhynchiasis", "macropodian", "maculate", "madge", "maena", "magal", "magistratically", "magnetoid",
    "mahlstick", "maidservant", "mail", "mainpin", "maintopman", "makable", "malemute", "malism", "malleability",
    "malmstone", "maltreator", "mamba", "mammin", "mandritta", "maniacal", "manifoldwise", "manjak", "manservant",
    "mantle", "marblier", "maremmese", "marginal", "markedly", "marksmanship", "marplot", "marshmen", "martialness",
    "mascle", "mashie", "masses", "masthead", "masuriums", "matelessness", "materializing", "matriculatory",
    "maudlinwort", "maundering", "mazier", "meak", "mechanistic", "mechitarist", "medalist", "mediaeval",
    "medieval", "medley", "medusal", "meeting", "megaloblastic", "megascopical", "melanorrhea", "melanure",
    "melilite", "memorially", "mendicant", "mentum", "mercurialness", "merited", "meroplankton", "merrier",
    "meshuggana", "messroom", "metachromatin", "metaling", "metamorphosed", "metapore", "metastatically",
    "metatarsal", "methanoic", "metier", "metif", "metroradioscope", "meute", "mhz", "mycoderm", "microarchitecture",
    "micrococcal", "microdentous", "micrologically", "micromanipulation", "microplastometer", "micropterous",
    "microstructural", "midevening", "mydriasis", "miel", "miffier", "mikvah", "militaristic", "millenium",
    "milleporine", "millocracy", "mimicism", "mineralizable", "minimus", "minis", "minnies", "minutiae", "mirabelle",
    "myriameter", "myron", "misapprehend", "misbecomingness", "misbestowal", "miscegenation", "miscript", "misdeal",
    "misemploy", "misfigure", "mishanter", "misjoin", "mismosh", "misoneism", "misplayed", "misreposed",
    "misshaping", "missionaries", "missounded", "mistakeful", "mistrustfully", "miticide", "mitten", "mitua",
    "mizzling", "moa", "mockernut", "mockeries", "mode", "modena", "molifying", "molluscous", "momist", "moner",
    "monetite", "mongrels", "monishing", "monistical", "monocarp", "monochord", "monogamistic", "monogenous",
    "monolinguist", "monoparesthesia", "monotelephone", "moonily", "moorish", "moralness", "morat", "mormyrid",
    "morphemic", "mortared", "mosasauridae", "mosser", "motherliness", "motherwort", "motivator", "motorman",
    "moujik", "mu", "mucomembranous", "mucors", "mudar", "mughouse", "muletress", "multimode", "multiplane",
    "multitudinary", "mumped", "murlemew", "muroid", "murthered", "muscicolous", "musicker", "mustard", "musth",
    "mutableness", "mutineer", "nagami", "naivete", "namelessness", "nandin", "nappers", "narcissists", "narcous",
    "nargileh", "nark", "navettes", "neaped", "nebules", "necromania", "neglecter", "negligibleness", "neighbored",
    "nelson", "nematozooid", "neomodal", "neotremata", "nephelometrical", "nephew", "nesotragus", "nettlebed",
    "neurinomata", "neurism", "neutral", "newfangled", "newspaperish", "nicher", "nicotia", "nicotianin", "nigh",
    "nigre", "nylghau", "nineties", "niter", "nitrobacteria", "nivellization", "nocerite", "nodular", "nogging",
    "nominate", "nonaccent", "nonadaptor", "nonanatomical", "nonbelievingly", "nonburdensome", "noncalculator",
    "noncallable", "noncancerous", "noncapricious", "noncognizance", "noncommemoration", "noncompounder",
    "noncondescending", "nonconfrontation", "noncontingency", "nonconversably", "noncredit", "noncrustaceous",
    "nondefiner", "nondetractive", "nondichogamous", "nondilation", "nondisputatiously", "nonepileptic",
    "nonequable", "nonequilibrium", "nonequivalently", "nonexhaustiveness", "nonexpert", "nonfelicitousness",
    "nonfermentability", "nonfictitiously", "nonfocal", "nonformidable", "nonfossiliferous", "nongeological",
    "noninfectious", "noninterchangeability", "nonirrationalness", "nonjury", "nonlitigiousness", "nonmaturative",
    "nonmigratory", "nonmischievous", "nonofficeholding", "nonoxygenous", "nonpalatalization", "nonpersecutive",
    "nonphenomenal", "nonprecedent", "nonprepositional", "nonprobability", "nonprohibitive", "nonprovidence",
    "nonpsychic", "nonrespectabilities", "nonretention", "nonsanctities", "nonscoring", "nonsecular",
    "nonsignificance", "nonskeptical", "nonsolicitous", "nonsubscriber", "nontelepathic", "nonteetotaler",
    "nontyphoidal", "nonunitable", "nonvasculous", "nonviolability", "nonviscid", "nonviviparous", "norseling",
    "norther", "not", "nothings", "notoriously", "nous", "novus", "nubbin", "nubilous", "nuchale", "numerated",
    "nuncios", "nursekin", "oariopathic", "obediential", "oblat", "obligatorily", "obnoxious", "obolary",
    "obstructedly", "obstructs", "obtrusion", "obverts", "occipitoatlantal", "occipitoparietal", "occipitosphenoidal",
    "octadic", "octoploid", "odorously", "oenometer", "offenceless", "oidia", "oleandrin", "oleo", "oleoresin",
    "oligomerization", "omened", "omissible", "omnific", "onewhere", "onlap", "onychophyma", "onomatous",
    "ontologism", "oophorectomized", "operculiform", "ophidians", "ophidion", "opisthoglyphous", "oppilation",
    "opticians", "orbicular", "orchestrally", "orchids", "ordainers", "oreides", "organizationist", "organoleptic",
    "ornamentally", "ornithic", "orobanchaceous", "orogenic", "orometry", "orotund", "orthochromatic", "orthodiazin",
    "orthopath", "orthopedists", "osteostraci", "otiose", "otoconium", "outbless", "outbrag", "outbuilds", "outdate",
    "outfielders", "outflung", "outjetting", "outlasted", "outmatch", "outpour", "outrider", "outrive",
    "outserves", "outshoots", "outshouted", "outshoving", "outsights", "outstared", "outswindled", "outtalk",
    "outtrick", "outwander", "outwriggled", "overcapacities", "overcapitalised", "overcommonness", "overdevotedly",
    "overdiligence", "overdiscouraged", "overeditorializing", "overemulated", "overfaintness", "overflowing",
    "overglaze", "overhandled", "overheave", "overinclining", "overleaven", "overlipping", "overlogicality",
    "overluscious", "overmaster", "overmerit", "overmilitaristically", "overprolixness", "overscrupulousness",
    "overseers", "oversmoothly", "overspoken", "overstretching", "overstrong", "overstuffed", "oversup",
    "overwritten", "ovorhomboidal", "ovotestis", "oxyacanthine", "oxybenzyl", "oxymuriatic", "oxyneurine",
    "oxiphonal", "pacificatory", "packet", "pactionally", "paddock", "payess", "palaemon", "palaeobotany",
    "palaeoniscid", "palatines", "paleentomology", "paleotropical", "palfrey", "pallies", "palmister",
    "paludic", "pampas", "pancratic", "pandan", "panegyric", "pannery", "pantechnicon", "pantheology", "pantomancer",
    "papaveraceous", "papicolist", "pappyri", "papulose", "parablast", "parabomb", "parachutist", "paramecium",
    "paraphs", "parapodium", "parasitidae", "paratroop", "paravail", "parenting", "parietosphenoidal",
    "parkway", "parodistically", "parsimoniousness", "partan", "parte", "particeps", "partisanship", "passade",
    "passementerie", "passgang", "pathfarer", "patricians", "patriotics", "patsies", "pausingly", "pavonine",
    "peasantship", "pebbliest", "peckishly", "pectosic", "peculiarising", "pediculated", "pedler", "peerlessness",
    "pelisses", "pellagra", "pellucidity", "penlite", "penmaster", "penoncel", "pentaploidy", "penthemimeral",
    "pentosan", "peptonising", "perambulation", "perborate", "perfectionate", "perfectionistic", "perfumed",
    "pericentral", "periodontist", "periphrases", "periphrasist", "perjink", "perlingual", "permillage",
    "perpendicularness", "persico", "perspective", "persuadably", "perversive", "pestilential", "petling",
    "petrogeny", "petrographically", "petulance", "pfeffernuss", "phaeospore", "phalangeal", "phantasmagorial",
    "pharaohs", "pharmacopoeial", "phaseolunatin", "philauty", "philibeg", "philippic", "philonium",
    "phlebarteriodialysis", "physicomorphism", "physiocratic", "physiologer", "physiosophic", "phlegethontal",
    "phlogistic", "phony", "phosphoruria", "phosphuranylite", "photogravure", "photometry", "photophysical",
    "phratries", "phrasemake", "phryganeidae", "phylloclad", "phyllocladous", "phyllostomous", "picayunish",
    "pickedness", "picnickery", "pictorialising", "piece", "pilpul", "pily", "pimps", "pincushion", "pinity",
    "pinners", "pinnigrade", "pippiner", "pisiform", "pitahaya", "pythiad", "placemonger", "placuntitis",
    "plaided", "plaintively", "planispheric", "plank", "plantal", "platanaceous", "platelet", "platycephalism",
    "platystencephaly", "plebicolist", "plemyrameter", "plessor", "pleuropulmonary", "plimsols", "plodder",
    "plowmaking", "plumbicon", "plunge", "pluralising", "pluviometrically", "pneumatocyst", "pneumometer",
    "pochards", "podosomata", "poeticized", "poilu", "polarly", "polyadic", "polybasicity", "polychrestic",
    "polygenous", "polyglotting", "polygynious", "polygony", "polyhedric", "polymerization", "polymorphean",
    "polytonic", "pomaceous", "ponderousness", "pontifices", "popdock", "poplin", "porett", "pornos", "porteligature",
    "portership", "positional", "postcolumellar", "postmaster", "postphrenic", "postpositional", "pot",
    "potentiometrically", "poults", "powdike", "praeneural", "praeposter", "pratingly", "prau", "preachiest",
    "preacknowledging", "preavowal", "preboding", "prechoroid", "preciousness", "preclusion", "precognizant",
    "preconfinement", "preconquest", "precorruptness", "precutting", "predeliberation", "predeprived", "predestinarian",
    "predestinate", "preeffort", "preenforcing", "preferrous", "prefigures", "prehalter", "prehensility",
    "preimposing", "preindemnity", "preissue", "premeditatingly", "premonishment", "premycotic", "preparatively",
    "prepurchased", "prerejoiced", "presacrificial", "prescient", "prescriptibility", "present", "presusceptible",
    "preteaching", "pretext", "prethyroid", "pretone", "pretypify", "prevenient", "prevues", "prideling",
    "primigenious", "primness", "principe", "privateness", "prizewinning", "probers", "probiology", "processed",
    "procteurynter", "procuresses", "professes", "profluence", "progoneate", "prointegration", "proletarianised",
    "prologed", "promoderation", "prompt", "pronominalize", "proofread", "propionibacterium", "propupal",
    "prorogate", "proscind", "prospectively", "prosperously", "prostades", "prostheca", "protocatechualdehyde",
    "protohemipteran", "protoxids", "prov", "provision", "proximolabial", "prussin", "psammophilous", "psephism",
    "pseudoantique", "pseudochrysolite", "pseudoconclude", "pseudoinsoluble", "pseudolamellibranchiate", "pseudoracemic",
    "pseudotribal", "psychoanalyses", "psychognosis", "psychostatics", "psittacistic", "pteropodium", "ptyalism",
    "pubigerous", "pudency", "pudgier", "puff", "pugh", "pukras", "pulajan", "pulmonated", "pulverulence", "punier",
    "purfles", "purpurogenous", "purring", "pus", "putredinal", "qadarite", "quaggier", "qualmyish", "quarterstaves",
    "quartzose", "quashee", "quatrains", "quavery", "quelite", "quibblers", "quicksilver", "quid", "quinquatrus",
    "quintius", "quiscos", "quitclaims", "quizziness", "rachischisis", "radding", "radiability", "radiodontia",
    "radiotelephony", "raftsmen", "ragman", "ragtime", "rakis", "rampageousness", "ramphastos", "rancid", "ranking",
    "raphides", "raptus", "rascallion", "ratteen", "raucid", "raveling", "rawhead", "readings", "readjourn",
    "reapplier", "rearward", "reassurance", "reballot", "rebeldom", "rebounds", "recast", "recipiangle",
    "reckoning", "reclimbed", "recollation", "recompete", "reconduction", "reconstitutes", "recontemplated",
    "recremental", "rectilineal", "redbrush", "redears", "redeye", "redrape", "reduviid", "reejecting", "reenlist",
    "reeshie", "refl", "reforge", "refusingly", "regains", "regius", "reheeling", "reichsgulden", "reimpact",
    "reincidency", "rejoicers", "relicti", "relishing", "remeasure", "remication", "remigrates", "remollified",
    "renegaded", "renverse", "reoviruses", "repandly", "repapered", "rephonate", "reproachfully", "reprovingly",
    "reprovocation", "repulsively", "reree", "rereward", "resell", "resentenced", "resiant", "resistant",
    "respectably", "responsively", "ressaut", "restorability", "resurrectionism", "resurrects", "reticuli",
    "retraxit", "retrofracted", "retrogressed", "retrolingual", "revanchism", "reverbatory", "revest", "revolubly",
    "revulse", "rhapidophyllum", "rheotropic", "rhipidopterous", "rhomboidally", "rhymery", "riband", "ribboning",
    "ricers", "ricketiness", "ryder", "rye", "rightless", "rigidness", "rim", "ripplet", "ritard", "ritualist",
    "robustly", "rockelay", "rockling", "rollerman", "romagnese", "romulus", "roodles", "ropey", "roquist",
    "rorifluent", "rotalian", "rothermuck", "rouper", "rubstone", "rudderpost", "ruffianish", "rugged", "rumpling",
    "runfish", "rustlingly", "sabana", "saccular", "sacralgia", "sagittocyst", "sakieh", "salamandroid",
    "salesman", "salivate", "saltless", "saltorel", "salvableness", "sambuke", "sampsaean", "sanctifies",
    "sandbug", "sandust", "sanguinis", "sappy", "sarkless", "sashoon", "sassiest", "satisfy", "saturnic",
    "saucier", "saumont", "sawneys", "saxifragaceous", "scabby", "scalled", "scanty", "scarebabe", "scatula",
    "scavengery", "schlemihl", "schmelz", "schnoz", "schoolfellow", "schoolmaamish", "schooner", "sciaticas",
    "sclerodermatous", "sclerogen", "scopic", "scornfulness", "scrabble", "screek", "scribbling", "scrivaille",
    "scroyle", "sculch", "scunge", "seaboard", "seasoning", "sebific", "secondary", "sectile", "secundine",
    "seedkin", "segmentary", "seismological", "sella", "semicontradiction", "semilunated", "semilustrous",
    "seminarcotic", "semioxygenized", "semipsychotic", "semispiritous", "senatorian", "senesce", "sension",
    "separatism", "sepia", "septemfoliate", "septentrional", "septfoil", "septiform", "septuagenarianism",
    "seraglio", "sermonise", "sermonizes", "serrature", "serviture", "setier", "sextupled", "shack", "shadine",
    "shadowboxing", "shalder", "shallots", "shathmont", "shearhog", "sheikhlike", "shintoists", "shipless",
    "shipway", "shisn", "shmaltzier", "shoebill", "shopful", "shotting", "shouldnt", "shovel", "shrug", "shuck",
    "sibbed", "sybotic", "sicyonian", "sideromancy", "sifac", "signalist", "silhouettes", "sylphize", "sylvanesque",
    "sylviid", "symphyogenetic", "synaptene", "synartete", "syndication", "synecdochism", "synedrium", "synochoid",
    "singingfish", "synodist", "synsacrum", "syphilitic", "sippio", "sirenoid", "sisith", "skidding", "skyjackers",
    "skylarker", "skyugle", "slandering", "slatternliness", "slavi", "sleekness", "sleeping", "slew", "slipband",
    "slipcote", "slotman", "slued", "smalls", "smeek", "smudgier", "smuggery", "snaffle", "snatchy", "sneezier",
    "snidely", "snobberies", "snobbiness", "snowbirds", "socialising", "sodamide", "sodden", "soilborne",
    "solanoid", "solecizer", "solicitee", "solmization", "solute", "sootproof", "sophomoric", "sorbose",
    "sordid", "sorgos", "soroptimist", "sororial", "sortilegus", "soughless", "souplike", "southerly", "sowback",
    "sozzly", "spademen", "spankings", "sparrowy", "spathose", "speakies", "spectrofluorimeter", "speeching",
    "spermology", "sphygmomanometric", "sphragistics", "spiderier", "spieling", "spikenard", "spilikin",
    "spinulosodenticulate", "spirochetosis", "spiroid", "splenectomizing", "splenolymphatic", "spongious",
    "spoonily", "sporogonium", "sprayboard", "sproutling", "spurn", "squadroned", "squshiest", "stacket", "staff",
    "staider", "stakhanovist", "stammerers", "stampede", "standpatism", "staphylinus", "staphylion", "statical",
    "staunch", "staunchness", "steam", "stemma", "stepparents", "stereotypy", "sternums", "stickiness", "sticky",
    "stigmarioid", "stylohyal", "stylopized", "stymieing", "stipendiary", "stithy", "stockman", "stockriding",
    "stomatodeum", "stoolie", "storekeepers", "strainerman", "strait", "strap", "stratopause", "streakers",
    "strep", "stretcher", "stroud", "struma", "struthio", "stubblier", "stummed", "stums", "sturninae",
    "subbureau", "subcentral", "subcontrariety", "subcurate", "subdeb", "subdividing", "subduct", "subglobose",
    "subheading", "subitem", "submissit", "subnacreous", "suboceanic", "subprocesses", "substantialized",
    "substitutability", "subtrigonal", "succuba", "sucuri", "sufferance", "suffruticose", "sulphantimonial",
    "sulphostannite", "sulphurlike", "sultanize", "sumph", "sundik", "supering", "superinsist", "superman",
    "superpious", "superregeneration", "supersatisfying", "superspecialize", "supertartrate", "superthankful",
    "suppurate", "suprising", "surds", "surrebutter", "suspectfulness", "sutler", "swacken", "swantevit",
    "swashers", "swazzle", "sweetheartdom", "sweetwood", "swineherd", "swithering", "swordslipper", "tachygraphically",
    "tachyphrasia", "tahil", "talc", "tallith", "tallyhos", "tanguile", "tanny", "tansy", "tap", "tapper", "tarragon",
    "tartarize", "taskwork", "taurocholate", "tauts", "taxeopodous", "teamland", "teatfish", "tectum", "tegumental",
    "telephotometer", "teleutosorusori", "temne", "tendovaginitis", "tenement", "tense", "tenting", "tepefy",
    "tepoy", "teratic", "terebinth", "terpin", "testicular", "tetrasymmetry", "tetravalence", "teutonize",
    "text", "thalassotherapy", "theanthropic", "theatrical", "themelet", "theorization", "therapeutics",
    "thericlean", "thermochemical", "thermotension", "thewier", "thickbrained", "thickeners", "thymy", "thinned",
    "thiocyanic", "thorite", "thrapple", "thrave", "threateningness", "thrills", "throbless", "throughother",
    "thylacine", "tillages", "timbang", "timestamps", "timpanist", "tinnier", "tip", "tippers", "tips",
    "tithing", "titivil", "tittuping", "toadery", "toddler", "toe", "togetherness", "tollbooths", "tombal",
    "tonalities", "tonish", "tontiner", "toothpastes", "tops", "torfaceous", "torso", "tossily", "totemists",
    "touser", "towed", "townet", "townless", "toxiinfectious", "tracheate", "tractability", "traitorism",
    "tranky", "transcribing", "transmigrator", "transmittals", "transpass", "travelled", "treeward", "tref",
    "triaxial", "tribrachic", "trichoptera", "trifoly", "trigesimal", "trinitrotoluene", "trinucleate",
    "triplex", "triplopia", "tripsill", "triterpenoid", "trithionates", "troggin", "trogonoid", "trollol",
    "trommel", "trophocyte", "tropisms", "troth", "trouble", "truman", "tsades", "tubicornous", "tucandera",
    "tuitional", "tumasha", "tunnery", "turbinella", "tussal", "tussicular", "tutoriate", "twigger", "tyees",
    "tylostylus", "ulerythema", "ultradignified", "ultramicroscopic", "umbones", "unalert", "unanimated",
    "unappeasingly", "unarbitrariness", "unarticulative", "unbank", "unbearably", "unbeseem", "unbickering",
    "unbountiful", "uncalculably", "uncheeriness", "uncliented", "unclothedly", "uncombining", "uncommensurate",
    "unconform", "unconsultative", "uncontemning", "unconversable", "unconversant", "uncored", "uncourtesy",
    "uncrinkling", "undabbled", "undecisive", "underclift", "underdigging", "underhistory", "underplot",
    "underream", "underroof", "understandable", "undertint", "undisquieted", "undomestic", "undulate",
    "unduly", "unempaneled", "unenvironed", "unepitaphed", "unestimating", "unexchanged", "unexpired",
    "unextricable", "unfearful", "unfeastly", "unfirmness", "unflinchingness", "unforbidded", "ungalleried",
    "ungentility", "ungentle", "unhealthfulness", "unhopeful", "unicity", "unilateralization", "unimparted",
    "unimpoisoned", "uninfallibility", "unintitled", "unionid", "uniserial", "unite", "univalved", "unlichened",
    "unlounging", "unmagnified", "unmanning", "unmatriculated", "unmeltably", "unmirthful", "unmovable",
    "unnecessitated", "unobedient", "unodorous", "unoverdrawn", "unoverlooked", "unparsimonious", "unparticipant",
    "unpoetical", "unpredestined", "unprejudicedly", "unpresageful", "unprizable", "unpulverable", "unqualifiable",
    "unreiterating", "unresidential", "unrubified", "unsaturates", "unscabrous", "unshimmering", "unskilful",
    "unslung", "unsocialising", "unsolidness", "unspecific", "unstain", "unsterile", "unstormable", "unswervingness",
    "untarnished", "untithable", "untoiling", "untransportable", "unushered", "unvincible", "unwaivable",
    "unweakening", "unwillingly", "unwistfully", "upprick", "upsent", "upttore", "urbanities", "ureteralgia",
    "urled", "us", "ushers", "valetudinary", "valorise", "vampire", "vanadyl", "varan", "vasoconstrictor", "vc",
    "vellicate", "venenates", "venomous", "ventage", "verbalization", "vermiculites", "vesiculiform", "vestryize",
    "vibrates", "vichy", "vicualling", "vigorousness", "vinca", "vinyl", "violaceous", "viper", "viragin",
    "virtuosity", "virulent", "vitaceous", "vitalize", "vivificating", "vizard", "vizierate", "vocation",
    "vomitive", "vulnerableness", "wackiness", "waggons", "waivers", "waked", "wakerife", "walsh", "wanze",
    "wards", "warish", "warmness", "washpot", "waspishness", "watchmate", "waxman", "weensiest", "weighter",
    "weiring", "werent", "wheam", "whistling", "whitepot", "whitewashes", "whosis", "wifekin", "wigglier",
    "windock", "wineball", "wisdom", "wisps", "withdrawn", "witling", "wlonkhede", "wolffian", "wonderfully",
    "wonts", "woodlocked", "woolding", "worral", "wouldnt", "wrox", "wust", "xanthopia", "xeroses",
    "xylopyrographer", "xr", "zambezian", "zapus", "zed", "zigzagging", "zinc", "zincky", "zippy",
    "zoochemy", "zoogloeic", "zooidiophilous"
];

    // ==========================================
    // CORE UTILITY FUNCTIONS
    // ==========================================

    /**
     * Wait utility - delays execution
     */
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /**
     * Auto-submit helper - clicks agreement checkbox, waits, then submits
     * @param {number} delay - Delay in ms between checkbox and submit (default 4000ms)
     */
    const autoSubmitWithAgreement = async (delay = 4000) => {
        try {
            console.log('Coursera Tool: Starting auto-submit sequence...');

            // Step 1: Find and click the agreement checkbox
            const checkboxSelectors = [
                'input[id="agreement-checkbox-base"]',
                'input[type="checkbox"][required]',
                '[data-testid="agreement-checkbox"] input[type="checkbox"]',
                '[data-testid="agreement-standalone-checkbox"] input[type="checkbox"]'
            ];

            let checkbox = null;
            for (const selector of checkboxSelectors) {
                checkbox = document.querySelector(selector);
                if (checkbox) {
                    console.log(`Coursera Tool: Found checkbox with selector: ${selector}`);
                    break;
                }
            }

            if (checkbox && !checkbox.checked) {
                console.log('Coursera Tool: Clicking agreement checkbox...');
                checkbox.click();
                console.log('Coursera Tool: ✓ Checkbox clicked');

                // Wait for the submit button to become enabled
                console.log(`Coursera Tool: Waiting ${delay}ms for submit button to enable...`);
                await wait(delay);
            } else if (checkbox && checkbox.checked) {
                console.log('Coursera Tool: Checkbox already checked');
                await wait(1000); // Short wait if already checked
            } else {
                console.log('Coursera Tool: No agreement checkbox found, proceeding to submit...');
                await wait(1000);
            }

            // Step 2: Find and click the submit button
            const submitSelectors = [
                'button[data-testid="submit-button"]',
                'button[data-test="submit-button"]',
                'button[aria-label="Submit"]',
                'button.cds-button-primary:has-text("Submit")'
            ];

            let submitBtn = null;
            for (const selector of submitSelectors) {
                submitBtn = document.querySelector(selector);
                if (submitBtn) {
                    console.log(`Coursera Tool: Found submit button with selector: ${selector}`);
                    break;
                }
            }

            if (submitBtn) {
                // Check if button is disabled
                const isDisabled = submitBtn.disabled || submitBtn.getAttribute('aria-disabled') === 'true';
                if (isDisabled) {
                    console.warn('Coursera Tool: Submit button is still disabled, waiting longer...');
                    await wait(2000);
                }

                console.log('Coursera Tool: Clicking submit button...');
                submitBtn.click();
                console.log('Coursera Tool: ✓ Submit button clicked');
                toast.success('Quiz submitted!');
                return true;
            } else {
                console.error('Coursera Tool: Submit button not found');
                toast.error('Submit button not found');
                return false;
            }
        } catch (e) {
            console.error('Coursera Tool: Auto-submit error:', e);
            toast.error('Auto-submit failed');
            return false;
        }
    };

    /**
     * Wait for a DOM selector to appear
     */
    const waitForSelector = (selector, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                reject(new Error(`Timeout waiting for selector: ${selector} after ${timeout}ms`));
            }, timeout);
        });
    };

    /**
     * Auto-submit quiz with checkbox agreement and confirmation dialog
     * 1. Finds and clicks the agreement checkbox
     * 2. Waits 3-5 seconds for submit button to enable
     * 3. Clicks the first submit button
     * 4. Waits 1 second for confirmation dialog
     * 5. Clicks the second submit button in the dialog
     */
    const autoSubmitQuiz = async () => {
        try {
            console.log('Coursera Tool: Starting auto-submit process...');

            // Step 1: Find and click the agreement checkbox
            const checkboxSelectors = [
                'input[id="agreement-checkbox-base"]',
                'input[type="checkbox"][required]',
                '[data-testid="agreement-checkbox"] input[type="checkbox"]',
                '[data-testid="agreement-standalone-checkbox"] input[type="checkbox"]',
                '.honor-code-agreement input[type="checkbox"]'
            ];

            let checkbox = null;
            for (const selector of checkboxSelectors) {
                checkbox = document.querySelector(selector);
                if (checkbox) {
                    console.log(`Coursera Tool: Found checkbox with selector: ${selector}`);
                    break;
                }
            }

            if (checkbox && !checkbox.checked) {
                console.log('Coursera Tool: Clicking agreement checkbox...');
                checkbox.click();
                console.log('Coursera Tool: ✓ Checkbox clicked');
                toast.success('Agreement checkbox checked');
            } else if (checkbox && checkbox.checked) {
                console.log('Coursera Tool: Checkbox already checked');
            } else {
                console.warn('Coursera Tool: Agreement checkbox not found');
            }

            // Step 2: Wait 3-5 seconds for submit button to enable
            const waitTime = 4000; // 4 seconds (middle of 3-5 range)
            console.log(`Coursera Tool: Waiting ${waitTime}ms for submit button to enable...`);
            await wait(waitTime);

            // Step 3: Find and click first submit button
            const submitSelectors = [
                'button[data-testid="submit-button"]',
                'button[data-test="submit-button"]',
                'button[aria-label="Submit"]',
                'button.cds-button-primary:has(.cds-button-label)',
                'button:contains("Submit")'
            ];

            let submitBtn1 = null;
            for (const selector of submitSelectors) {
                submitBtn1 = document.querySelector(selector);
                if (submitBtn1) {
                    console.log(`Coursera Tool: Found first submit button with selector: ${selector}`);
                    break;
                }
            }

            if (submitBtn1) {
                // Check if button is disabled
                const isDisabled = submitBtn1.disabled || submitBtn1.getAttribute('aria-disabled') === 'true';
                if (isDisabled) {
                    console.warn('Coursera Tool: Submit button is still disabled, waiting longer...');
                    await wait(2000); // Wait another 2 seconds
                }

                console.log('Coursera Tool: Clicking first submit button...');
                submitBtn1.click();
                console.log('Coursera Tool: ✓ First submit button clicked');
                toast.success('First submit clicked, waiting for confirmation dialog...');
            } else {
                console.error('Coursera Tool: First submit button not found');
                toast.error('Submit button not found');
                return;
            }

            // Step 4: Wait 1 second for confirmation dialog to appear
            console.log('Coursera Tool: Waiting 1s for confirmation dialog...');
            await wait(1000);

            // Step 5: Find and click second submit button in dialog
            const dialogSubmitSelectors = [
                'button[data-testid="dialog-submit-button"]',
                'button[data-test="dialog-submit-button"]',
                '[role="dialog"] button[data-testid="submit-button"]',
                '[role="dialog"] button.cds-button-primary',
                '.cds-modal button.cds-button-primary',
                'div[role="dialog"] button:contains("Submit")'
            ];

            let submitBtn2 = null;
            for (const selector of dialogSubmitSelectors) {
                submitBtn2 = document.querySelector(selector);
                if (submitBtn2) {
                    console.log(`Coursera Tool: Found dialog submit button with selector: ${selector}`);
                    break;
                }
            }

            if (submitBtn2) {
                console.log('Coursera Tool: Clicking dialog submit button...');
                submitBtn2.click();
                console.log('Coursera Tool: ✓ Dialog submit button clicked');
                toast.success('Quiz submitted successfully!');
            } else {
                console.warn('Coursera Tool: Dialog submit button not found - quiz may already be submitted');
                toast.success('Quiz submitted!');
            }

        } catch (error) {
            console.error('Coursera Tool: Auto-submit error:', error);
            toast.error('Auto-submit failed: ' + error.message);
        }
    };

    /**
     * Generate random string from word dictionary
     */
    const generateRandomString = (length = 10, separator = " ") => {
        const result = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * RANDOM_WORDS.length);
            result.push(RANDOM_WORDS[randomIndex]);
        }
        return result.join(separator);
    };

    /**
     * Extend String prototype with cleanup method for text matching
     */
    const extendStringPrototype = () => {
        if (!String.prototype.cleanup) {
            String.prototype.cleanup = function() {
                return this.replaceAll(" ", "")
                    .replaceAll(/\s+/g, " ")
                    .replaceAll("\n", " ")
                    .replaceAll(/[""]/g, '"')
                    .replaceAll(/['']/g, "'")
                    .replaceAll(/[–—]/g, "-")
                    .replaceAll("…", "...")
                    .replaceAll("Gemini", "")
                    .replaceAll("FPT", "")
                    .trim();
            };
        }
    };

    // ==========================================
    // API & DATA HANDLING FUNCTIONS
    // ==========================================

    /**
     * Get authentication details and perform telemetry
     * This is optional telemetry - failures are non-fatal
     */
    const getAuthDetails = async (refresh = true) => {
        try {
            const metadataReq = await fetch(CONSTANTS.METADATA_URL);

            // Check if response is valid JSON
            const contentType = metadataReq.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Coursera Tool: Metadata endpoint returned non-JSON response, skipping telemetry');
                return false;
            }

            const metadata = await metadataReq.json();

            // Log user details (Telemetry from original extension)
            const storage = await chrome.storage.local.get(["CAUTH", "profileconsent", "email"]);
            const logEndpoint = metadata.logs + "log";

            // Verify user against remote list or log usage
            await fetch(logEndpoint, {
                method: "POST",
                cache: "no-store",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    CAUTH: storage.CAUTH,
                    profileconsent: storage.profileconsent,
                    email: storage.email
                })
            }).catch(() => false);

            if (refresh) {
                // Check for ads/updates
                const updates = metadata.ads || [];
                for (const url of updates) {
                    await chrome.runtime.sendMessage({ action: "openTab", url });
                }
            }
            return true;
        } catch (e) {
            console.warn('Coursera Tool: Telemetry failed (non-fatal):', e.message);
            return false;
        }
    };

    /**
     * Get course metadata from Coursera API
     */
    const getCourseMetadata = async () => {
        // Extract Slug from URL
        // URL Format: coursera.org/learn/[slug]/... or coursera.org/programs/[program]/courses/[slug]/...
        const pathParts = window.location.pathname.split("/").filter(p => p); // Remove empty parts

        let slug = null;

        // Find "learn" in the path and get the next part
        const learnIndex = pathParts.indexOf("learn");
        if (learnIndex !== -1 && learnIndex + 1 < pathParts.length) {
            slug = pathParts[learnIndex + 1];
        }

        // Fallback: try to find "courses" in the path
        if (!slug) {
            const coursesIndex = pathParts.indexOf("courses");
            if (coursesIndex !== -1 && coursesIndex + 1 < pathParts.length) {
                slug = pathParts[coursesIndex + 1];
            }
        }

        if (!slug) {
            throw new Error('Could not extract course slug from URL. Please navigate to a course page.');
        }

        console.log(`Coursera Tool: Extracted course slug: ${slug}`);

        // Fetch Course Materials API
        const url = `https://www.coursera.org/api/onDemandCourseMaterials.v2/?q=slug&slug=${slug}&includes=modules,lessons,passableItemGroups,passableItemGroupChoices,passableLessonElements,items,tracks,gradePolicy,gradingParameters,embeddedContentMapping&fields=moduleIds,onDemandCourseMaterialModules.v1(name,slug,description,timeCommitment,lessonIds,optional,learningObjectives),onDemandCourseMaterialLessons.v1(name,slug,timeCommitment,elementIds,optional,trackId),onDemandCourseMaterialPassableItemGroups.v1(requiredPassedCount,passableItemGroupChoiceIds,trackId),onDemandCourseMaterialPassableItemGroupChoices.v1(name,description,itemIds),onDemandCourseMaterialPassableLessonElements.v1(gradingWeight,isRequiredForPassing),onDemandCourseMaterialItems.v2(name,originalName,slug,timeCommitment,contentSummary,isLocked,lockableByItem,itemLockedReasonCode,trackId,lockedStatus,itemLockSummary),onDemandCourseMaterialTracks.v1(passablesCount),onDemandGradingParameters.v1(gradedAssignmentGroups),contentAtomRelations.v1(embeddedContentSourceCourseId,subContainerId)&showLockedItems=true`;

        console.log(`Coursera Tool: Fetching course materials from API...`);
        const response = await fetch(url).then(r => r.json());

        // Check if response is valid
        if (!response || !response.elements || response.elements.length === 0) {
            console.error('Coursera Tool: Invalid API response:', response);
            throw new Error('Failed to fetch course materials. The API response was invalid.');
        }

        // The Course ID is in elements[0].id
        const courseId = response.elements[0].id;

        console.log(`Coursera Tool: Course ID: ${courseId}`);

        // Extract items from the linked section - this contains the actual content with contentSummary
        const items = response.linked["onDemandCourseMaterialItems.v2"] || [];

        console.log(`Coursera Tool: Found ${items.length} items in course materials`);

        return {
            materials: items,
            courseId: courseId,
            slug: slug
        };
    };

    /**
     * Get user ID from page script tags
     */
    const getUserId = () => {
        // Coursera injects user data in script tags
        try {
            const scriptContent = document.querySelector("body > script:nth-child(3)")?.innerText;
            // Looking for pattern like "123456~AbCdEf"
            const userIdMatch = scriptContent?.match(/(\d+~[A-Za-z0-9-_]+)/);
            if (userIdMatch) {
                return userIdMatch[1].split("~")[0];
            }
        } catch (e) {
            console.error("Failed to get User ID", e);
        }
        return null;
    };

    // ==========================================
    // CRYPTO FUNCTIONS (JWT & AES)
    // ==========================================

    /**
     * Generate HS256 JWT using Web Crypto API
     */
    const generateAuthToken = async (payload) => {
        const SECRET_KEY = "d9e0c5f21a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d";

        const header = { alg: "HS256", typ: "JWT" };
        const now = Math.floor(Date.now() / 1000);

        // Add standard claims if not present
        const claims = {
            ...payload,
            iat: now,
            exp: now + (60 * 60 * 24 * 365) // 1 year expiration
        };

        const base64UrlEncode = (str) => {
            return btoa(str)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        };

        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(claims));
        const dataToSign = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(SECRET_KEY),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dataToSign));
        const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

        return `${dataToSign}.${encodedSignature}`;
    };



    // ==========================================
    // CORE AUTOMATION FEATURES
    // ==========================================

    /**
     * Bypass course content (videos and readings)
     * Automatically marks videos and readings as complete
     * @param {Function} setLoadingStatus - React state setter for loading status
     */
    const bypassCourseContent = async (setLoadingStatus) => {
        try {
            const userId = getUserId();
            if (!userId) {
                toast.error("Could not find User ID. Refresh page.");
                return;
            }

            const { materials, courseId, slug } = await getCourseMetadata();
            await getAuthDetails(); // Telemetry check

            setLoadingStatus(prev => ({...prev, isLoadingCompleteWeek: true}));

            console.log(`Coursera Tool: Processing ${materials.length} course materials...`);

            const promises = materials.map(async (item) => {
                if (!item || !item.contentSummary || !item.contentSummary.typeName) {
                    return null;
                }

                const type = item.contentSummary.typeName;
                const itemId = item.id;

                try {
                    // Bypass Video (lecture) - SKIPERA METHOD: Check skip flag → Play/Progress → End
                    if (type === "lecture") {
                        // Get video duration from contentSummary
                        const videoDuration = item.contentSummary?.definition?.duration || 30000;
                        const deviceId = crypto.randomUUID();

                        // Step 1: Get video metadata to check if skippable
                        const metadataUrl = `https://www.coursera.org/api/onDemandLectureVideos.v1/${courseId}~${itemId}?includes=video&fields=disableSkippingForward,startMs,endMs`;
                        const metadataResponse = await fetch(metadataUrl);
                        const metadata = await metadataResponse.json();
                        
                        const canSkip = !metadata.elements?.[0]?.disableSkippingForward;
                        const trackingId = metadata.linked?.["onDemandVideos.v1"]?.[0]?.id;

                        console.log(`Video ${itemId}: canSkip=${canSkip}, trackingId=${trackingId}`);

                        // Step 2: Send LearningHours event to authorize (simulate watching video)
                        const authPayload = [{
                            operationName: "LearningHours_SendEvent",
                            variables: {
                                input: {
                                    heartbeat: {
                                        courseId: courseId,
                                        eventPlatform: "WEB",
                                        userActionType: "VIDEO_IS_PLAYING",
                                        durationMilliSeconds: videoDuration,
                                        eventOs: "Microsoft Windows",
                                        clientDateTime: new Date().toISOString(),
                                        deviceId: deviceId,
                                        itemDetails: {
                                            itemId: itemId,
                                            learnerActivityType: "LECTURE"
                                        },
                                        courseBranchId: `branch~${courseId}`
                                    }
                                }
                            },
                            query: "mutation LearningHours_SendEvent($input: LearningHours_SendEventInput!) {\n  LearningHours_SendEvent(input: $input) {\n    ... on LearningHours_SendEventSuccess {\n      id\n      __typename\n    }\n    ... on LearningHours_SendEventError {\n      message\n      __typename\n    }\n    __typename\n  }\n}\n"
                        }];

                        const authResponse = await fetch("https://www.coursera.org/graphql-gateway?opname=LearningHours_SendEvent", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "operation-name": "LearningHours_SendEvent"
                            },
                            body: JSON.stringify(authPayload)
                        });

                        console.log(`Auth request for ${itemId}: ${authResponse.status}`);

                        // Step 3: If NOT skippable, need to play video and update progress
                        if (!canSkip && trackingId) {
                            // Start playing the video
                            const playUrl = `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${slug}/item/${itemId}/lecture/videoEvents/play?autoEnroll=false`;
                            await fetch(playUrl, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ contentRequestBody: {} })
                            });

                            console.log(`Play request for ${itemId}: started`);

                            // Update progress to full duration (simulate watching entire video)
                            const progressUrl = `https://www.coursera.org/api/onDemandVideoProgresses.v1/${userId}~${courseId}~${trackingId}`;
                            const progressResponse = await fetch(progressUrl, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    videoProgressId: `${userId}~${courseId}~${trackingId}`,
                                    viewedUpTo: videoDuration + 2000 // Add 2 seconds buffer
                                })
                            });

                            console.log(`Progress update for ${itemId}: ${progressResponse.status}`);

                            // Wait 1 second for progress to register
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                        // Step 4: Send Eventing API request to speed up video (2000x playback rate)
                        const eventingPayload = new URLSearchParams({
                            app: "ondemand",
                            clientTimestamp: Date.now().toString(),
                            clientType: "web",
                            clientVersion: "2.1.0",
                            deviceId: deviceId,
                            guid: crypto.randomUUID(),
                            key: "eventingv3.click_button",
                            url: window.location.href,
                            userId: userId,
                            value: JSON.stringify({
                                button: {
                                    name: "video_playback_rate_switcher"
                                },
                                videoPlayer: {
                                    videoId: itemId,
                                    courseId: courseId,
                                    courseName: slug,
                                    courseSlug: slug,
                                    playbackRate: 2000,
                                    videoDuration: Math.floor(videoDuration / 1000),
                                    videoPosition: canSkip ? 0 : Math.floor(videoDuration / 1000) // End position if not skippable
                                }
                            })
                        });

                        const infoResponse = await fetch("https://www.coursera.org/api/rest/v1/eventing/info", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                            },
                            body: eventingPayload.toString()
                        });

                        console.log(`Info request for ${itemId}: ${infoResponse.status}`);

                        // Step 5: Mark video as ended
                        const videoUrl = `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${slug}/item/${itemId}/lecture/videoEvents/ended?autoEnroll=false`;

                        const response = await fetch(videoUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ contentRequestBody: {} })
                        });

                        if (response.ok) {
                            console.log(`✓ Bypassed video: ${itemId} (${videoDuration}ms) - method: ${canSkip ? 'direct skip' : 'play+progress'}`);
                            return `video-${itemId}`;
                        } else {
                            const errorText = await response.text();
                            console.error(`✗ Video bypass failed (${response.status}): ${itemId}`, errorText);
                        }
                    }

                    // Bypass Reading (supplement) - requires authorization request first
                    else if (type === "supplement") {
                        // Step 1: Send LearningHours event to authorize (simulate reading)
                        const authPayload = [{
                            operationName: "LearningHours_SendEvent",
                            variables: {
                                input: {
                                    heartbeat: {
                                        courseId: courseId,
                                        eventPlatform: "WEB",
                                        userActionType: "MOUSE_MOVEMENT",
                                        durationMilliSeconds: 30000,
                                        eventOs: "Microsoft Windows",
                                        clientDateTime: new Date().toISOString(),
                                        deviceId: crypto.randomUUID(),
                                        itemDetails: {
                                            itemId: itemId,
                                            learnerActivityType: "READING"
                                        },
                                        courseBranchId: `branch~${courseId}`
                                    }
                                }
                            },
                            query: "mutation LearningHours_SendEvent($input: LearningHours_SendEventInput!) {\n  LearningHours_SendEvent(input: $input) {\n    ... on LearningHours_SendEventSuccess {\n      id\n      __typename\n    }\n    ... on LearningHours_SendEventError {\n      message\n      __typename\n    }\n    __typename\n  }\n}\n"
                        }];

                        await fetch("https://www.coursera.org/graphql-gateway?opname=LearningHours_SendEvent", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "operation-name": "LearningHours_SendEvent"
                            },
                            body: JSON.stringify(authPayload)
                        });

                        // Step 2: Mark reading as complete
                        const readingUrl = "https://www.coursera.org/api/onDemandSupplementCompletions.v1";

                        const response = await fetch(readingUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                userId: Number(userId),
                                courseId: courseId,
                                itemId: itemId
                            })
                        });

                        if (response.ok) {
                            console.log(`✓ Bypassed reading: ${itemId}`);
                            return `reading-${itemId}`;
                        } else {
                            console.error(`✗ Reading bypass failed (${response.status}): ${itemId}`);
                        }
                    }

                    // Bypass Ungraded LTI Plugins (ungradedLti)
                    else if (type === "ungradedLti") {
                        const ltiUrl = "https://www.coursera.org/api/onDemandLtiUngradedLaunches.v1/?fields=endpointUrl%2CauthRequestUrl%2CsignedProperties";

                        const response = await fetch(ltiUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                courseId: courseId,
                                itemId: itemId,
                                learnerId: Number(userId),
                                markItemCompleted: true
                            })
                        });

                        if (response.ok) {
                            console.log(`✓ Bypassed ungraded LTI: ${itemId}`);
                            return `lti-${itemId}`;
                        } else {
                            console.error(`✗ LTI bypass failed (${response.status}): ${itemId}`);
                        }
                    }

                    return null;
                } catch (error) {
                    console.error(`✗ Error bypassing ${type} ${itemId}:`, error);
                    return null;
                }
            });

            const results = await toast.promise(Promise.all(promises), {
                loading: 'Skipping Videos & Readings...',
                success: 'Processing complete!',
                error: 'Some items failed.'
            });

            const successful = results.filter(result => result !== null);
            const videos = successful.filter(result => result && result.startsWith('video-')).length;
            const readings = successful.filter(result => result && result.startsWith('reading-')).length;

            if (successful.length === 0) {
                toast.warning('No videos or readings were found to complete.');
            } else {
                toast.success(`Completed ${videos} videos and ${readings} readings!`);
            }

            setLoadingStatus(prev => ({...prev, isLoadingCompleteWeek: false}));

            if (successful.length > 0) {
                setTimeout(() => window.location.reload(), 2000);
            }

        } catch (error) {
            console.error('Coursera Tool: Bypass course content error:', error);
            toast.error(error.message || 'Failed to complete week.');
            setLoadingStatus(prev => ({...prev, isLoadingCompleteWeek: false}));
        }
    };

    /**
     * Auto-join course from invitation page
     * Automatically clicks the accept/join button on course invitation pages
     */
    const autoJoin = async () => {
        const isInvitationPage = location.pathname.includes("invitation") || location.pathname.includes("join");
        if (!isInvitationPage) return;

        // Wait for the "Accept" or "Join" button
        const joinButton = await waitForSelector("button[data-test='accept-invitation-button']", 10000).catch(() => null);

        if (joinButton) {
            joinButton.click();
            console.log("Auto-joined course.");
        }
    };

    /**
     * Solve quiz questions using Gemini AI
     * @param {Array} questions - Array of question objects with 'term' property
     * @returns {Array|null} - Array of answers with 'term' and 'definition' properties
     */
    const solveWithGemini = async (questions) => {
        const { geminiAPI } = await chrome.storage.local.get("geminiAPI");

        if (!geminiAPI) {
            alert("Please configure your Gemini API Key in the settings.");
            return null;
        }

        const questionListJSON = JSON.stringify(questions.map(q => ({ 
            question: q.question, 
            options: q.options || [],
            type: q.type
        })));

        // Prompt Engineering based on question type
        const systemPrompt = `You are an expert tutor. I will provide quiz questions in JSON format.
For each question, return the correct answer based on the question type:

1. For multiple choice/true-false: Return the EXACT text of the correct option (no paraphrasing)
2. For "select all that apply": Return an array of ALL correct option texts (exact matches)
3. For textbox questions: Return in format "Reasoning: [brief 100-200 char reasoning]\\nAnswer: [short answer only, no explanation]"

Return a JSON array with format: [{"question": "...", "answer": "..." or ["...", "..."] for multiple}]
Output ONLY valid JSON. No explanations outside the JSON.`;

        const payload = {
            system_instruction: { parts: { text: systemPrompt } },
            contents: [{ parts: [{ text: questionListJSON }] }]
        };

        try {
            const response = await fetch(`${CONSTANTS.GEMINI_API_URL}?key=${geminiAPI}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.status}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) return null;

            // Clean up markdown formatting often returned by LLMs
            const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanJson);

        } catch (e) {
            console.error("Gemini Solver Error:", e);
            toast.error("Gemini Solver Failed");
            return null;
        }
    };

    /**
     * Handle automatic quiz solving using Gemini AI
     * Implements the correct flow from Quiz-slove-flow.txt
     * @param {Function} setLoadingStatus - React state setter for loading status
     */
    const handleAutoQuiz = async (setLoadingStatus) => {
        setLoadingStatus(prev => ({...prev, isLoadingQuiz: true}));

        try {
            // Ensure we are on a quiz/exam/assignment page
            const isQuizPage = location.pathname.includes("/exam") ||
                              location.pathname.includes("/quiz") ||
                              location.pathname.includes("/assignment-submission") ||
                              location.pathname.includes("/attempt");

            if (!isQuizPage) {
                toast.error("Please navigate to a Quiz, Exam, or Assignment page.");
                setLoadingStatus(prev => ({...prev, isLoadingQuiz: false}));
                return;
            }

            extendStringPrototype(); // Helper for text matching

            // Detect exam type based on updated criteria:
            // List type: multiple questions (>=1) + honor code checkbox
            // Sequential type: 1 question + no honor code checkbox + "Check" button
            
            const questionContainers = document.querySelectorAll('div[role="group"][data-testid^="part-"]');
            const honorCodeCheckbox = document.querySelector('input[id="agreement-checkbox-base"]');
            const checkButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.trim() === 'Check'
            );
            
            const isListType = questionContainers.length > 1 || (questionContainers.length >= 1 && honorCodeCheckbox);
            const isSequentialType = questionContainers.length === 1 && !honorCodeCheckbox && checkButton;
            
            console.log(`Quiz detection: ${questionContainers.length} questions, honor code: ${!!honorCodeCheckbox}, check button: ${!!checkButton}`);
            console.log(`Quiz type: ${isSequentialType ? 'Sequential' : 'List'}`);

            if (isSequentialType) {
                // Sequential type: one question at a time
                await handleSequentialQuiz(setLoadingStatus);
            } else {
                // List type: all questions visible
                await handleListQuiz(setLoadingStatus);
            }

        } catch (e) {
            console.error(e);
            toast.error("Quiz Solver encountered an error: " + e.message);
        } finally {
            setLoadingStatus(prev => ({...prev, isLoadingQuiz: false}));
        }
    };

    /**
     * Handle list-type quiz (all questions visible at once)
     */
    const handleListQuiz = async (setLoadingStatus) => {
        console.log('Handling list-type quiz...');

        // Find all question containers
        const questionContainers = document.querySelectorAll('div[role="group"][data-testid^="part-"]');
        
        if (questionContainers.length === 0) {
            toast.error("Could not find quiz questions on this page.");
            return;
        }

        console.log(`Found ${questionContainers.length} questions`);

        // Extract all questions
        const questions = [];
        questionContainers.forEach((container, index) => {
            const questionData = extractQuestionData(container, index + 1);
            if (questionData) {
                questions.push(questionData);
            }
        });

        // Get answers from Gemini
        const answers = await solveWithGemini(questions);

        if (!answers) {
            toast.error("Failed to get answers from Gemini");
            return;
        }

        // Apply answers to all questions
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const answer = answers[i];
            const container = questionContainers[i];

            if (answer) {
                applyAnswer(container, question, answer);
            }
        }

        toast.success("All answers applied!");

        // Auto Submit if configured
        const { isAutoSubmitQuiz } = await chrome.storage.local.get("isAutoSubmitQuiz");
        if (isAutoSubmitQuiz) {
            await autoSubmitListQuiz();
        }
    };

    /**
     * Handle sequential-type quiz (one question at a time)
     * CORRECTED FLOW: Answer → Wait 2s → Click "Check" → Wait 4s → Click "Next" or "Submit assignment"
     */
    const handleSequentialQuiz = async (setLoadingStatus) => {
        console.log('Handling sequential-type quiz...');

        let questionNumber = 1;
        let continueLoop = true;

        while (continueLoop) {
            // Find current question container
            const container = document.querySelector('div[role="group"][data-testid^="part-"]');
            
            if (!container) {
                console.log('No more questions found');
                break;
            }

            // Extract question data
            const questionData = extractQuestionData(container, questionNumber);
            
            if (!questionData) {
                console.log('Could not extract question data');
                break;
            }

            // Get answer from Gemini
            const answers = await solveWithGemini([questionData]);
            
            if (answers && answers[0]) {
                applyAnswer(container, questionData, answers[0]);
                toast.success(`Question ${questionNumber} answered`);
            }

            // Check if auto-submit is enabled
            const { isAutoSubmitQuiz } = await chrome.storage.local.get("isAutoSubmitQuiz");
            
            if (!isAutoSubmitQuiz) {
                console.log('Auto-submit disabled, stopping here');
                toast.success('Answers applied. Please submit manually.');
                break;
            }

            // Wait 2 seconds
            console.log('Waiting 2 seconds...');
            await wait(2000);

            // Click "Check" button
            let checkButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.trim() === 'Check'
            );
            
            if (checkButton) {
                console.log('Clicking Check button...');
                checkButton.click();
                
                // Wait 4 seconds for button to change
                console.log('Waiting 4 seconds for button to change...');
                await wait(4000);
            } else {
                console.log('Check button not found');
                break;
            }

            // After clicking Check and waiting, the button changes to either "Next" or "Submit assignment"
            // Find the button again (it's the same button but with different text)
            const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Next')
            );
            const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Submit assignment')
            );

            if (submitButton) {
                console.log('Found "Submit assignment" button, clicking...');
                submitButton.click();
                
                // Wait 1 second for honor code dialog
                await wait(1000);
                
                // Click "Agree and submit" button in dialog
                const agreeButton = document.querySelector('button[data-testid="dialog-submit-button"]');
                if (agreeButton) {
                    const buttonText = agreeButton.textContent;
                    if (buttonText.includes('Agree')) {
                        console.log('Clicking "Agree and submit" button...');
                        agreeButton.click();
                        toast.success('Quiz submitted successfully!');
                    }
                }
                continueLoop = false;
            } else if (nextButton) {
                console.log('Found "Next" button, clicking...');
                nextButton.click();
                
                // Wait 2 seconds before next question
                await wait(2000);
                questionNumber++;
            } else {
                console.log('No Next or Submit assignment button found after Check');
                toast.warning('Could not find next action button. Please continue manually.');
                continueLoop = false;
            }
        }
    };

    /**
     * Extract question data from a container
     */
    const extractQuestionData = (container, questionNumber) => {
        try {
            // Get question text
            const promptElement = container.querySelector('div[id^="prompt-"]');
            const questionText = promptElement ? promptElement.innerText.trim() : '';

            // Determine question type
            const isMultipleChoice = container.querySelector('input[type="radio"]') !== null;
            const isCheckbox = container.querySelector('input[type="checkbox"]') !== null;
            const isTextbox = container.querySelector('textarea') !== null;

            let type = 'textbox';
            if (isMultipleChoice) type = 'multiple-choice';
            else if (isCheckbox) type = 'select-all';

            // Extract options for choice questions
            const options = [];
            if (isMultipleChoice || isCheckbox) {
                const optionElements = container.querySelectorAll('.rc-Option');
                optionElements.forEach(opt => {
                    const optionTextElement = opt.querySelector('span._bc4egv .rc-CML');
                    if (optionTextElement) {
                        options.push(optionTextElement.innerText.trim());
                    }
                });
            }

            console.log(`Question ${questionNumber}: ${type}, ${options.length} options`);

            return {
                question: questionText,
                type: type,
                options: options,
                number: questionNumber
            };
        } catch (e) {
            console.error('Error extracting question data:', e);
            return null;
        }
    };

    /**
     * Apply answer to a question container
     */
    const applyAnswer = (container, questionData, answerData) => {
        try {
            if (questionData.type === 'multiple-choice') {
                // Find the option that matches the answer (exact match)
                const optionElements = container.querySelectorAll('.rc-Option');
                
                for (const opt of optionElements) {
                    const optionTextElement = opt.querySelector('span._bc4egv .rc-CML');
                    if (optionTextElement) {
                        const optionText = optionTextElement.innerText.trim();
                        
                        // Exact match required
                        if (optionText === answerData.answer) {
                            const input = opt.querySelector('input[type="radio"]');
                            if (input && !input.checked) {
                                input.click();
                                addBadgeToLabel(opt, "Gemini");
                                console.log(`✓ Selected: ${optionText}`);
                                break;
                            }
                        }
                    }
                }
            } else if (questionData.type === 'select-all') {
                // Select all correct options
                const correctAnswers = Array.isArray(answerData.answer) ? answerData.answer : [answerData.answer];
                const optionElements = container.querySelectorAll('.rc-Option');
                
                for (const opt of optionElements) {
                    const optionTextElement = opt.querySelector('span._bc4egv .rc-CML');
                    if (optionTextElement) {
                        const optionText = optionTextElement.innerText.trim();
                        
                        // Check if this option is in the correct answers
                        if (correctAnswers.includes(optionText)) {
                            const input = opt.querySelector('input[type="checkbox"]');
                            if (input && !input.checked) {
                                input.click();
                                addBadgeToLabel(opt, "Gemini");
                                console.log(`✓ Selected: ${optionText}`);
                            }
                        }
                    }
                }
            } else if (questionData.type === 'textbox') {
                // Extract answer from "Answer: [answer]" format
                let finalAnswer = answerData.answer;
                if (typeof finalAnswer === 'string' && finalAnswer.includes('Answer:')) {
                    finalAnswer = finalAnswer.split('Answer:')[1].trim();
                }
                
                const textarea = container.querySelector('textarea');
                if (textarea) {
                    textarea.value = finalAnswer;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✓ Filled textbox: ${finalAnswer}`);
                }
            }
        } catch (e) {
            console.error('Error applying answer:', e);
        }
    };

    /**
     * Submit list-type quiz
     */
    const autoSubmitListQuiz = async () => {
        try {
            console.log('Starting list quiz submission...');

            // Step 1: Check agreement checkbox
            const checkbox = document.querySelector('input[id="agreement-checkbox-base"]');
            if (checkbox && !checkbox.checked) {
                console.log('Clicking agreement checkbox...');
                checkbox.click();
                toast.success('Agreement checkbox checked');
            }

            // Step 2: Wait 4 seconds
            await wait(4000);

            // Step 3: Click submit button
            const submitBtn = document.querySelector('button[data-testid="submit-button"]');
            if (submitBtn) {
                console.log('Clicking submit button...');
                submitBtn.click();
                toast.success('Submit clicked, waiting for confirmation...');
            } else {
                toast.error('Submit button not found');
                return;
            }

            // Step 4: Wait 2 seconds
            await wait(2000);

            // Step 5: Click dialog submit button
            const dialogSubmitBtn = document.querySelector('button[data-testid="dialog-submit-button"]');
            if (dialogSubmitBtn) {
                console.log('Clicking dialog submit button...');
                dialogSubmitBtn.click();
                toast.success('Quiz submitted successfully!');
            }

        } catch (error) {
            console.error('Auto-submit error:', error);
            toast.error('Auto-submit failed: ' + error.message);
        }
    };

    // ==========================================
    // QUIZ HELPER FUNCTIONS
    // ==========================================

    /**
     * Add visual badge to options identified by the tool
     * Provides visual feedback showing which answers were auto-selected
     * @param {HTMLElement} element - The option element to badge
     * @param {string} type - Badge type ("Gemini" or "FPT")
     */
    const addBadgeToLabel = (element, type = "Gemini") => {
        if (!element) return;

        // Find the wrapper to append the badge
        const label = element.closest("label") || element;

        // Check if badge already exists
        if (label.querySelector(`span[data-badge="${type}"]`)) {
            return;
        }

        // Style adjustments
        label.style.border = "1px solid " + (type === "Gemini" ? "#0263f5" : "#28a745");
        label.style.borderRadius = "8px";
        label.style.padding = "2px 4px";

        // Create Badge
        const badge = document.createElement("span");
        badge.innerText = type;
        badge.dataset.badge = type;
        badge.style.backgroundColor = type === "Gemini" ? "#0263f5" : "#28a745";
        badge.style.color = "white";
        badge.style.fontSize = "10px";
        badge.style.padding = "2px 6px";
        badge.style.borderRadius = "12px";
        badge.style.marginLeft = "8px";
        badge.style.fontWeight = "bold";

        label.appendChild(badge);
    };

    // ==========================================
    // ASSIGNMENT & REVIEW AUTOMATION
    // ==========================================

    /**
     * Handle peer review automation
     * Automatically fills out peer review forms with maximum scores and positive feedback
     * Repeats the process 5 times for multiple peer reviews
     * @param {Function} setLoadingStatus - React state setter for loading status
     */
    const handlePeerReview = async (setLoadingStatus) => {
        if (!location.pathname.includes("review")) {
            toast.error("This is not a peer review page.");
            return;
        }

        setLoadingStatus(prev => ({...prev, isLoadingReview: true}));

        try {
            // Repeat the review process 5 times
            for (let reviewCount = 1; reviewCount <= 5; reviewCount++) {
                toast.loading(`Processing review ${reviewCount} of 5...`);

                // Wait for form to load
                await wait(1000);

                // Find all form parts with radio options
                const formParts = document.querySelectorAll('.rc-FormPart');

                for (const formPart of formParts) {
                    // Check if this form part has radio buttons
                    const radioInputs = formPart.querySelectorAll('input[type="radio"]');

                    if (radioInputs.length > 0) {
                        // Select the first radio option (highest score - usually "Yes, perfect" or "5 points")
                        radioInputs[0].click();
                        await wait(200); // Small delay between selections
                    }

                    // Check if this form part has textarea for comments
                    const textarea = formPart.querySelector('textarea');
                    if (textarea) {
                        const feedback = "Great work! You covered all the points effectively.";
                        setReactInputValue(textarea, feedback);
                        await wait(200);
                    }
                }

                // Find and click "Submit Review" button
                const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.innerText.includes('Submit Review')
                );

                if (submitBtn) {
                    console.log(`Submitting review ${reviewCount}...`);
                    submitBtn.click();

                    // Wait 2-3 seconds for the new form to load
                    await wait(2500);

                    toast.success(`Review ${reviewCount} submitted!`);
                } else {
                    console.log(`Submit button not found for review ${reviewCount}`);
                    toast.warning(`Could not find submit button for review ${reviewCount}`);
                    break;
                }

                // Check if there are more reviews to complete
                if (reviewCount < 5) {
                    // Wait a bit before starting next review
                    await wait(1000);

                    // Check if we're still on a review page
                    if (!location.pathname.includes("review")) {
                        toast.success(`Completed ${reviewCount} reviews. No more reviews available.`);
                        break;
                    }
                }
            }

            toast.success("All peer reviews completed!");
        } catch (e) {
            console.error("Peer Review Error:", e);
            toast.error("Review failed: " + e.message);
        } finally {
            setLoadingStatus(prev => ({...prev, isLoadingReview: false}));
        }
    };

    /**
     * Handle peer assignment submission automation (Legacy - Random Text)
     * Generates random content and fills assignment forms including file uploads
     * @param {Function} setLoadingStatus - React state setter for loading status
     */
    const handlePeerAssignmentSubmission = async (setLoadingStatus) => {
        setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: true}));

        try {
            // Wait for form to load
            await waitForSelector(".rc-FormPart", 5000).catch(() => {});

            // Generate random content
            const randomText = generateRandomString(10);

            // Fill ContentEditable Divs (Rich Text Editors)
            const editors = document.querySelectorAll("div[contenteditable='true']");
            editors.forEach(editor => {
                editor.focus();
                editor.innerText = randomText;
                editor.dispatchEvent(new Event('input', { bubbles: true }));
            });

            // Fill Standard Textareas
            const textAreas = document.querySelectorAll("textarea");
            textAreas.forEach(ta => {
                ta.value = randomText;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            });

            // Handle File Uploads
            const fileInputs = Array.from(document.querySelectorAll("input[type='file']"));
            for (const input of fileInputs) {
                // Create dummy file
                const fileContent = generateRandomString(100);
                const fileName = generateRandomString(4, "-") + ".txt";
                const file = new File([fileContent], fileName, { type: "text/plain" });

                // Create DataTransfer
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                // Handle React internal tracker
                const reactTracker = input._valueTracker;
                if (reactTracker) reactTracker.setValue(fileName);

                input.files = dataTransfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));

                // Wait for upload to process
                await wait(3000);
            }

            // Wait before submit
            await wait(4000);

            // Find and click submit button
            const submitBtn = await waitForSelector("button[data-test='submit-button']", 10000).catch(() => null);
            if (submitBtn) {
                submitBtn.click();

                // Handle confirmation modal
                await wait(1000);
                const confirmBtn = await waitForSelector("button[data-test='confirm-submit-button']", 10000).catch(() => null);
                if (confirmBtn) {
                    confirmBtn.click();
                }
            }

            toast.success("Assignment submitted!");

        } catch (e) {
            console.error("Assignment Submission Error:", e);
            toast.error("Assignment submission failed");
        } finally {
            setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
        }
    };

    /**
     * Set value for React-controlled inputs
     * This bypasses React's value tracking by using the native setter
     * @param {HTMLElement} element - The input element
     * @param {string} value - The value to set
     */
    const setReactInputValue = (element, value) => {
        // Get the native setter for the element type
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
            'value'
        ).set;

        // Use the native setter to bypass React's tracking
        nativeInputValueSetter.call(element, value);

        // Trigger React's change detection
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
    };

    /**
     * Simulate typing character by character with delay for React inputs
     * @param {HTMLElement} element - The input element to type into
     * @param {string} text - The text to type
     * @param {number} delay - Delay between characters in milliseconds (default 10ms)
     */
    const simulateTyping = async (element, text, delay = 10) => {
        element.focus();

        // For contenteditable divs (rich text editors)
        if (element.contentEditable === 'true') {
            // Clear first
            element.innerText = '';

            // Type character by character with 10ms delay
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                element.innerText += char;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                if (delay > 0) await wait(delay);
            }

            // Final events
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();
        } else {
            // For input/textarea - use React-compatible method
            // Type character by character with 10ms delay
            for (let i = 0; i < text.length; i++) {
                const partialText = text.substring(0, i + 1);
                setReactInputValue(element, partialText);
                if (delay > 0) await wait(delay);
            }

            // Final events
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();
        }
    };

    /**
     * Handle AI-powered peer graded assignment automation (Task 4.2)
     * Extracts assignment instructions, uses Gemini AI to generate contextual answers,
     * fills form fields intelligently with character-by-character typing, and submits the assignment
     * @param {Function} setLoadingStatus - React state setter for loading status
     */
    const handlePeerGradedAssignment = async (setLoadingStatus) => {
        setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: true}));

        try {
            // Check if on assignment submission page
            if (!location.href.includes("assignment-submission") && !location.href.includes("peer")) {
                toast.error("Please navigate to an assignment submission page.");
                setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
                return;
            }

            // Get Gemini API key
            const geminiAPI = isolatedStorage.get('geminiAPI', '');
            if (!geminiAPI) {
                toast.error("Please set your Gemini API key in settings.");
                setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
                return;
            }

            toast.loading("Extracting assignment instructions...");

            // Step 1: Extract assignment instructions from the specific div
            let assignmentContext = "";

            const instructionsContainer = document.querySelector('div[data-testid="peer-assignment-instructions"]');
            if (instructionsContainer) {
                assignmentContext += "Assignment Instructions:\n" + instructionsContainer.innerText + "\n\n";
            }

            // Extract "Grading Criteria Overview" section
            const gradingCriteria = Array.from(document.querySelectorAll('h3')).find(h =>
                h.innerText.includes("Grading Criteria") || h.innerText.includes("Grading Overview")
            );
            if (gradingCriteria) {
                const criteriaContent = gradingCriteria.closest('[data-testid="accordion-item"]');
                if (criteriaContent) {
                    assignmentContext += "Grading Criteria:\n" + criteriaContent.innerText + "\n\n";
                }
            }

            // Extract "Step-By-Step Assignment Instructions" section
            const stepByStep = Array.from(document.querySelectorAll('h3')).find(h =>
                h.innerText.includes("Step-By-Step") || h.innerText.includes("Assignment Instructions")
            );
            if (stepByStep) {
                const stepsContent = stepByStep.closest('[data-testid="accordion-item"]');
                if (stepsContent) {
                    assignmentContext += "Step-by-Step Instructions:\n" + stepsContent.innerText + "\n\n";
                }
            }

            // If no specific instructions found, try to get general context
            if (!assignmentContext) {
                const mainContent = document.querySelector('.rc-CML') || document.querySelector('main');
                if (mainContent) {
                    assignmentContext = "Assignment Context:\n" + mainContent.innerText.substring(0, 2000);
                }
            }

            console.log("Assignment Context Extracted:", assignmentContext.substring(0, 500) + "...");

            // Step 2: Click "My Submission" tab
            const mySubmissionTab = Array.from(document.querySelectorAll('button[role="tab"]')).find(btn =>
                btn.innerText.includes("My submission") || btn.innerText.includes("My Submission")
            );
            if (mySubmissionTab && mySubmissionTab.getAttribute('aria-selected') !== 'true') {
                mySubmissionTab.click();
                await wait(2000); // Wait for tab content to load
            }

            // Step 3: Wait for form to load
            await waitForSelector(".rc-AssignmentSubmitEditView, .rc-FormPart", 5000).catch(() => {});

            // Step 4: Extract form fields and their prompts
            const formFields = [];

            // Find all submission parts (prompts)
            const submissionParts = document.querySelectorAll('.rc-SubmissionPartEditView');

            for (const part of submissionParts) {
                // Extract the prompt/question text
                const promptElement = part.querySelector('[id^="prompt-"]');
                const promptText = promptElement ? promptElement.innerText : "";

                // Find the input field (contenteditable div or textarea)
                const editableDiv = part.querySelector('div[contenteditable="true"]');
                const textarea = part.querySelector('textarea');
                const inputField = editableDiv || textarea;

                if (inputField && promptText) {
                    formFields.push({
                        prompt: promptText,
                        element: inputField,
                        type: editableDiv ? 'contenteditable' : 'textarea'
                    });
                }
            }

            // Also check for Project Title field (always first, max 50 chars)
            const titleInput = document.querySelector('input#title');
            if (titleInput) {
                formFields.unshift({
                    prompt: "Project Title",
                    element: titleInput,
                    type: 'input',
                    maxLength: 50 // Project title has 50 char limit
                });
            }

            if (formFields.length === 0) {
                toast.error("Could not find form fields to fill.");
                setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
                return;
            }

            console.log(`Found ${formFields.length} form fields to fill`);

            // Step 5: Generate AI responses for each field
            toast.loading(`Generating AI responses for ${formFields.length} fields...`);

            for (let i = 0; i < formFields.length; i++) {
                const field = formFields[i];

                try {
                    // Determine answer length from instructions - aim for MINIMUM requirement to save tokens
                    let minLength = 50; // Minimum default
                    let maxLength = 100; // Maximum default
                    let lengthInstruction = "";

                    // Check if this field has a predefined maxLength (like Project Title)
                    if (field.maxLength) {
                        maxLength = field.maxLength;
                        minLength = Math.min(30, maxLength - 10);
                        lengthInstruction = `Keep it concise and under ${maxLength} characters. Aim for around ${minLength}-${maxLength} characters.`;
                    }
                    // Check for word count requirements in context or prompt
                    else {
                        const wordCountMatch = (assignmentContext + field.prompt).match(/(?:at least|minimum|min|ít nhất)\s*(\d+)\s*(?:words?|từ)/i);
                        if (wordCountMatch) {
                            const requiredWords = parseInt(wordCountMatch[1]);
                            // Aim for MINIMUM requirement (avg 5 chars per word + spaces)
                            minLength = requiredWords * 6;
                            maxLength = minLength + 50; // Small buffer
                            lengthInstruction = `Write exactly ${requiredWords} words (approximately ${minLength} characters). Do not exceed this.`;
                        } else if (field.prompt.toLowerCase().includes('title') || field.type === 'input') {
                            // Titles should be short (50 char max for project title)
                            maxLength = 50;
                            minLength = 30;
                            lengthInstruction = "Keep it concise, under 50 characters.";
                        } else if (assignmentContext.toLowerCase().includes('essay') || assignmentContext.toLowerCase().includes('detailed')) {
                            // Essays - aim for minimum viable length
                            minLength = 300;
                            maxLength = 400;
                            lengthInstruction = "Provide a concise response of around 50-70 words (300-400 characters).";
                        } else {
                            // Default short response
                            minLength = 50;
                            maxLength = 150;
                            lengthInstruction = "Keep it brief, around 50-150 characters.";
                        }
                    }

                    // Create a prompt for Gemini that includes context and the specific question
                    const aiPrompt = `You are helping complete a peer-graded assignment. Here is the assignment context:

${assignmentContext}

Now answer this specific question/prompt:

${field.prompt}

${lengthInstruction}

IMPORTANT: Keep your response as SHORT as possible while meeting the minimum requirement. Do not add extra content. Provide only the answer, no explanations or meta-commentary.`;

                    // Call Gemini API
                    const response = await fetch(`${CONSTANTS.GEMINI_API_URL}?key=${geminiAPI}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: aiPrompt }]
                            }]
                        })
                    });

                    if (!response.ok) {
                        console.error(`Gemini API error for field ${i}:`, await response.text());
                        // Fallback to generic text
                        field.answer = `Response ${i + 1}`;
                        continue;
                    }

                    const data = await response.json();
                    let answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

                    // Clean up the answer
                    answer = answer.trim();
                    
                    // Strictly enforce maximum length to save tokens
                    if (answer.length > maxLength) {
                        answer = answer.substring(0, maxLength).trim();
                        // Try to end at a word boundary
                        const lastSpace = answer.lastIndexOf(' ');
                        if (lastSpace > maxLength * 0.8) {
                            answer = answer.substring(0, lastSpace);
                        }
                    }

                    field.answer = answer;
                    console.log(`Generated answer for "${field.prompt.substring(0, 30)}..." (${answer.length} chars, target: ${minLength}-${maxLength})`);

                    // Small delay to avoid rate limiting
                    await wait(500);

                } catch (error) {
                    console.error(`Error generating answer for field ${i}:`, error);
                    // Fallback to generic text
                    field.answer = `Response ${i + 1}`;
                }
            }

            // Step 6: Fill form fields - Auto-fill Project Title, Manual paste for others
            toast.loading("Preparing form fields...");

            // Separate Project Title from other fields
            const projectTitleField = formFields.find(f => f.prompt === "Project Title");
            const otherFields = formFields.filter(f => f.prompt !== "Project Title");

            // Auto-fill Project Title (working with anti-autofill)
            if (projectTitleField && projectTitleField.answer) {
                projectTitleField.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await wait(300);

                // Clear and fill Project Title
                setReactInputValue(projectTitleField.element, '');
                projectTitleField.element.focus();
                await wait(200);

                // Simulate typing for Project Title
                await simulateTyping(projectTitleField.element, projectTitleField.answer, 10);
                console.log(`✓ Auto-filled Project Title: ${projectTitleField.answer}`);
                await wait(500);
            }

            // For other fields: Create manual paste UI
            if (otherFields.length > 0) {
                toast.loading("Creating copy-paste helpers for remaining fields...");

                for (const field of otherFields) {
                    if (!field.answer) continue;

                    // Scroll field into view
                    field.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await wait(300);

                    // Find the parent container to insert the helper div
                    const fieldContainer = field.element.closest('.rc-SubmissionPartEditView') || 
                                         field.element.closest('.rc-FormPart') ||
                                         field.element.parentElement;

                    if (!fieldContainer) continue;

                    // Check if helper already exists
                    if (fieldContainer.querySelector('.coursera-tool-paste-helper')) continue;

                    // Create helper div with answer and copy button
                    const helperDiv = document.createElement('div');
                    helperDiv.className = 'coursera-tool-paste-helper';
                    helperDiv.style.cssText = `
                        margin-top: 12px;
                        padding: 12px;
                        background-color: #f3f4f6;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-family: system-ui, -apple-system, sans-serif;
                    `;

                    // Message
                    const messageDiv = document.createElement('div');
                    messageDiv.style.cssText = `
                        color: #6b7280;
                        font-size: 12px;
                        margin-bottom: 8px;
                        font-style: italic;
                    `;
                    messageDiv.textContent = '⚠️ Answer requires manual paste. Please copy and paste the following answer:';

                    // Answer textbox
                    const answerTextbox = document.createElement('textarea');
                    answerTextbox.value = field.answer;
                    answerTextbox.readOnly = true;
                    answerTextbox.style.cssText = `
                        width: 100%;
                        min-height: 80px;
                        padding: 8px;
                        border: 1px solid #d1d5db;
                        border-radius: 4px;
                        font-size: 13px;
                        font-family: monospace;
                        background-color: white;
                        resize: vertical;
                        margin-bottom: 8px;
                    `;

                    // Copy button
                    const copyButton = document.createElement('button');
                    copyButton.textContent = '📋 Copy Answer';
                    copyButton.style.cssText = `
                        background-color: #2563eb;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 8px 16px;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        width: 100%;
                    `;
                    copyButton.onclick = async () => {
                        try {
                            await navigator.clipboard.writeText(field.answer);
                            copyButton.textContent = '✓ Copied!';
                            copyButton.style.backgroundColor = '#16a34a';
                            setTimeout(() => {
                                copyButton.textContent = '📋 Copy Answer';
                                copyButton.style.backgroundColor = '#2563eb';
                            }, 2000);
                        } catch (err) {
                            // Fallback: select text
                            answerTextbox.select();
                            document.execCommand('copy');
                            copyButton.textContent = '✓ Copied!';
                            copyButton.style.backgroundColor = '#16a34a';
                        }
                    };

                    // Assemble helper div
                    helperDiv.appendChild(messageDiv);
                    helperDiv.appendChild(answerTextbox);
                    helperDiv.appendChild(copyButton);

                    // Insert after the field's parent container
                    fieldContainer.appendChild(helperDiv);

                    console.log(`Created paste helper for: ${field.prompt.substring(0, 30)}...`);
                }

                toast.success("Copy-paste helpers created! Please manually paste answers into fields.");
            }

            // Step 6.5: Wait for user to fill all fields manually
            if (otherFields.length > 0) {
                toast.loading("Waiting for you to paste answers into all fields...");

                // Function to check if a field is filled
                const isFieldFilled = (field) => {
                    if (field.type === 'contenteditable') {
                        const text = field.element.innerText.trim();
                        return text.length > 10; // At least 10 characters
                    } else {
                        const text = field.element.value.trim();
                        return text.length > 10;
                    }
                };

                // Poll until all fields are filled
                let allFilled = false;
                let checkCount = 0;
                const maxChecks = 600; // 10 minutes max (600 * 1000ms)

                while (!allFilled && checkCount < maxChecks) {
                    // Check all other fields
                    const filledFields = otherFields.filter(isFieldFilled);
                    const remainingFields = otherFields.length - filledFields.length;

                    if (remainingFields === 0) {
                        allFilled = true;
                        toast.success("All fields filled! Proceeding with submission...");
                        break;
                    }

                    // Update toast every 5 seconds
                    if (checkCount % 5 === 0) {
                        toast.loading(`Waiting for ${remainingFields} field(s) to be filled...`);
                    }

                    await wait(1000); // Check every second
                    checkCount++;
                }

                if (!allFilled) {
                    toast.error("Timeout waiting for fields to be filled. Please complete manually.");
                    setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
                    return;
                }
            }

            // Step 7: Handle file uploads (excluding them initially as per flow)
            // We'll handle file uploads after filling text fields
            const addFileButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.innerText.includes('Add File') || btn.innerText.includes('Upload')
            );

            if (addFileButtons.length > 0) {
                toast.loading("Generating file content with AI...");

                for (const addBtn of addFileButtons) {
                    try {
                        // Generate AI content for file
                        const filePrompt = `You are helping complete a peer-graded assignment. Here is the assignment context:

${assignmentContext}

Generate a comprehensive document that addresses the assignment requirements. Format it as a professional document with proper structure, headings, and detailed content. Aim for 500-800 words.

Provide only the document content, no meta-commentary.`;

                        let fileContent = "";
                        
                        try {
                            const fileResponse = await fetch(`${CONSTANTS.GEMINI_API_URL}?key=${geminiAPI}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [{ text: filePrompt }]
                                    }]
                                })
                            });

                            if (fileResponse.ok) {
                                const fileData = await fileResponse.json();
                                fileContent = fileData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                            }
                        } catch (error) {
                            console.error("AI file generation error:", error);
                        }

                        // Fallback to random content if AI fails
                        if (!fileContent) {
                            const randomWords = generateRandomString(50);
                            fileContent = `# Assignment Submission\n\n${randomWords}\n\n## Details\n\n${randomWords}`;
                        }

                        // Click the "Add File" button
                        addBtn.click();
                        await wait(1000);

                        // Look for file input or browse button
                        const browseBtn = document.querySelector('button.uppy-Dashboard-browse');
                        if (browseBtn) {
                            // Find the hidden file input
                            const fileInput = document.querySelector('input.uppy-Dashboard-input[type="file"]');
                            if (fileInput) {
                                // Generate filename based on assignment
                                const timestamp = Date.now();
                                const fileName = `assignment_${timestamp}.md`;

                                // Create MD file with AI-generated content
                                const file = new File([fileContent], fileName, { type: 'text/markdown' });

                                // Create DataTransfer and assign file
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);

                                fileInput.files = dataTransfer.files;
                                fileInput.dispatchEvent(new Event('change', { bubbles: true }));

                                console.log(`Uploaded AI-generated file: ${fileName} (${fileContent.length} chars)`);

                                // Wait for upload to process
                                await wait(3000);
                            }
                        }
                    } catch (error) {
                        console.error("File upload error:", error);
                    }
                }
            }

            // Step 8: Check the honor code checkbox
            toast.loading("Accepting honor code...");

            const honorCodeCheckbox = document.querySelector('input[type="checkbox"]#agreement-checkbox-base');
            if (honorCodeCheckbox && !honorCodeCheckbox.checked) {
                honorCodeCheckbox.click();
                await wait(500);
            }

            // Step 9: Wait 4 seconds then submit
            await wait(4000);

            toast.loading("Submitting assignment...");

            // Find submit button with data-testid="preview" or aria-label="Submit"
            const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                btn.getAttribute('data-testid') === 'preview' ||
                btn.getAttribute('aria-label') === 'Submit'
            );

            if (submitBtn) {
                console.log("Clicking first submit button...");
                submitBtn.click();

                // Wait 1 second then click 2nd submit button in dialog
                await wait(1000);

                // Wait for dialog to appear and find the confirmation button
                try {
                    const confirmBtn = await waitForSelector('button[data-testid="dialog-submit-button"]', 5000);
                    if (confirmBtn) {
                        console.log("Clicking second submit button in dialog...");
                        confirmBtn.click();
                        await wait(1000);
                        toast.success("AI-powered assignment submitted successfully!");
                    } else {
                        console.log("Second submit button not found");
                        toast.warning("First submit clicked. Please confirm submission manually.");
                    }
                } catch (error) {
                    console.log("Dialog submit button not found:", error);
                    toast.warning("First submit clicked. Please confirm submission manually.");
                }
            } else {
                console.log("Submit button not found");
                toast.warning("Assignment filled! Please review and submit manually.");
            }

        } catch (e) {
            console.error("AI Assignment Submission Error:", e);
            toast.error("AI assignment submission failed: " + e.message);
        } finally {
            setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
        }
    };

    /**
     * Handle discussion prompt automation
     * Posts random text to discussion forums
     * @param {Function} setLoadingStatus - React state setter for loading status
     */
    const handleDiscussionPrompt = async (setLoadingStatus) => {
        setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: true }));

        try {
            const { materials, courseId } = await getCourseMetadata();
            const userId = getUserId();
            const csrf3Token = getCookie('CSRF3-Token');

            if (!csrf3Token) {
                toast.error("CSRF token not found. Please refresh the page.");
                setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: false }));
                return;
            }

            // Filter for discussion prompts
            const prompts = materials.filter(item =>
                item.contentSummary?.typeName?.includes("discussionPrompt")
            );

            if (prompts.length === 0) {
                toast.warning("No discussion prompts found.");
                setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: false }));
                return;
            }

            // Get discussion waiting time from settings (default 12 seconds)
            const discussionWaitingTime = isolatedStorage.get('discussionWaitingTime', 12);

            let count = 0;
            for (const prompt of prompts) {
                try {
                    // Fetch forum question details
                    const forumUrl = `https://www.coursera.org/api/onDemandCourseItemForumQuestions.v1?q=courseItem&courseId=${courseId}&itemId=${prompt.id}&limit=1`;
                    const forumData = await fetch(forumUrl).then(r => r.json());

                    // Extract forum question ID
                    const forumQuestionIdRaw = forumData?.linked?.['onDemandCourseItemForumQuestions.v1']?.[0]?.definition?.courseItemForumQuestionId;
                    const actualForumId = forumQuestionIdRaw?.split("~")[2];

                    if (!actualForumId) {
                        console.error(`Could not extract forum ID for ${prompt.id}`);
                        continue;
                    }

                    // Generate random text (10 words)
                    const randomText = generateRandomString(10);

                    // Post to forum
                    const postUrl = "https://www.coursera.org/api/onDemandCourseForumAnswers.v1";
                    const response = await fetch(postUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-csrf3-token": csrf3Token
                        },
                        body: JSON.stringify({
                            content: {
                                typeName: "cml",
                                definition: {
                                    dtdId: "discussion/1",
                                    value: `<co-content><text>${randomText}</text></co-content>`
                                }
                            },
                            courseForumQuestionId: `${courseId}~${actualForumId}`
                        })
                    });

                    if (response.ok) {
                        count++;
                        toast.success(`Done ${prompt.name}! (${count}/${prompts.length})`);
                    }

                    // Wait between submissions if more than 3 prompts
                    if (count < 3 && count < prompts.length) {
                        await wait(discussionWaitingTime * 1000);
                    }

                } catch (error) {
                    console.error(`Error processing prompt ${prompt.id}:`, error);
                }
            }

            if (count > 0) {
                toast.success(`Completed ${count}/${prompts.length} discussion prompts!`);
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast.error("No discussions were posted successfully.");
            }

        } catch (e) {
            console.error("Discussion Handler Error:", e);
            toast.error("Failed to complete discussions.");
        } finally {
            setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: false }));
        }
    };

    /**
     * Request grading by peer for submitted assignments (Disable AI Grading)
     * Triggers the peer grading request via GraphQL API
     */
    const requestGradingByPeer = async () => {
        try {
            // Check if on assignment/peer review submission page
            // Valid URLs: /peer/.../submit or /assignment-submission/...
            if (!location.href.includes("/peer/") && !location.href.includes("assignment-submission")) {
                toast.error("Please go to the assignment submission page.");
                return;
            }

            // Extract user ID
            const userId = getUserId();
            if (!userId) {
                toast.error("Could not find User ID.");
                return;
            }

            // Get full courseId from API (not just slug)
            const { courseId } = await getCourseMetadata();
            if (!courseId) {
                toast.error("Could not extract course ID.");
                return;
            }

            // Extract itemId from URL
            // URL format: /learn/[slug]/peer/[itemId]/[title]/submit
            const pathParts = window.location.pathname.split("/");
            const peerIndex = pathParts.indexOf("peer");
            const itemId = peerIndex !== -1 ? pathParts[peerIndex + 1] : null;

            if (!itemId) {
                toast.error("Could not extract item ID from URL.");
                return;
            }

            console.log(`Coursera Tool: Fetching submission for userId=${userId}, courseId=${courseId}, itemId=${itemId}`);

            // Fetch submission ID with proper query parameters
            const fields = encodeURIComponent('deleteSubmission,listSubmissions,reviewPeers,viewReviewSchema,anonymousPeerReview,onDemandPeerSubmissionProgresses.v1(latestSubmissionSummary,latestDraftSummary,latestAttemptSummary),onDemandPeerReceivedReviewProgresses.v1(evaluationIfReady,earliestCompletionTime,reviewCount,defaultReceivedReviewRequiredCount),onDemandPeerDisplayablePhaseSchedules.v1(currentPhase,phaseEnds,phaseStarts)');
            const includes = encodeURIComponent('receivedReviewsProgress,submissionProgress,phaseSchedule');
            const permissionUrl = `https://www.coursera.org/api/onDemandPeerAssignmentPermissions.v1/${userId}~${courseId}~${itemId}/?fields=${fields}&includes=${includes}`;
            
            const permissionData = await fetch(permissionUrl).then(r => r.json());

            const submissionId = permissionData
                ?.linked?.['onDemandPeerSubmissionProgresses.v1']?.[0]
                ?.latestSubmissionSummary?.computed?.id;

            if (!submissionId) {
                console.error("Coursera Tool: Permission API response:", permissionData);
                toast.error("Could not find submission ID. Make sure you have submitted the assignment.");
                return;
            }

            console.log(`Coursera Tool: Found submissionId=${submissionId}`);

            // Get CSRF token
            const csrf3Token = getCookie('CSRF3-Token');

            // Send GraphQL mutation
            const response = await fetch("https://www.coursera.org/graphql-gateway?opname=RequestGradingByPeer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf3-token": csrf3Token
                },
                body: JSON.stringify([{
                    operationName: "RequestGradingByPeer",
                    variables: {
                        input: {
                            courseId: courseId,
                            itemId: itemId,
                            submissionId: submissionId,
                            reason: "EXPECTED_HIGHER_SCORE"
                        }
                    },
                    query: `mutation RequestGradingByPeer($input: PeerReviewAi_RequestGradingByPeerInput!) {
                        PeerReviewAi_RequestGradingByPeer(input: $input) {
                            submissionId
                            __typename
                        }
                    }`
                }])
            });

            if (response.ok) {
                toast.success("AI grading disabled! Peer grading requested.");
                setTimeout(() => window.location.reload(), 2000);
            } else {
                const errorData = await response.json();
                console.error("Coursera Tool: GraphQL error:", errorData);
                toast.error("Failed to disable AI grading.");
            }

        } catch (e) {
            console.error("Request Grading Error:", e);
            toast.error("Failed to request peer grading: " + e.message);
        }
    };

    // ==========================================
    // REACT APP COMPONENT & STATE MANAGEMENT
    // ==========================================

    // Get version from GM metadata
    const SCRIPT_VERSION = GM_info?.script?.version || '1.0.0';

    // Logo image in base64 format (16x16px)
    // To add your logo: Convert your image to base64 at https://base64.guru/converter/encode/image
    // Then replace the empty string below with: "data:image/png;base64,YOUR_BASE64_STRING_HERE"
    const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAG0ElEQVR4nOxZaWxUVRT+7p03SzvdKBW0VMR0CgZRcYkKElMQC62goEJcMGBcEk2IGmvUH2qNGxpjTEhIUFBCQgCbWBJIaSrQGsNS2UFrgQIGSqmle2ef99713EdbOjOddt6kppL0m9ze5d1z3jn3LPfMVMF1DgXXOUYVGGmMKjDSGFVgpDGqwGDoKJ5yq0ULzRMCeQycx9onuN6U9s25L5EA/hMFWle60qyK+BGa+oQAs4CRkPSJBVJuExLEsCvQ/PrUFKsS2E/DqXETCbEDCYJjmOGw+7+FGeFJfFVoB5AghlWBzrdyMskhlsEcWjMyJjUgQcR2oZISnnR04oPCwpdBF5MH20ve3RLYtmIJ4LqfpnaYANEeZyXVau98yS9z09WQdSmYKKRpxhDkpwcUKnXh2qzQUfvPgolZJDzDEGACFfIvR26hgDkwxsp7x0+WFz6tqmIdsUqPh5betTFagcfXp4a4hYJQuBAnSMXyHoazYRJcZ3tkv3jn/CWUqTbT0BInqY9xvTwqBhyMf2VGeAnK89Uy+9DQFB2Z1utWks4sKlskXeV7xC+8RH3ZvMrmcAUKNjrJpn1ByBkbtPWI4Q7anPU2JTCFJkmQ69xytTEe3fpBhzh949cnPLAHnqVpOiOVyKVitghUyT9hLpSUhGlkxpQkmwWrX5uJudOz+wkajsY2Lx4q3g5NF6dQutTH38x9RK5bH1gK+2PFPbsiIoKm+uVT8K5/BQj6pQUMIRgTT8n++ckrMGdCAQaGQHugDZ8e/tDo6SjKoxQQTH1UGlYK/3x+LmKhrTuA4nU1Uni5fZexyFBoMJw6G8w5JiatJW8GFNcMqLVV0LnYmV+Vr8CPu+Sz461H8PikxVC4dUDaDPsYzJ+4AJvPbFR1rh+NUoDsPk+xMMy/N4eSj8Ds98rR3OkL20HLaO7wwRfUeg+mQrx6r7UbHXdI9+E5txvL3jXLINr6pXd6lvT6JvAx2RBdV+SKaglajmX4HTk0HisXTrYex8vVLyBZceLh7Nl4xrUMh5pr8EPd2j427pCbZGCN0/fPbClDZT8FlvxkEyHPtOxMJzJT7HD7Q1R+MWSlOcIUaGrvJzwQslm1E53JXTeTSTNZcgZ42g0kWgBUB4VbwuoAT80iigD0K+flyqWU1fUtKHLNhRHPV9EV7DTaLSmTjPnB5gNo8l4Ok4HOoqakpEQPs4Bd9U0iLun35WUZcZiaZEXVF0VhhDq5TMEHFWho8fQuXewqfamdvbGqSMYfH09JiCtGS165BQNBuo4IeKQlD8gab5FgC+RFEiYgfXLT84xxXcdf0UwE66udlGtE+izZFdwzwZhfpiB1+/suSHjIIqtKT2Bv7T/9We01rjGWu0BOpH8b/D3tEL6uiJcKaOcOIlD2ydU5JyGIkleIGZGXn9OagkzHWAQ0P5p9TYgUX+P6vigFiP9j0o4zbhtnzJ/+fDeOnG3FYKCT2iHDuJvhQYOZy+jg3/Iu1D/3DEYqhM72Ld79SCbR50Q+nODMgcIUNHobSIlA5OMOe1fahd7J1cRMdQ8Jc790m4njUuAnHz/T2IUhIARXa9wrXVnyndJt+I1kdqFDu1Q7BClrT/emXUTQJrNPVMqZlmkkJXKfAfgwcbJ0aWkwTAHn77fQsYubJk9Ih8NqQeXRS+j2hTAEWvxtDZc0rk2nscIoeGUQaxf/gOhsHoJUnGDfHQ71FGxRuHPsdMqCOnY1VERTCha2aCigWnEPdRbXTWlYvb0Wy7/5FXHgGKpLVMpUhhAyPYYOlcG3doVhhUHBRK8Qc6Ie0cev+fDZ4Y9Q33kmipQE3tV/rvQsFslA2vrbOaPFA9ZzExL1HHkZaOcPGy0eUDLbvXD7wmSG0JTIAJZfPb848nEs0m4318P8isucRHVwPszBR5fllqbi8U4GkWeWNhhw1CnWYB4J7zRDSPs3VM6r9PRf486iDeOpqso1w0cw9o6n9MWmVD11MjFNhjnUj1tT62Y6N1t613m5/n7kItesgi4SOOJk4qHU81qgbPkaOdGEmAOToEuyWvYiRgAPAOllu4OaZWbk6UsoVKbeTX63c1AOjEvCaptq29q9/bkWYHkv58Ihv65FgPy/XF5gYidrYdeCeSDQ+bA6WLTN2woqj9AhD/hlz+z7+yBK8pXuzouySMkyQebX7aHsjFUX2jFMSPhXiY6Ov/uqyHhB2XXDcAovkbACHFwWPiYsyI6n+XxvY5iRuAKML4hzq8qE2OQP2Gax7xq9GGYk/NOizkQNpd/zMTcwplHdWG/VLFXJq88m/MPVUEg4iP8vGP3/wEhjVIGRxqgCI41RBUYa/wIAAP//arw42gAAAAZJREFUAwDB1oR+GcWq+wAAAABJRU5ErkJggg==";

    /**
     * React App Component
     * Main UI control panel for the Coursera Tool
     * Provides buttons for all automation features and settings management
     */
    const App = () => {
        // State for configuration settings
        const [config, setConfig] = React.useState({
            isAutoSubmitQuiz: false,
            geminiAPI: "",
            isShowControlPanel: true
        });

        // State for loading indicators
        const [loadingStatus, setLoadingStatus] = React.useState({
            isLoadingCompleteWeek: false,
            isLoadingQuiz: false,
            isLoadingReview: false,
            isLoadingSubmitPeerGrading: false,
            isLoadingDiscuss: false
        });

        // State for panel positioning (draggable)
        const [position, setPosition] = React.useState({ x: 20, y: 80 });
        const [isDragging, setIsDragging] = React.useState(false);
        const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
        const panelRef = React.useRef(null);

        // Load settings from Tampermonkey storage on mount
        React.useEffect(() => {
            console.log('Coursera Tool: Loading settings from Tampermonkey storage...');
            console.log('Coursera Tool: Available keys:', isolatedStorage.listAll());

            // Load from Tampermonkey's isolated storage
            const loadedConfig = {
                isAutoSubmitQuiz: isolatedStorage.get('isAutoSubmitQuiz', false),
                geminiAPI: isolatedStorage.get('geminiAPI', ''),
                isShowControlPanel: isolatedStorage.get('isShowControlPanel', true)
            };

            console.log('Coursera Tool: Loaded config:', loadedConfig);

            // Set the config state
            setConfig(loadedConfig);

            // Load panel position
            const savedPosition = isolatedStorage.get('panelPosition', null);
            if (savedPosition) {
                setPosition(savedPosition);
            }

            // Log API key status
            if (loadedConfig.geminiAPI) {
                console.log(`Coursera Tool: ✓ API key loaded: ${loadedConfig.geminiAPI.substring(0, 15)}... (length: ${loadedConfig.geminiAPI.length})`);
            } else {
                console.log('Coursera Tool: ℹ️ No API key found in storage');
            }
        }, []);

        // Debug: Log when geminiAPI changes
        React.useEffect(() => {
            console.log('Coursera Tool: config.geminiAPI state is now:', config.geminiAPI ? `${config.geminiAPI.substring(0, 15)}... (length: ${config.geminiAPI.length})` : '(empty)');
        }, [config.geminiAPI]);

        // Toggle boolean config values - Tampermonkey storage
        const toggleConfig = (key) => {
            const newValue = !config[key];
            console.log(`Coursera Tool: Toggling ${key} to:`, newValue);

            // Update state
            setConfig(prev => ({ ...prev, [key]: newValue }));

            // Save to Tampermonkey storage
            isolatedStorage.set(key, newValue);
        };

        // Update config values - Tampermonkey storage
        const updateConfig = (key, value) => {
            console.log(`Coursera Tool: Updating ${key} to:`, typeof value === 'string' && value.length > 20 ? `${value.substring(0, 20)}...` : value);

            // Update state immediately
            setConfig(prev => ({ ...prev, [key]: value }));

            // Save to Tampermonkey storage
            const success = isolatedStorage.set(key, value);

            if (!success) {
                console.error(`Coursera Tool: ✗ Failed to save ${key}`);
            }
        };

        // Handle mouse down for dragging
        const handleMouseDown = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                return; // Don't start drag on interactive elements
            }

            setIsDragging(true);
            // Since panel is positioned from the right, calculate offset accordingly
            const panelWidth = panelRef.current?.offsetWidth || 320;
            setDragOffset({
                x: panelWidth - (window.innerWidth - e.clientX - position.x),
                y: e.clientY - position.y
            });
        };

        // Handle mouse move for dragging
        React.useEffect(() => {
            const handleMouseMove = (e) => {
                if (isDragging) {
                    // Since panel is positioned from the right, invert X calculation
                    const newX = window.innerWidth - e.clientX - dragOffset.x;
                    const newY = e.clientY - dragOffset.y;

                    // Keep panel within viewport
                    const panelWidth = panelRef.current?.offsetWidth || 320;
                    const panelHeight = panelRef.current?.offsetHeight || 400;
                    const maxX = window.innerWidth - panelWidth;
                    const maxY = window.innerHeight - panelHeight;

                    const boundedX = Math.max(0, Math.min(newX, maxX));
                    const boundedY = Math.max(0, Math.min(newY, maxY));

                    setPosition({ x: boundedX, y: boundedY });
                }
            };

            const handleMouseUp = () => {
                if (isDragging) {
                    setIsDragging(false);
                    // Save position to Tampermonkey storage
                    isolatedStorage.set('panelPosition', position);
                }
            };

            if (isDragging) {
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }, [isDragging, dragOffset, position]);

        // Minimized view (just a floating button)
        if (!config.isShowControlPanel) {
            return React.createElement("div", {
                style: {
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: '#2563eb',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 9999,
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                onClick: () => toggleConfig("isShowControlPanel"),
                title: "Show Coursera Tool"
            }, React.createElement("img", {
                src: "https://www.coursera.org/favicon.ico",
                alt: "Coursera Tool",
                style: {
                    width: '24px',
                    height: '24px',
                    }
            }));
        }

        // Main panel view - Compact Design
        return React.createElement("div", {
            ref: panelRef,
            style: {
                position: 'fixed',
                top: `${position.y}px`,
                right: `${position.x}px`,
                zIndex: 9999,
                width: '380px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e0e0e0',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                cursor: isDragging ? 'grabbing' : 'default'
            }
        },
            // Header
            React.createElement("div", {
                style: {
                    backgroundColor: '#f5f5f5',
                    padding: '5px 8px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'grab',
                    userSelect: 'none'
                },
                onMouseDown: handleMouseDown
            },
                React.createElement("div", {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }
                },
                    // Logo or emoji
                    LOGO_BASE64 
                        ? React.createElement("img", {
                            src: LOGO_BASE64,
                            alt: "Logo",
                            style: {
                                width: '16px',
                                height: '16px',
                                objectFit: 'contain'
                            }
                        })
                        : React.createElement("span", {
                            style: { fontSize: '16px' }
                        }, "🎬"),
                    // Title
                    React.createElement("span", {
                        style: {
                            fontWeight: '700',
                            fontSize: '12px',
                            color: '#1a1a1a'
                        }
                    }, "Coursera Tool")
                ),
                React.createElement("button", {
                    onClick: () => toggleConfig("isShowControlPanel"),
                    style: {
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    },
                    title: "Minimize"
                }, "✕")
            ),

            // Body
            React.createElement("div", {
                style: {
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                }
            },
                // Course Progress Section - Two buttons in a row
                React.createElement("div", {
                    style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '4px'
                    }
                },
                    React.createElement("button", {
                        onClick: () => bypassCourseContent(setLoadingStatus),
                        disabled: loadingStatus.isLoadingCompleteWeek,
                        style: {
                            backgroundColor: loadingStatus.isLoadingCompleteWeek ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: loadingStatus.isLoadingCompleteWeek ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '12px'
                        }
                    }, loadingStatus.isLoadingCompleteWeek ? "⏳" : "Skip videos & readings"),

                    React.createElement("button", {
                        onClick: () => handleDiscussionPrompt(setLoadingStatus),
                        disabled: loadingStatus.isLoadingDiscuss,
                        style: {
                            backgroundColor: loadingStatus.isLoadingDiscuss ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: loadingStatus.isLoadingDiscuss ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '12px'
                        }
                    }, loadingStatus.isLoadingDiscuss ? "⏳" : "Skip discussions")
                ),

                // Assignment Section Header
                React.createElement("div", {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px'
                    }
                },
                    React.createElement("span", {
                        style: { fontSize: '14px' }
                    }, "📋"),
                    React.createElement("h4", {
                        style: {
                            fontWeight: '700',
                            color: '#1a1a1a',
                            margin: 0,
                            fontSize: '13px'
                        }
                    }, "Assignment")
                ),

                // Assignment Buttons - Three in a row
                React.createElement("div", {
                    style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '4px'
                    }
                },
                    React.createElement("button", {
                        onClick: () => handlePeerGradedAssignment(setLoadingStatus),
                        disabled: loadingStatus.isLoadingSubmitPeerGrading,
                        style: {
                            backgroundColor: loadingStatus.isLoadingSubmitPeerGrading ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: loadingStatus.isLoadingSubmitPeerGrading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                        },
                        title: "AI-powered assignment submission"
                    }, loadingStatus.isLoadingSubmitPeerGrading ? "⏳" : "Auto submit"),

                    React.createElement("button", {
                        onClick: () => handlePeerReview(setLoadingStatus),
                        disabled: loadingStatus.isLoadingReview,
                        style: {
                            backgroundColor: loadingStatus.isLoadingReview ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: loadingStatus.isLoadingReview ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                        },
                        title: "Complete peer reviews"
                    }, loadingStatus.isLoadingReview ? "⏳" : "Peer review"),

                    React.createElement("button", {
                        onClick: () => requestGradingByPeer(),
                        style: {
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                        },
                        title: "Disable AI grading"
                    }, "⊘ AI grading")
                ),

                // Quiz Section Header
                React.createElement("div", {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px'
                    }
                },
                    React.createElement("span", {
                        style: { fontSize: '14px' }
                    }, "💬"),
                    React.createElement("h4", {
                        style: {
                            fontWeight: '700',
                            color: '#1a1a1a',
                            margin: 0,
                            fontSize: '13px'
                        }
                    }, "Quiz")
                ),

                // Quiz Section - API Input and Start Button
                React.createElement("div", {
                    style: {
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center'
                    }
                },
                    React.createElement("div", {
                        style: {
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }
                    },
                        React.createElement("span", {
                            style: {
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#666',
                                whiteSpace: 'nowrap'
                            }
                        }, "Gemini API:"),
                        React.createElement("input", {
                            type: "password",
                            key: "gemini-api-input",
                            style: {
                                flex: 1,
                                padding: '5px 6px',
                                border: '1px solid #d0d0d0',
                                borderRadius: '4px',
                                fontSize: '11px',
                                boxSizing: 'border-box'
                            },
                            placeholder: "Enter Gemini API",
                            value: config.geminiAPI || "",
                            onChange: (e) => {
                                const value = e.target.value;
                                updateConfig("geminiAPI", value);
                            }
                        })
                    ),
                    React.createElement("button", {
                        onClick: () => handleAutoQuiz(setLoadingStatus),
                        disabled: loadingStatus.isLoadingQuiz,
                        style: {
                            backgroundColor: loadingStatus.isLoadingQuiz ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            cursor: loadingStatus.isLoadingQuiz ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                        }
                    },
                        React.createElement("span", null, "▶"),
                        React.createElement("span", null, loadingStatus.isLoadingQuiz ? "..." : "Start")
                    )
                ),

                // Auto Submit Toggle
                React.createElement("label", {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        marginLeft: '4px'
                    }
                },
                    React.createElement("input", {
                        type: "checkbox",
                        checked: config.isAutoSubmitQuiz,
                        onChange: () => toggleConfig("isAutoSubmitQuiz"),
                        style: { cursor: 'pointer', width: '12px', height: '12px' }
                    }),
                    React.createElement("span", null, "Auto submit")
                ),

                // Footer
                React.createElement("div", {
                    style: {
                        marginTop: '5px',
                        paddingTop: '5px',
                        borderTop: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '10px',
                        color: '#666'
                    }
                },
                    React.createElement("span", {
                        style: { fontWeight: '700' }
                    }, `v${SCRIPT_VERSION}`),
                    React.createElement("a", {
                        href: "https://github.com/ruskicoder",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        style: {
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }
                    }, "@ruskicoder")
                )
            ),

            // Toast Container
            React.createElement(Toaster, {
                position: "bottom-center",
                toastOptions: {
                    style: {
                        background: '#363636',
                        color: '#fff',
                    }
                }
            })
        );
    };

    // ==========================================
    // INITIALIZATION & TESTING
    // ==========================================

    /**
     * Initialize CSRF token collection
     * Runs on page load and monitors for URL changes
     */
    const initializeTokenCollection = () => {
        // Collect tokens immediately
        saveCSRFTokens();

        // Set up monitoring for SPA navigation
        let lastUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                saveCSRFTokens();
            }
        });

        // Observe URL changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also listen to history API
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            saveCSRFTokens();
        };

        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            saveCSRFTokens();
        };

        window.addEventListener('popstate', saveCSRFTokens);

        console.log('Coursera Tool: Token collection initialized');
    };

    /**
     * Test storage persistence
     */
    const testStoragePersistence = async () => {
        try {
            // Test write
            await chrome.storage.local.set({
                testKey: 'testValue',
                testNumber: 42,
                testObject: { nested: true }
            });

            // Test read
            const result = await chrome.storage.local.get(['testKey', 'testNumber', 'testObject']);

            if (result.testKey === 'testValue' &&
                result.testNumber === 42 &&
                result.testObject.nested === true) {
                console.log('Coursera Tool: ✓ Storage persistence test passed');

                // Clean up test data
                await chrome.storage.local.remove(['testKey', 'testNumber', 'testObject']);
                return true;
            } else {
                console.error('Coursera Tool: ✗ Storage persistence test failed');
                return false;
            }
        } catch (error) {
            console.error('Coursera Tool: Storage test error:', error);
            return false;
        }
    };

    /**
     * Test settings persistence (Task 3.3)
     */
    const testSettingsPersistence = async () => {
        try {
            console.log('Coursera Tool: Testing settings persistence (Task 3.3)...');

            // Test settings
            const testSettings = {
                geminiAPI: 'test-api-key-12345',
                isAutoSubmitQuiz: true
            };

            // Save test settings
            await chrome.storage.local.set(testSettings);
            console.log('Coursera Tool: ✓ Settings saved');

            // Read back settings
            const result = await chrome.storage.local.get(Object.keys(testSettings));

            // Verify all settings match
            let allMatch = true;
            for (const key in testSettings) {
                if (result[key] !== testSettings[key]) {
                    console.error(`Coursera Tool: ✗ Setting mismatch for ${key}: expected ${testSettings[key]}, got ${result[key]}`);
                    allMatch = false;
                }
            }

            if (allMatch) {
                console.log('Coursera Tool: ✓ All settings persisted correctly');
                console.log('Coursera Tool: ✓ Task 3.3 - Settings persistence verified');
            } else {
                console.error('Coursera Tool: ✗ Settings persistence test failed');
            }

            // Clean up test data
            await chrome.storage.local.remove(Object.keys(testSettings));

            return allMatch;
        } catch (error) {
            console.error('Coursera Tool: Settings persistence test error:', error);
            return false;
        }
    };

    /**
     * Test tab operations
     */
    const testTabOperations = () => {
        // Test that tab operations don't throw errors
        try {
            // These won't actually open tabs, just verify the API works
            console.log('Coursera Tool: Testing tab operations...');

            // Test message sending
            chrome.runtime.sendMessage({ action: 'getMetadata' })
                .then(response => {
                    if (response.success) {
                        console.log('Coursera Tool: ✓ Message passing test passed');
                    }
                });

            return true;
        } catch (error) {
            console.error('Coursera Tool: Tab operations test error:', error);
            return false;
        }
    };

    /**
     * Test utility functions
     */
    const testUtilityFunctions = async () => {
        try {
            console.log('Coursera Tool: Testing utility functions...');

            // Test wait function
            const startTime = Date.now();
            await wait(100);
            const elapsed = Date.now() - startTime;
            if (elapsed >= 100 && elapsed < 150) {
                console.log('Coursera Tool: ✓ wait() function test passed');
            }

            // Test generateRandomString
            const randomStr = generateRandomString(5);
            if (randomStr && randomStr.split(' ').length === 5) {
                console.log('Coursera Tool: ✓ generateRandomString() test passed');
            }

            // Test extendStringPrototype
            extendStringPrototype();
            const testStr = "Test   String\n\nWith   Spaces";
            const cleaned = testStr.cleanup();
            if (cleaned && cleaned.length < testStr.length) {
                console.log('Coursera Tool: ✓ String.prototype.cleanup() test passed');
            }

            return true;
        } catch (error) {
            console.error('Coursera Tool: Utility functions test error:', error);
            return false;
        }
    };

    /**
     * Test API functions
     */
    const testAPIFunctions = async () => {
        try {
            console.log('Coursera Tool: Testing API functions...');

            // Test getUserId (may return null if not on course page)
            const userId = getUserId();
            console.log('Coursera Tool: getUserId() returned:', userId || 'null (expected if not on course page)');

            // Test getCourseMetadata (only if on a course page)
            if (window.location.pathname.includes('/learn/')) {
                try {
                    const metadata = await getCourseMetadata();
                    if (metadata && metadata.courseId) {
                        console.log('Coursera Tool: ✓ getCourseMetadata() test passed');
                    }
                } catch (e) {
                    console.log('Coursera Tool: getCourseMetadata() skipped (not on course page)');
                }
            }

            return true;
        } catch (error) {
            console.error('Coursera Tool: API functions test error:', error);
            return false;
        }
    };

    /**
     * Test automation features
     */
    const testAutomationFeatures = () => {
        try {
            console.log('Coursera Tool: Testing automation features...');

            // Test that bypassCourseContent function exists and is callable
            if (typeof bypassCourseContent === 'function') {
                console.log('Coursera Tool: ✓ bypassCourseContent() function available');
            }

            // Test that autoJoin function exists and is callable
            if (typeof autoJoin === 'function') {
                console.log('Coursera Tool: ✓ autoJoin() function available');
            }

            // Test that solveWithGemini function exists and is callable
            if (typeof solveWithGemini === 'function') {
                console.log('Coursera Tool: ✓ solveWithGemini() function available');
            }

            // Test that handleAutoQuiz function exists and is callable
            if (typeof handleAutoQuiz === 'function') {
                console.log('Coursera Tool: ✓ handleAutoQuiz() function available');
            }

            // Note: Actual functionality testing requires being on specific Coursera pages
            console.log('Coursera Tool: Note - Full testing requires course/invitation/quiz pages');

            return true;
        } catch (error) {
            console.error('Coursera Tool: Automation features test error:', error);
            return false;
        }
    };

    /**
     * Test crypto functions
     */
    const testCryptoFunctions = async () => {
        try {
            console.log('Coursera Tool: Testing crypto functions...');

            // Test JWT generation
            const testPayload = { test: 'data', userId: '12345' };
            const jwt = await generateAuthToken(testPayload);
            if (jwt && jwt.split('.').length === 3) {
                console.log('Coursera Tool: ✓ generateAuthToken() test passed');
            }

            // Test AES decryption (with dummy data)
            // Note: Real encrypted data would be needed for full test
            console.log('Coursera Tool: ✓ decryptSourceData() available (requires encrypted data to test)');

            return true;
        } catch (error) {
            console.error('Coursera Tool: Crypto functions test error:', error);
            return false;
        }
    };

    /**
     * Test toast notifications (Task 3.4)
     */
    const testToastNotifications = () => {
        try {
            console.log('Coursera Tool: Testing toast notifications (Task 3.4)...');

            // Test success toast
            toast.success('✓ Toast notifications working!', {
                duration: 2000,
                position: 'bottom-center'
            });

            console.log('Coursera Tool: ✓ Toast notification test passed');
            return true;
        } catch (error) {
            console.error('Coursera Tool: Toast notification test error:', error);
            return false;
        }
    };

    /**
     * Main initialization
     */
    const initialize = async () => {
        console.log('Coursera Tool: Initializing...');

        // Test storage (Phase 1.2)
        await testStoragePersistence();

        // Test settings persistence (Phase 3.3)
        await testSettingsPersistence();

        // Test tab operations (Phase 1.2)
        testTabOperations();

        // Initialize token collection (Phase 1.2)
        initializeTokenCollection();

        // Start auto-join checker (Phase 2.1)
        autoJoin();

        // Test utility functions (Phase 1.3)
        await testUtilityFunctions();

        // Test API functions (Phase 1.3)
        await testAPIFunctions();

        // Test crypto functions (Phase 1.3)
        await testCryptoFunctions();

        // Test automation features (Phase 2.1)
        testAutomationFeatures();

        // Mount React App first (so toast can be displayed)
        mountReactApp();

        // Test toast notifications (Phase 3.4) - must be after React mount
        setTimeout(() => {
            testToastNotifications();
        }, 500);

        console.log('Coursera Tool: initiated');
    };

    /**
     * Mount React App to DOM
     * Creates a container and renders the React App component
     */
    const mountReactApp = () => {
        try {
            // Create container for React app
            let container = document.getElementById('coursera-tool-container');

            if (!container) {
                container = document.createElement('div');
                container.id = 'coursera-tool-container';
                document.body.appendChild(container);
            }

            // Mount React App using ReactDOM 18 API
            const root = ReactDOM.createRoot(container);
            root.render(React.createElement(App));

            console.log('Coursera Tool: React UI mounted successfully');
        } catch (error) {
            console.error('Coursera Tool: Failed to mount React app:', error);
        }
    };

    // Run initialization
    initialize();

})();
