let regexPatterns = [];
let whitelist = {};

// Convert wildcard to RegExp
function wildcardToRegExp(wildcard) {
  return new RegExp("^" + wildcard
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + "$");
}

// Load blacklist into memory
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

// Intercept web requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;

    let origin;
    try {
      const docUrl = details.documentUrl || details.initiator;
      origin = docUrl ? new URL(docUrl).origin : new URL(url).origin;
    } catch (e) {
      origin = new URL(url).origin;
    }


    // Check whitelist first
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

// Whitelist handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "whitelist") {
    const { origin, url } = message;
    if (!whitelist[origin]) whitelist[origin] = [];
    if (!whitelist[origin].includes(url)) {
      whitelist[origin].push(url);
    }
    sendResponse({ status: "ok" });
  }
});
