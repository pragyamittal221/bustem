let regexPatterns = [];
let whitelist = {};
let protectionEnabled = true;
let cryptojackingDetected = false;  // Flag to track cryptojacking alert

chrome.storage.sync.get(['protectionActive'], function (data) {
  protectionEnabled = data.protectionActive !== false;
});

function wildcardToRegExp(wildcard) {
  return new RegExp("^" + wildcard
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + "$");
}

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

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!protectionEnabled || cryptojackingDetected) return;

    const url = details.url;
    let origin;

    try {
      const docUrl = details.documentUrl || details.initiator;
      origin = docUrl ? new URL(docUrl).origin : new URL(url).origin;
    } catch (e) {
      origin = new URL(url).origin;
    }

    if (whitelist[origin] && whitelist[origin].includes(url)) {
      return;
    }

    for (let { regex, pattern } of regexPatterns) {
      if (regex.test(url)) {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "whitelist") {
    const { origin, url } = message;
    if (!whitelist[origin]) whitelist[origin] = [];
    if (!whitelist[origin].includes(url)) {
      whitelist[origin].push(url);
    }
    sendResponse({ status: "ok" });
  }

  else if (message.action === "toggleProtection") {
    protectionEnabled = message.isActive;
    chrome.storage.sync.set({ protectionActive: protectionEnabled });

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: "protectionStateChanged",
          isActive: protectionEnabled
        }).catch(() => { });
      });
    });

    sendResponse({ status: "success" });
  }

  else if (message.action === "getProtectionState") {
    sendResponse({ isActive: protectionEnabled });
  }
});

/// RESOURCES

