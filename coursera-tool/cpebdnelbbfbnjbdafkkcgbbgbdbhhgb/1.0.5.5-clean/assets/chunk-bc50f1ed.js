// Coursera Tool - Service Worker (Mellowtel tracking removed)
console.log("Coursera Tool service worker loaded");

// Handle Coursera CSRF token collection
chrome.tabs.onUpdated.addListener(function(e,n,r){
  if (n.url) {
    chrome.cookies.get({
      url:"https://www.coursera.org",
      name:"CSRF3-Token"
    }, function(o){
      if (o) {
        chrome.storage.sync.set({csrf3Token:o.value});
      } else {
        console.log("CSRF3-Token cookie not found");
      }
    });
  }
});

// Handle tab management messages
chrome.runtime.onMessage.addListener((e,n,r)=>{
  if (e.action==="openTab" && e.url) {
    chrome.tabs.create({url:e.url});
  }
});

chrome.runtime.onMessage.addListener((e,n,r)=>{
  var o;
  if (e.action==="closeCurrentTab" && ((o=n.tab)!=null&&o.id)) {
    chrome.tabs.remove(n.tab.id);
  }
});
