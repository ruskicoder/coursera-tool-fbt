# Coursera Tool - Clean Version 1.0.5.9

## Changes Made

This is a cleaned version of the Coursera Tool extension with **all Mellowtel tracking completely removed** while preserving the original Coursera automation functionality.

### Removed Files:
- `meucci.js` - Mellowtel tracking module
- `pascoli.js` - Mellowtel tracking module  
- `pascoli.html` - Mellowtel tracking HTML
- `assets/mellowtel.js-loader-7f755009.js` - Mellowtel loader
- `assets/chunk-42f35756.js` - Chunk containing Mellowtel code
- `assets/chunk-56e24f4a.js` - Chunk containing Mellowtel code
- `assets/chunk-c2fba610.js` - Service worker chunk with Mellowtel code

### Modified Files:

#### `manifest.json`
- Removed Mellowtel content script that ran on all URLs
- Reduced host permissions to only `https://www.coursera.org/*`
- Removed Mellowtel-related web accessible resources
- Kept only Coursera-specific functionality

#### `popup.html` & `popup.js`
- Replaced Mellowtel settings button with clean UI
- Removed all Mellowtel integration code
- Added simple status message for users

#### `service-worker-loader.js`
- Completely rewritten to only handle Coursera functionality
- Removed all Mellowtel tracking and data collection
- Kept CSRF token collection for Coursera functionality
- Kept tab management for extension features

#### `assets/chunk-97f40ce3.js`
- Cleaned package.json dependencies to remove Mellowtel packages
- Removed: `@mellowtel/module-meucci`, `@mellowtel/module-pascoli`, `mellowtel`
- Kept all other dependencies needed for React UI and Coursera functionality

### Preserved Functionality:
✅ Coursera video/reading bypass  
✅ Auto quiz completion  
✅ Auto assignment submission  
✅ Auto grade reviews  
✅ Shareable links generation  
✅ CSRF token handling  
✅ Tab management  

### Removed Functionality:
❌ All Mellowtel data collection  
❌ Background tracking  
❌ External API calls to Mellowtel services  
❌ User behavior monitoring  
❌ Speed testing  
❌ WebSocket connections to Mellowtel  

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" 
4. Select the `1.0.5.9` folder
5. The extension is now installed and ready to use on Coursera

## Verification

You can verify that Mellowtel has been completely removed by:
1. Checking the Network tab in DevTools - no connections to `mellow.tel` domains
2. Reviewing the extension's permissions - only accesses Coursera.org
3. Examining the source code - no Mellowtel references remain

This clean version maintains all the educational automation features while completely eliminating any tracking or data collection components.