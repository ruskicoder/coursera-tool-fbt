/**
 * Content Script Loader
 * File: index.ts-loader-f3739d88.js
 * 
 * Description: 
 * This script is the entry point defined in the manifest.json.
 * It calculates injection timing metrics and dynamically imports the 
 * heavy logic chunk. This architecture is used to support Code Splitting 
 * and HMR (Hot Module Replacement) in modern extension development.
 */

(function () {
  'use strict';

  // 1. Capture the timestamp when the script is injected into the page
  const injectTime = performance.now();

  (async () => {
    // 2. Dynamically import the main application logic
    // Chrome extensions require using chrome.runtime.getURL to load assets/scripts
    // defined in web_accessible_resources or extension context.
    const module = await import(
      /* @vite-ignore */
      chrome.runtime.getURL("assets/chunk-97f40ce3.js")
    );

    // 3. Execute the lifecycle hook if it exists
    // The main chunk (chunk-97f40ce3.js) executes its main logic immediately upon import 
    // via a self-invoking function (IIFE). 
    // The 'onExecute' export is an optional hook often used by Vite plugins for 
    // performance monitoring or HMR state handovers.
    const { onExecute } = module;
    
    if (typeof onExecute === 'function') {
        onExecute({
            perf: {
                injectTime: injectTime,
                loadTime: performance.now() - injectTime
            }
        });
    }

  })().catch(error => {
    // Standard error handling for the async loader
    console.error("Failed to load Coursera Tool extension:", error);
  });

})();