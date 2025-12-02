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

### Phase 4: Complete Function Flow Adaptation

**Goal:** Implement all remaining functions from function-flow.txt with full AI-powered assignment handling

- [ ] 4.1 Complete UI with method selection and all buttons
  - Add "Get URL" button → handleReview()
  - Add "Disable AI" button → requestGradingByPeer()
  - Update "Auto Grade" button → AI-powered handlePeerGradedAssignment()
  - Store selected method and course in settings with proper loading states
  - _Requirements: Complete UI with all automation features from function-flow.txt_

- [ ] 4.2 Implement AI-powered assignment automation
  - Extract assignment instructions from DOM (div[data-testid="peer-assignment-instructions"]) and form fields
  - Parse "Grading Criteria Overview" and "Step-By-Step Assignment Instructions" sections
  - Use Gemini AI to generate contextual answers (under 50 characters per field as per assignment-flow.txt)
  - Fill text fields (contenteditable divs and textareas) with AI-generated content
  - Handle intelligent file uploads (detect accept attribute, generate appropriate dummy files)
  - Submit assignment with confirmation
  - _Requirements: AI-powered assignment completion from function-flow.txt and assignment-flow.txt_

- [ ] 4.3 Implement assignment utility functions
  - Create requestGradingByPeer() to disable AI grading via GraphQL mutation with "EXPECTED_HIGHER_SCORE" reason
  - Create handleReview() to get shareable URL (switch to "My Submission" tab, trigger share modal, copy link)
  - Create triggerShareModal() helper (find/click Share button, handle modal, extract link)
  - _Requirements: Assignment management functions from function-flow.txt_

- [ ] 4.4 Implement Source Database solver with encryption
  - Create decryptSourceData() using Web Crypto API for AES-CBC decryption (handle base64, extract IV)
  - Create fetchAnswersFromSource() to fetch and decrypt course-specific answer data
  - Create doWithSource() to match questions to answers, apply to form inputs, add visual badges
  - Create getSource() to check database access, fetch course map, validate user access
  - _Requirements: Alternative quiz solver using encrypted database from function-flow.txt_

- [ ] 4.5 Enhance quiz automation with full navigation
  - Add "Start" button detection and clicking
  - Implement question navigation with "Next" button handling and index tracking ("Question 1 of 10")
  - Loop through all questions until completion
  - Handle "Continue" button for resumed attempts
  - Verify all questions answered before submission
  - _Requirements: Complete quiz automation with navigation from function-flow.txt_

- [ ] 4.6 Add comprehensive error handling and testing
  - Wrap all API calls in try-catch blocks with user-friendly toast messages
  - Implement retry logic for network failures and rate limiting
  - Test all automation features on live Coursera pages (AI assignments, quiz solving with both methods, peer reviews, discussions)
  - Verify settings persistence across page reloads
  - _Requirements: Robust error handling and end-to-end testing from function-flow.txt_ 


