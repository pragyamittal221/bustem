// Updated list of crypto-mining script patterns (2024)
const MINING_SCRIPTS = [
  // Common mining scripts
  /coin[-_]?hive\./i,
  /cryptoloot\./i,
  /jse?coin\./i,
  /miner?\.pr0gramm\./i,
  /minemytraffic\./i,
  /ppoi\.org/i,
  /projectpoi\./i,
  /authedmine\./i,
  /crypto[-_]?loot\./i,
  /minero\./i,
  /webassembly\.stream/i,
  /wasm\.stream/i,
  /\/lib\/cryptonight\.wasm/i,
  /\/miner\.js/i,
  /\/worker\.js/i,
  /\/cn\.js/i, // Cryptonight
  /\/xmr\.min\.js/i, // Monero miners

  // Mining pools
  /minexmr\./i,
  /xmrpool\./i,
  /supportxmr\./i,
  /moneroocean\./i,
  /nanopool\./i,
  /nicehash\./i
];

async function logDetection(url, type) {
  const { detections = [] } = await chrome.storage.local.get('detections');
  detections.push({
    url,
    type,
    timestamp: new Date().toISOString()
  });
  await chrome.storage.local.set({ detections });
}

// Monitor network requests
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const url = details.url.toLowerCase();
    const isMiner = MINING_SCRIPTS.some(regex => regex.test(url));

    if (isMiner) {
      await logDetection(url, 'network_request');
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
  },
  { urls: ["<all_urls>"] }
);

// Cleanup old entries every hour
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async () => {
  const { detections = [] } = await chrome.storage.local.get('detections');
  const freshDetections = detections.filter(
    d => new Date() - new Date(d.timestamp) < 86400000 // 24h
  );
  await chrome.storage.local.set({ detections: freshDetections });
});