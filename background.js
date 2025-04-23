// Extension configuration and state
let regexPatterns = [];
let whitelist = {};
let protectionEnabled = true;
let cryptojackingDetected = false;
let cpuMonitorSocket = null;
let cpuUsageHistory = [];
let blockedUrls = [];

// Initialize protection state from storage
chrome.storage.sync.get(['protectionActive', 'blockedUrls'], function(data) {
  protectionEnabled = data.protectionActive !== false;
  if (data.blockedUrls) {
    blockedUrls = data.blockedUrls;
  }
});

// Convert wildcard patterns to regular expressions
function wildcardToRegExp(wildcard) {
  return new RegExp("^" + wildcard
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + "$");
}

// Load blacklist patterns
fetch(chrome.runtime.getURL('blacklist.txt'))
  .then(r => r.text())
  .then(text => {
    const lines = text.split('\n').filter(l =>
      l.trim() && !l.startsWith('#')
    );
    regexPatterns = lines.map(entry => ({
      pattern: entry,
      regex: wildcardToRegExp(entry)
    }));
  });

// Web Request Interceptor
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!protectionEnabled) return;

    // Immediately block all requests if cryptojacking detected
    if (cryptojackingDetected) {
      return { cancel: true };
    }

    const url = details.url;
    let origin;

    try {
      const docUrl = details.documentUrl || details.initiator;
      origin = docUrl ? new URL(docUrl).origin : new URL(url).origin;
    } catch (e) {
      origin = new URL(url).origin;
    }

    // Check whitelist
    if (whitelist[origin] && whitelist[origin].includes(url)) {
      return;
    }

    // Check against blacklist patterns
    for (let { regex, pattern } of regexPatterns) {
      if (regex.test(url)) {
        // Add to blocked URLs list
        if (!blockedUrls.includes(url)) {
          blockedUrls.push(url);
          chrome.storage.sync.set({ blockedUrls: blockedUrls });
          chrome.runtime.sendMessage({
            action: "updateBlockedCount",
            count: blockedUrls.length
          });
        }

        const pageUrl = chrome.runtime.getURL('blockpage.html') +
          `?u=${encodeURIComponent(url)}&r=${encodeURIComponent(pattern)}&origin=${encodeURIComponent(origin)}`;

        if (details.tabId !== -1) {
          chrome.tabs.update(details.tabId, { url: pageUrl });
        }

        return { redirectUrl: pageUrl };
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// WebSocket Connection for CPU Monitoring

let socket = null;
let latestNumber = "Waiting for data...";
let popupPort = null;

function connectWebSocket() {
  socket = new WebSocket("ws://localhost:8765");

  socket.onopen = function(e) {
    console.log("[background.js] WebSocket connection established");
  };

  socket.onmessage = async function(event) {
    try {
      const data = event.data;
      latestNumber = event.data;
      console.log(`[background.js] Received number:`, latestNumber);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        console.log(tab);
        if (tab && tab.url && tab.url.startsWith("http")) {
          const redirectUrl = chrome.runtime.getURL('blockpage.html') +
            `?u=${encodeURIComponent(data.alert)}&r=${encodeURIComponent(tab.url)}&origin=${encodeURIComponent(tab.url)}`;  //encodeURIComponent('Resource Based Detection')
          chrome.tabs.update(tab.id, { url: redirectUrl });
          console.log(redirectUrl);
        }
      });
      console.log("THIS WORKS");
    } catch (err) {
      console.error("[background.js] Failed to process message:", err);
    }
  };

  socket.onclose = function(event) {
    console.log("[background.js] WebSocket connection closed, reconnecting...");
    setTimeout(connectWebSocket, 1000);
  };

  socket.onerror = function(error) {
    console.error("[background.js] WebSocket error:", error?.message || error);
    socket.close(); // Triggers onclose and reconnect
  };
}

connectWebSocket();
