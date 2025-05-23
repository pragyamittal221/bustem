let regexPatterns = [];
let blockedUrls = [];
let protectionEnabled = true;

function wildcardToRegex(wildcard) {
  return new RegExp("^" + wildcard
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + "$");
}

(async () => {
  const data = await chrome.storage.sync.get(['protectionActive', 'blockedUrls']);
  protectionEnabled = data.protectionActive !== false;
  blockedUrls = data.blockedUrls || [];

  const blacklistText = await fetch(chrome.runtime.getURL('blacklist.txt')).then(r => r.text());
  regexPatterns = blacklistText.split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(pattern => ({
      pattern,
      regex: wildcardToRegex(pattern)
    }));
})();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.protectionActive) {
    protectionEnabled = changes.protectionActive.newValue !== false;
  }
});

chrome.webRequest.onCompleted.addListener(async (details) => {
  if (!protectionEnabled) return;

  const url = details.url;

  for (let { regex, pattern } of regexPatterns) {
    if (regex.test(url)) {
      if (!blockedUrls.includes(url)) {
        blockedUrls.push(url);
        chrome.storage.sync.set({ blockedUrls });
        chrome.runtime.sendMessage({
          action: "updateBlockedCount",
          count: blockedUrls.length
        });
      }

      if (details.tabId >= 0) {
        chrome.tabs.get(details.tabId, (tab) => {
          if (chrome.runtime.lastError || !tab || !tab.url) return;

          const currentTabUrl = tab.url;

          const blockUrl = chrome.runtime.getURL('blockpage.html') +
            `?u=${encodeURIComponent(url)}` +
            `&r=${encodeURIComponent(pattern)}` +
            `&origin=${encodeURIComponent(currentTabUrl)}`;

          chrome.tabs.update(details.tabId, { url: blockUrl });
        });
      }

      break;
    }
  }
}, { urls: ["<all_urls>"] });

/* =========================
   CPU MONITORING SECTION
========================= */
let lastCpuSample = null;
let consecutiveFlatCount = 0;
const CPU_THRESHOLD = 15;
const FLAT_LINE_THRESHOLD = 7;
const CPU_CHECK_INTERVAL = 1000;
const FLUCTUATION_RATE =  3.5;

function calculateUsageDelta(prev, curr) {
  return curr.map((core, i) => {
    const prevCore = prev[i];
    const activePrev = prevCore.usage.user + prevCore.usage.kernel;
    const activeCurr = core.usage.user + core.usage.kernel;
    const totalPrev = prevCore.usage.total;
    const totalCurr = core.usage.total;

    const activeDelta = activeCurr - activePrev;
    const totalDelta = totalCurr - totalPrev;

    return totalDelta === 0 ? 0 : (activeDelta / totalDelta) * 100;
  });
}

function monitorCpuUsage() {
  chrome.system.cpu.getInfo(current => {
    if (lastCpuSample) {
      const usagePercents = calculateUsageDelta(lastCpuSample.processors, current.processors);
      const avgUsage = usagePercents.reduce((a, b) => a + b, 0) / usagePercents.length;
      current._avg = avgUsage;

      chrome.runtime.sendMessage({ action: 'cpuSample', avgUsage }).catch(e => {});

      console.log(
          `%c[CPU Monitor] Avg CPU Usage: %c${avgUsage.toFixed(2)}%`,
          'color: gray; font-weight: bold;',
          avgUsage > CPU_THRESHOLD ? 'color: red; font-weight: bold;' : 'color: green; font-weight: bold;'
        );

      if (avgUsage > CPU_THRESHOLD) {
        const lastAvg = lastCpuSample._avg || 0;
        const isFlat = Math.abs(avgUsage - lastAvg) < FLUCTUATION_RATE;

        if (isFlat) {
          consecutiveFlatCount++;
        } else {
          consecutiveFlatCount = 0;
        }

        if (consecutiveFlatCount >= FLAT_LINE_THRESHOLD) {
          console.warn("[ALERT] Potential cryptojacking detected — sustained high CPU usage!");
          consecutiveFlatCount = 0;

          if (protectionEnabled) {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
              if (tabs.length > 0) {
                const currentTab = tabs[0];
                const currentUrl = currentTab.url;
                const blockUrl = chrome.runtime.getURL('blockpage.html') +
                  `?u=${encodeURIComponent("Resource Usage")}` +
                  `&r=${encodeURIComponent('Potential cryptojacking detected')}` +
                  `&origin=${encodeURIComponent(currentUrl)}`;
                chrome.tabs.update(currentTab.id, { url: blockUrl });
              }
            });
          }
        }
      } else {
        consecutiveFlatCount = 0;
      }
    }

    lastCpuSample = current;
  });
}

setInterval(monitorCpuUsage, CPU_CHECK_INTERVAL);

