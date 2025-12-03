# Requirements Document

## Introduction

This document specifies the requirements for a Coursera automation userscript that provides automated completion of course content including videos, readings, quizzes, assignments, peer reviews, and discussion prompts. The system must adapt to Coursera's anti-skip measures by using video playback speed manipulation instead of direct position jumping.

## Glossary

- **Userscript**: A JavaScript program that runs in the browser via Tampermonkey/Greasemonkey to modify web page behavior
- **Video Speed Method**: A technique to complete videos by setting playback rate to extremely high values (2000x+) instead of directly skipping to the end
- **CSRF Token**: Cross-Site Request Forgery token required for authenticated API requests
- **Eventing API**: Coursera's telemetry endpoint that tracks user interactions including playback rate changes
- **Video Position**: Current playback timestamp in seconds
- **Video Duration**: Total length of video content in seconds
- **Playback Rate**: Video speed multiplier (1.0 = normal, 2.0 = 2x speed, 2000+ = extreme speed)

## Requirements

### Requirement 1: Video Completion via Speed Method

**User Story:** As a user, I want to complete video lectures automatically using speed manipulation, so that I can bypass Coursera's anti-skip detection while still marking videos as watched.

#### Acceptance Criteria

1. WHEN a video completion is requested THEN the system SHALL set the video position to 0 seconds (beginning)
2. WHEN the video position is at 0 seconds THEN the system SHALL send a playback rate change event to the Eventing API with playbackRate set to 2000 or higher
3. WHEN the playback rate change is confirmed THEN the system SHALL allow the video to play at extreme speed until reaching the end
4. WHEN the video reaches its duration endpoint THEN the system SHALL send a completion request to mark the video as finished
5. WHEN sending the playback rate event THEN the system SHALL include all required telemetry data (videoId, courseId, videoPosition, videoDuration, userId, deviceId)

### Requirement 2: Eventing API Integration

**User Story:** As a developer, I want to properly integrate with Coursera's Eventing API, so that video speed changes are tracked and accepted by the platform.

#### Acceptance Criteria

1. WHEN sending an eventing request THEN the system SHALL use the endpoint `https://www.coursera.org/api/rest/v1/eventing/info`
2. WHEN constructing the payload THEN the system SHALL include the key `eventingv3.click_button` with button name `video_playback_rate_switcher`
3. WHEN including video player data THEN the system SHALL provide videoId, courseId, courseName, courseSlug, lessonId, moduleId, videoDuration, videoPosition, and playbackRate
4. WHEN setting playback rate THEN the system SHALL use a value of 2000 or higher to achieve instant completion
5. WHEN the request completes successfully THEN the system SHALL proceed with video completion marking

### Requirement 3: Video Metadata Extraction

**User Story:** As a user, I want the system to automatically extract video metadata, so that completion requests contain accurate information.

#### Acceptance Criteria

1. WHEN a video page is loaded THEN the system SHALL extract the videoId from the URL or page data
2. WHEN processing a video THEN the system SHALL retrieve the video duration in seconds
3. WHEN extracting course information THEN the system SHALL obtain courseId, courseName, and courseSlug
4. WHEN identifying lesson context THEN the system SHALL extract lessonId, lessonName, moduleId, and moduleName
5. WHEN all metadata is collected THEN the system SHALL validate that required fields are present before proceeding

### Requirement 4: Sequential Request Flow

**User Story:** As a developer, I want to ensure requests are sent in the correct sequence, so that Coursera's validation logic accepts the video completion.

#### Acceptance Criteria

1. WHEN starting video completion THEN the system SHALL first send a position request setting videoPosition to 0
2. WHEN the position is set to 0 THEN the system SHALL send the playback rate change event
3. WHEN the playback rate event is sent THEN the system SHALL wait for the video to naturally progress to the end at extreme speed
4. WHEN the video reaches the end THEN the system SHALL send the final completion request
5. WHEN any request fails THEN the system SHALL abort the sequence and report the error

