Based on the provided minified code (specifically from `chunk-97f40ce3.js`), the logic responsible for skipping videos, readings, and other ungraded materials is contained within the function aliased as **`ow`** (which corresponds to `resolveWeekMaterial` in the source logic) and its helper **`wc`** (`getAllMaterials`).

Here is the fully de-obfuscated, reconstructed code with detailed explanations.

### 1. The Core Logic: `resolveWeekMaterial`

This function iterates through the current week's course materials. It checks the type of each item (Video, Reading, LTI Plugin) and sends specific API requests to Coursera's backend to mark them as complete without the user actually interacting with them.

```javascript
/**
 * Main function to skip videos, readings, and ungraded plugins.
 * Originally 'ow' in the minified code.
 */
const resolveWeekMaterial = async () => {
    // 1. Get all course materials for the current slug (week/module)
    const {
        data: materials,
        courseId: courseId,
        slug: currentSlug
    } = await getAllMaterials(); // 'wc' function

    // 2. Extract User ID from the DOM (usually found in script tags or session data)
    // Looks for a pattern like "123456~AbCdEfGh..."
    const sessionMatch = document.querySelector("body > script:nth-child(3)")
        ?.innerText.match(/(\d+~[A-Za-z0-9-_]+)/);
    const userId = sessionMatch?.[1].split("~")[0];

    // 3. Ensure we have authentication tokens
    getSource(); // 'Qn' function (refreshes CSRF/CAUTH tokens)

    // 4. UI Notification (using react-hot-toast logic found in 'tr.promise')
    await toast.promise(async () => {
        // Iterate through all items found in the current week
        await Promise.all(materials.map(async (item) => {
            
            // --- LOGIC 1: SKIPPING VIDEOS ("lecture") ---
            if (item.contentSummary.typeName === "lecture") {
                // Construct the "Event Ended" API endpoint
                // Format: /api/onDemandLectureVideos.v1/{userId}~{courseId}~{itemId}/lecture/videoEvents/ended
                const videoEndpoint = `https://www.coursera.org/api/onDemandLectureVideos.v1/${userId}~${courseId}~${item.id}/lecture/videoEvents/ended?autoEnroll=false`;
                
                await fetch(videoEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contentRequestBody: {} // Empty body signals completion
                    })
                });
            } 
            
            // --- LOGIC 2: SKIPPING READINGS ("supplement") ---
            else if (item.contentSummary.typeName === "supplement") {
                // Endpoint for marking readings as viewed
                const supplementEndpoint = "https://www.coursera.org/api/onDemandSupplementViews.v1/";
                
                await fetch(supplementEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        courseId: courseId,
                        itemId: item.id,
                        userId: Number(userId)
                    })
                });
            } 
            
            // --- LOGIC 3: SKIPPING UNGRADED PLUGINS ("ungradedLti") ---
            // These are usually external tools or ungraded labs
            else if (item.contentSummary.typeName === "ungradedLti") {
                const ltiEndpoint = "https://www.coursera.org/api/onDemandLtiUngradedLaunches.v1/?fields=endpointUrl%2CauthRequestUrl%2CsignedProperties";
                
                await fetch(ltiEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        courseId: courseId,
                        itemId: item.id,
                        learnerId: Number(userId),
                        markItemCompleted: true // Explicit flag to mark complete
                    })
                });
            }
            
            // --- LOGIC 4: PEER REVIEWS (Placeholder Logic) ---
            // The code contains logic to handle specific progress states for peer reviews,
            // though usually this requires more user input than a simple skip.
            else if (item.contentSummary.typeName === "teammateReview" || item.contentSummary.typeName === "gradedPeer") {
                // Fetches session ID and sends a "Completed" progress state
                // This part is often risky as peer reviews require actual submission data.
                const sessionUrl = `https://www.coursera.org/api/onDemandPeerSubmissionProgresses.v1?courseId=${courseId}&userId=${userId}&itemId=${item.id}`;
                
                const response = await fetch(sessionUrl).then(res => res.json());
                const sessionId = response.elements?.[0]?.sessionId;

                if (sessionId) {
                    const progressEndpoint = `https://www.coursera.org/api/onDemandPeerSubmissionProgresses.v1/${userId}~${courseId}~${item.id}`;
                    await fetch(progressEndpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            progressState: "Completed",
                            sessionId: sessionId
                        })
                    });
                }
            }
        }));
    }, {
        loading: "Skipping Videos & Readings",
        success: "Skip Videos & Readings Completed!",
        error: "Error occurred while skipping."
    });

    // Wait slightly to ensure UI updates before reloading or proceeding
    await new Promise(resolve => setTimeout(resolve, 1000));
};
```

---

### 2. The Helper: `getAllMaterials`

This function is responsible for fetching the raw data about the course modules, lessons, and items (videos, readings) so the main function knows *what* IDs to skip.

```javascript
/**
 * Fetches course data for the current URL/Slug.
 * Originally 'wc' in the minified code.
 */
