# Implementation Plan: Coursera Extension → Tampermonkey Userscript Conversion

## Goal
Convert the deobfuscated Coursera Chrome extension into a fully-functional Tampermonkey userscript with 100% feature parity.

## Analysis Summary
**Extension Features Identified:**
- Video/Reading bypass automation
- Quiz auto-solver (Gemini AI + Source Database)
- Peer review automation
- Assignment auto-submission
- Discussion prompt automation
- React-based UI control panel
- CSRF token handling via service worker
- Authentication/telemetry system

**Conversion Feasibility: ✅ FULLY POSSIBLE**
- All chrome.* APIs have GM_* equivalents
- Background script functionality can be replicated in page context
- React UI can be bundled or loaded via CDN
- Cookie/storage access is simpler in userscript context

## Implementation Phases

### Phase 1: Foundation & Infrastructure Setup
**Goal:** Create the basic userscript structure with all dependencies and API replacements

- [x] 1.1 Create Tampermonkey metadata block and dependencies
  - Add @name, @version, @description, @namespace, @author
  - Configure @match for `https://www.coursera.org/*`
  - Set @grant permissions: GM_setValue, GM_getValue, GM_deleteValue, GM_xmlhttpRequest, GM_openInTab, GM_addStyle, window.close
  - Add @require for React 18.x, ReactDOM, react-hot-toast (CDN)
  - Set @run-at document-end
  - Set up IIFE wrapper for scope isolation
  - Add Coursera domain check
  - _Requirements: Metadata enables all APIs, React loads correctly, clean code structure_

- [x] 1.2 Replace all Chrome Extension APIs with Tampermonkey equivalents
  - Replace chrome.storage.local.get/set() → GM_getValue/setValue()
  - Replace chrome.storage.sync → GM_getValue/setValue()
  - Replace chrome.runtime.sendMessage (openTab) → GM_openInTab()
  - Replace chrome.runtime.sendMessage (closeTab) → window.close()
  - Replace chrome.cookies.get() → document.cookie parsing
  - Create getCookie() helper function
  - Remove chrome.runtime.getURL() and dynamic imports
  - Test storage persistence and tab operations
  - _Requirements: All Chrome APIs replaced, CSRF tokens accessible, single-file structure_

- [x] 1.3 Port all core utility and API functions
  - Copy wait(), waitForSelector(), generateRandomString(), extendStringPrototype()
  - Copy getAuthDetails(), getCourseMetadata(), getUserId()
  - Copy generateAuthToken() (JWT), decryptSourceData() (AES-CBC)
  - Replace fetch() with GM_xmlhttpRequest for CORS-restricted calls
  - Test all utilities in userscript context
  - Test Web Crypto API functionality
  - _Requirements: All helpers operational, API calls work with CORS, crypto functions work_

### Phase 2: Core Automation Features Implementation
**Goal:** Port all main automation features (bypass, quiz, assignments, reviews)

- [x] 2.1 Implement content bypass and auto-join features
  - Copy bypassCourseContent() function
  - Copy autoJoin() function
  - Test video completion API calls
  - Test reading completion API calls
  - Test course invitation auto-accept
  - Verify course progress updates correctly
  - _Requirements: Videos/readings marked complete, auto-join works_

- [x] 2.2 Implement quiz automation (Gemini AI solver)
  - Copy solveWithGemini() function
  - Copy handleAutoQuiz() function
  - Test question extraction from DOM
  - Test answer application to form inputs (radio, checkbox, textarea)
  - Test Gemini API integration
  - Test auto-submit functionality
  - _Requirements: Gemini solver works for all question types, auto-submit works_

- [x] 2.3 Implement quiz automation (Source Database solver)
  - Copy fetchAnswersFromSource() function
  - Copy doWithSource() function
  - Copy addBadgeToLabel() for visual feedback
  - Test encrypted data decryption
  - Test answer matching logic
  - Test visual badge application
  - _Requirements: Source database solver works, badges appear_

- [x] 2.4 Implement assignment and review automation
  - Copy handlePeerReview() function
  - Copy handlePeerAssignmentSubmission() function
  - Copy handleDiscussionPrompt() function
  - Copy requestGradingByPeer() function
  - Test review form detection and automated grading
  - Test file upload handling and text generation
  - Test forum posting with Gemini responses
  - Test peer grading request API
  - _Requirements: All assignment/review features functional_

### Phase 3: React UI & Styling Implementation
**Goal:** Build the complete user interface with React components and styling

- [x] 3.1 Create React App component and state management
  - Port the main App component from deobfuscated code
  - Set up useState hooks for loading status
  - Set up useState hooks for settings (API keys, toggles)
  - Create floating panel container with positioning
  - Add minimize/maximize functionality
  - Add draggable positioning logic
  - _Requirements: React app renders, state management works, panel appears_

- [x] 3.2 Build control panel UI with all feature buttons
  - Add "Complete Week" button → bypassCourseContent()
  - Add "Solve Quiz (Gemini)" button → handleAutoQuiz()
  - Add "Solve Quiz (Source)" button → doWithSource()
  - Add "Auto Review" button → handlePeerReview()
  - Add "Submit Assignment" button → handlePeerAssignmentSubmission()
  - Add "Discussion Prompts" button → handleDiscussionPrompt()
  - Wire all buttons to their respective functions
  - _Requirements: All buttons present and functional_

