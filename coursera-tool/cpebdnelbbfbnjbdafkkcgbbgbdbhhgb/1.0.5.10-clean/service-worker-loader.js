// Coursera Tool - Service Worker
console.log("Coursera Tool service worker loaded - Version 1.0.5.10");

// Handle Coursera CSRF token collection
const saveCSRFToken = async (name, key) => {
  await chrome.cookies.get({
    url: "https://www.coursera.org",
    name: name
  }, async function(cookie) {
    if (cookie) {
      await chrome.storage.sync.set({[key]: cookie.value});
    }
  });
};

// Listen for tab updates to collect tokens
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    await saveCSRFToken("CSRF3-Token", "csrf3Token");
    await saveCSRFToken("CAUTH", "CAUTH");
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openTab" && message.url) {
    chrome.tabs.create({url: message.url});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closeCurrentTab" && sender.tab?.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openBackgroundTab" && message.url) {
    chrome.tabs.create({url: message.url, active: false});
  }
});

// Handle metadata requests
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "getMetadata") {
    await saveCSRFToken("CSRF3-Token", "csrf3Token");
    await saveCSRFToken("CAUTH", "CAUTH");
    sendResponse({status: "ok"});
  }
  return true;
});
