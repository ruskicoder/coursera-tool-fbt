# Coursera Tool FBT - Clean Extension

An automation tool that does Coursera courses automatically. This is a **cleaned version** with all tracking removed and FPT source functionality enabled.

## Features

- **Complete Coursera Automation**: Auto-submit quizzes, assignments, reviews, and skip videos/readings
- **FPT Source Integration**: Access to the FPT (Free Public Tool) database for enhanced question coverage
- **Privacy Focused**: All Mellowtel tracking completely removed
- **Multiple AI Sources**: Support for Gemini AI and FPT source databases

## Available Versions

### Version 1.0.5.10 (Latest)
- **Status**: ✅ Clean and Enhanced
- **FPT Source**: ✅ Enabled (previously hidden)
- **Mellowtel Tracking**: ❌ Completely Removed
- **Features**: Full Coursera automation with access to pear104.github.io FPT databases

### Version 1.0.5.9 
- **Status**: ✅ Clean
- **Mellowtel Tracking**: ❌ Completely Removed
- **Features**: Full Coursera automation functionality

### Version 1.0.5.4
- **Status**: ✅ Clean
- **Mellowtel Tracking**: ❌ Completely Removed
- **Features**: Basic Coursera automation

## FPT Source Database

The extension now has **permanent access** to the FPT source databases:
- `https://pear104.github.io/coursera-tool/gh-pages/courseMap.json`
- `https://pear104.github.io/fuquiz-db/` (and variations)
- `https://pear104.github.io/coursera-tool/gh-pages/metadata.json`

This functionality was previously hidden behind server-side permission checks but is now permanently enabled in the clean versions.

## Installation

1. Download the desired version folder from `coursera-tool/cpebdnelbbfbnjbdafkkcgbbgbdbhhgb/`
2. Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the version folder
5. The extension will appear in your browser toolbar

## Usage

1. Navigate to any Coursera course
2. Click the extension icon in your browser toolbar
3. Select your preferred source:
   - **Gemini**: Uses Google's Gemini AI (requires API key)
   - **Source FPT**: Uses the community-maintained FPT database
4. Use the automation features as needed

## Privacy & Security

- **No Tracking**: All Mellowtel data collection completely removed
- **No External Analytics**: Extension operates locally and with legitimate APIs only
- **Source Code**: Available for inspection and modification

## Changes Made

### Mellowtel Removal
- Removed `meucci.js` (Mellowtel tracking script)
- Removed `pascoli.js` and `pascoli.html` (Mellowtel components)
- Removed `mellowtel.js-loader` files
- Cleaned `service-worker-loader.js` files
- Updated all manifest.json files

### FPT Source Enablement (v1.0.5.10)
- Modified conditional logic in `chunk-97f40ce3.js`
- Changed `await Qn(![])` to `true` to bypass permission checks
- Enabled permanent access to "Source FPT" option in UI

## Technical Details

The FPT source functionality communicates with:
- **courseMap.json**: Course-specific question mappings
- **metadata.json**: Permission and configuration data
- **fuquiz-db**: Community question database

All network requests are made directly to the public GitHub Pages repositories, ensuring transparency and reliability.

## Disclaimer

This tool is for educational purposes. Use responsibly and in accordance with Coursera's terms of service.