- [x] 3.3 Create settings panel with persistence
  - Add Gemini API key input field
  - Add auto-submit quiz toggle
  - Add feature enable/disable toggles
  - Implement save settings → GM_setValue()
  - Implement load settings → GM_getValue()
  - Test settings persistence across page reloads
  - _Requirements: Settings UI works, data persists_

- [x] 3.4 Integrate toast notifications and styling
  - Port react-hot-toast Toaster component
  - Test success/error/loading toasts
  - Copy all CSS from index-9d9833a5.css
  - Use GM_addStyle() to inject Tailwind CSS
  - Copy rotation animation keyframes
  - Copy toast styles and progress bar styles
  - Test UI rendering with all styles
  - _Requirements: Toasts work, UI styled correctly_

### Phase 4: Initialization, Utilities & Polish
**Goal:** Complete initialization logic, footer cleaner, and final touches

- [ ] 4.1 Implement initialization and page navigation handling
  - Create main initialization function
  - Check for Coursera domain
  - Create React root container and mount app
  - Start footer cleaner
  - Start auto-join checker
  - Listen for Coursera SPA navigation events (popstate, pushstate, replacestate)
  - Re-run initialization on navigation if needed
  - _Requirements: Userscript initializes correctly, works with SPA navigation_

- [ ] 4.2 Port footer link cleaner and misc utilities
  - Copy the self-invoking footer cleanup function
  - Test link redirection to source code
  - Test spam link removal (Facebook links)
  - Set up MutationObserver for dynamic content
  - Copy appendNotSupported() for text inputs
  - Copy collectUnmatchedQuestion() for crowdsourcing
  - _Requirements: Footer links cleaned, utilities work_

- [ ] 4.3 Add optimization and error handling
  - Optimize bundle size (remove unused code)
  - Add console logging (version on load, debug logs)
  - Wrap React app in error boundary
  - Handle React errors gracefully
  - Test error handling with missing API key
  - Test error handling with network errors
  - _Requirements: Optimized, debuggable, graceful error handling_

### Phase 5: Comprehensive Testing & Validation
**Goal:** Test all features end-to-end on actual Coursera pages

- [ ] 5.1 Test quiz automation features
  - Test Gemini solver on quiz pages
  - Test Source solver on quiz pages
  - Test answer application for all question types
  - Test auto-submit functionality
  - Test with missing API key (error handling)
  - _Requirements: Quiz automation works end-to-end_

- [ ] 5.2 Test content bypass and assignment features
  - Test video/reading bypass on course pages
  - Verify progress updates correctly
  - Test peer review automation
  - Test assignment submission
  - Test discussion prompt automation
  - Verify forum posts appear
  - _Requirements: All content features work_

- [ ] 5.3 Test UI and cross-browser compatibility
  - Test all buttons in control panel
  - Test settings persistence
  - Test panel dragging/minimizing
  - Test in Chrome + Tampermonkey
  - Test in Firefox + Tampermonkey/Greasemonkey
  - Test in Edge + Tampermonkey
  - _Requirements: UI fully functional, works in all browsers_

- [ ] 5.4 Validate feature parity and create release
  - Verify all extension features work in userscript
  - Compare behavior side-by-side with extension
  - Clean up code comments
  - Add version number and metadata
  - Create final userscript file
  - _Requirements: 100% feature parity, production-ready_

### Phase 6: Documentation & Delivery
**Goal:** Create comprehensive documentation for users

- [ ] 6.1 Create user documentation
  - Document Tampermonkey installation steps
  - Document userscript installation steps
  - Document Gemini API key setup process
  - Document each feature and how to use it
  - Add screenshots of UI and features
  - Document all settings options
  - _Requirements: Clear installation and usage docs_

- [ ] 6.2 Create troubleshooting and ethical guidelines
  - List common issues and solutions
  - Explain how to check console for errors
  - Explain how to report bugs
  - Add ethical usage disclaimer
  - Explain academic integrity concerns
  - Recommend responsible usage
  - Clarify educational purposes
  - _Requirements: Users can troubleshoot, ethical considerations addressed_

## Technical Notes

### Chrome API → Tampermonkey Mapping
```javascript
// Storage
chrome.storage.local.get()  → GM_getValue()
chrome.storage.local.set()  → GM_setValue()

// Tabs
chrome.tabs.create()        → GM_openInTab()
chrome.tabs.remove()        → window.close()

// Cookies
chrome.cookies.get()        → document.cookie parsing

// Network
fetch() with CORS issues    → GM_xmlhttpRequest()

// Runtime
chrome.runtime.getURL()     → Not needed (single file)
chrome.runtime.sendMessage()→ Direct function calls
```

### Required @grant Permissions
```javascript
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        window.close
```

### Dependency Strategy
**Option A: CDN @require (Recommended)**
```javascript
// @require      https://unpkg.com/react@18/umd/react.production.min.js
// @require      https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
// @require      https://unpkg.com/react-hot-toast@2/dist/index.umd.js
```

**Option B: Inline Bundle**
- Bundle React + ReactDOM + toast library inline
- Larger file size but no external dependencies

## Success Criteria
- ✅ All 7 main features working (bypass, quiz, review, assignment, discussion, auto-join, link cleaner)
- ✅ React UI panel functional with all buttons
- ✅ Settings persist across sessions
- ✅ CSRF tokens extracted and used correctly
- ✅ Gemini AI integration working
- ✅ Source database integration working
- ✅ No console errors during normal operation
- ✅ Works on all Coursera page types
- ✅ Complete documentation provided
