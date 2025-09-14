// Coursera Tool - Service Worker
console.log("Coursera Tool service worker loaded - Version 1.0.5.10");

// Persist specific Coursera cookies into extension storage for later API calls
async function persistCookieToSyncStorage(cookieName, storageKey) {
  await chrome.cookies.get({ url: "https://www.coursera.org", name: cookieName }, async (cookie) => {
    if (cookie) {
      await chrome.storage.sync.set({ [storageKey]: cookie.value });
    }
  });
}

// When a tab URL changes, refresh cached tokens
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.url) {
    await persistCookieToSyncStorage("CSRF3-Token", "csrf3Token");
    await persistCookieToSyncStorage("CAUTH", "CAUTH");
  }
});

// Lightweight message router used by the content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "openTab" && message.url) {
    chrome.tabs.create({ url: message.url });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeCurrentTab" && sender.tab && sender.tab.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openBackgroundTab" && message.url) {
    chrome.tabs.create({ url: message.url, active: false });
  }
});

// Handle metadata requests by ensuring tokens are cached
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message.action === "getMetadata") {
    await persistCookieToSyncStorage("CSRF3-Token", "csrf3Token");
    await persistCookieToSyncStorage("CAUTH", "CAUTH");
    sendResponse({ status: "ok" });
  }
  return true;
});