const getAllMaterials = async () => {
    // Extract the slug (e.g., "week-1") from the URL
    // location.pathname might be "/learn/course-name/home/week-1"
    const currentSlug = window.location.pathname.split("/")[4];

    // Construct the massive API URL to get all metadata for the module
    const materialsUrl = `https://www.coursera.org/api/onDemandCourseMaterials.v2/?q=slug&slug=${currentSlug}&includes=modules%2Clessons%2CpassableItemGroups%2CpassableItemGroupChoices%2CpassableLessonElements%2Citems%2Ctracks%2CgradePolicy%2CgradingParameters%2CembeddedContentMapping&fields=moduleIds%2ConDemandCourseMaterialModules.v1(name%2Cslug%2Cdescription%2CtimeCommitment%2ClessonIds%2Coptional%2ClearningObjectives)%2ConDemandCourseMaterialLessons.v1(name%2Cslug%2CtimeCommitment%2CelementIds%2Coptional%2CtrackId)%2ConDemandCourseMaterialPassableItemGroups.v1(requiredPassedCount%2CpassableItemGroupChoiceIds%2CtrackId)%2ConDemandCourseMaterialPassableItemGroupChoices.v1(name%2Cdescription%2CitemIds)%2ConDemandCourseMaterialPassableLessonElements.v1(gradingWeight%2CisRequiredForPassing)%2ConDemandCourseMaterialItems.v2(name%2CoriginalName%2Cslug%2CtimeCommitment%2CcontentSummary%2CisLocked%2ClockableByItem%2CitemLockedReasonCode%2CtrackId%2ClockedStatus%2CitemLockSummary)%2ConDemandCourseMaterialTracks.v1(passablesCount)%2ConDemandGradingParameters.v1(gradedAssignmentGroups)%2CcontentAtomRelations.v1(embeddedContentSourceCourseId%2CsubContainerId)&showLockedItems=true`;

    // Fetch and Parse
    let response = await fetch(materialsUrl).then(res => res.json());

    // Extract relevant data points
    // 'elements' usually contains the linked items (videos, readings)
    const materialsData = response?.elements?.[0]?.modules; 
    
    // Extract Course ID from the linked data
    const courseId = response?.linked?.["onDemandCourseMaterialModules.v1"]?.[0]?.courseId || response?.elements?.[0]?.id;

    return {
        data: response?.linked?.["onDemandCourseMaterialItems.v2"], // The actual list of items (videos/readings)
        courseId: courseId,
        slug: currentSlug
    };
};
```

---

### Detailed Flow Explanation & Breakdown

1.  **Triggering**:
    The user clicks the "Complete Week" or "Skip Videos" button in the extension UI. This triggers the `resolveWeekMaterial` function.

2.  **Context Discovery (`getAllMaterials`)**:
    *   The code looks at the browser's URL to find the current week/module slug.
    *   It hits the `onDemandCourseMaterials.v2` API. This is a "god endpoint" that returns the hierarchy of the course: Modules -> Lessons -> Items.
    *   It extracts the `courseId` and the list of items (`onDemandCourseMaterialItems.v2`). Each item object contains its `id`, `name`, and crucially, its `typeName` (e.g., "lecture", "supplement").

3.  **Authentication Extraction**:
    *   Coursera stores the User ID and other session details in the DOM or cookies. The code regexes `document.body` or specific script tags to find the `userId`. This is required to form the API endpoints.

4.  **The Iteration Loop**:
    *   The code maps over every item found in the `materialsData`.
    *   It executes a `Promise.all`, meaning it tries to skip everything in the list simultaneously (parallel requests).

5.  **Skipping Logic by Type**:

    *   **Videos (`typeName === "lecture"`)**:
        *   **Mechanism**: It calls the `videoEvents/ended` endpoint.
        *   **Payload**: `{ contentRequestBody: {} }`.
        *   **Effect**: This tells Coursera's backend "The user finished watching this video". The `autoEnroll=false` parameter prevents accidental enrollment if the user is auditing.

    *   **Readings (`typeName === "supplement"`)**:
        *   **Mechanism**: It calls the `onDemandSupplementViews.v1` endpoint.
        *   **Payload**: Includes `courseId`, `itemId`, and `userId`.
        *   **Effect**: This registers a "view" event, which is the criteria for completing a reading on Coursera.

    *   **Ungraded Plugins (`typeName === "ungradedLti"`)**:
        *   **Mechanism**: Calls `onDemandLtiUngradedLaunches.v1`.
        *   **Payload**: Specifically sets `markItemCompleted: true`.
        *   **Effect**: Forces the completion tick for external tools that usually require a manual button press or time spent.

6.  **Completion**:
    *   Once all promises resolve (all Fetch requests complete), the `react-hot-toast` library displays a success message ("Skip Videos & Readings Completed!").
    *   The page is essentially ready to be reloaded by the user to see the green checkmarks.