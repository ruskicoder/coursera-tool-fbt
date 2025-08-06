// Coursera Tool - Service Worker
console.log("Coursera Tool service worker loaded");

// Handle Coursera CSRF token collection
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    chrome.cookies.get({
      url: "https://www.coursera.org",
      name: "CSRF3-Token"
    }, function(cookie) {
      if (cookie) {
        chrome.storage.sync.set({csrf3Token: cookie.value});
      } else {
        console.log("CSRF3-Token cookie not found");
      }
    });
  }
});

// Handle tab management messages
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
