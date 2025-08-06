// Coursera Tool - Content Script Loader (Mellowtel tracking removed)
(function () {
  'use strict';

  const injectTime = performance.now();
  (async () => {
    // Load the main Coursera automation functionality
    const { onExecute } = await import(
      /* @vite-ignore */
      chrome.runtime.getURL("assets/chunk-012a0af2.js")
    );
    onExecute?.({ perf: { injectTime, loadTime: performance.now() - injectTime } });
  })().catch(console.error);

})();