### Requirement 5: Reading Completion

**User Story:** As a user, I want to complete reading materials automatically, so that I can progress through course content efficiently.

#### Acceptance Criteria

1. WHEN a reading completion is requested THEN the system SHALL use the endpoint `onDemandSupplementCompletions.v1`
2. WHEN marking a reading complete THEN the system SHALL send proper authorization via GraphQL LearningHours_SendEvent mutation
3. WHEN the authorization succeeds THEN the system SHALL mark the reading as complete
4. WHEN the completion request succeeds THEN the system SHALL update the user's progress
5. WHEN any request fails THEN the system SHALL retry once before reporting failure

### Requirement 6: Quiz Automation

**User Story:** As a user, I want to automatically solve quizzes using AI, so that I can complete assessments without manual effort.

#### Acceptance Criteria

1. WHEN a quiz page is detected THEN the system SHALL extract all questions and answer options
2. WHEN questions are extracted THEN the system SHALL send them to Gemini AI for solving
3. WHEN AI responses are received THEN the system SHALL apply answers to the appropriate form inputs (radio, checkbox, textarea)
4. WHEN all questions are answered THEN the system SHALL submit the quiz automatically if auto-submit is enabled
5. WHEN quiz submission completes THEN the system SHALL display the result to the user

### Requirement 7: Assignment Automation

**User Story:** As a user, I want to automatically complete peer-graded assignments using AI, so that I can submit work without manual writing.

#### Acceptance Criteria

1. WHEN an assignment page is detected THEN the system SHALL extract assignment instructions and grading criteria
2. WHEN instructions are extracted THEN the system SHALL use Gemini AI to generate contextual responses under 50 characters per field
3. WHEN AI responses are generated THEN the system SHALL fill all text fields using React-compatible input methods
4. WHEN file uploads are required THEN the system SHALL generate and upload appropriate dummy files based on accept attributes
5. WHEN all fields are filled THEN the system SHALL submit the assignment with confirmation

### Requirement 8: Peer Review Automation

**User Story:** As a user, I want to automatically complete peer reviews, so that I can fulfill review requirements efficiently.

#### Acceptance Criteria

1. WHEN a peer review page is detected THEN the system SHALL repeat the review process 5 times
2. WHEN reviewing a submission THEN the system SHALL select the first radio option (highest score) for all criteria
3. WHEN providing feedback THEN the system SHALL use React-compatible textarea filling with simulated typing
4. WHEN all review fields are completed THEN the system SHALL click the submit button
5. WHEN submission completes THEN the system SHALL proceed to the next review until 5 are completed

### Requirement 9: User Interface

**User Story:** As a user, I want a floating control panel with buttons for all automation features, so that I can easily trigger desired actions.

#### Acceptance Criteria

1. WHEN the userscript loads on Coursera THEN the system SHALL display a draggable floating panel
2. WHEN the panel is displayed THEN the system SHALL show buttons for all automation features (Complete Week, Solve Quiz, Auto Review, Submit Assignment, Discussion Prompts)
3. WHEN a button is clicked THEN the system SHALL execute the corresponding automation function
4. WHEN operations complete THEN the system SHALL display toast notifications with success or error messages
5. WHEN the panel is minimized THEN the system SHALL collapse to a small icon that can be clicked to restore

### Requirement 10: Settings Management

**User Story:** As a user, I want to configure API keys and feature toggles, so that I can customize the automation behavior.

#### Acceptance Criteria

1. WHEN the settings panel is opened THEN the system SHALL display input fields for Gemini API key and feature toggles
2. WHEN settings are modified THEN the system SHALL save them using GM_setValue for persistence
3. WHEN the page reloads THEN the system SHALL restore saved settings using GM_getValue
4. WHEN API keys are missing THEN the system SHALL prompt the user before attempting AI operations
5. WHEN settings are saved THEN the system SHALL display a confirmation message
