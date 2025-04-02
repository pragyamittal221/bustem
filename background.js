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

// Logs the URL and type of mining activity detected to local storage
async function logDetection(url, type) {
  const { detections = [] } = await chrome.storage.local.get('detections');
  detections.push({
    url,
    type,
    timestamp: new Date().toISOString()
  });
  await chrome.storage.local.set({ detections });
}

// Checks every network request against known miner URLs
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

// Listens for messages from content.js and logs wasm inline and iframe miners
chrome.runtime.onMessage.addListener(
  async (message) => {

  if (message.type === 'wasm_usage') {
    await logDetection(message.url, 'wasm_usage');
  }

  if (message.type === 'inline_miner') {
    await logDetection(message.url, 'inline_miner');
  }

  if (message.type === 'miner_iframe') {
    await logDetection(message.url, 'miner_iframe');
  }

  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); 
});

// Cleanup old entries every hour
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async () => {
  const { detections = [] } = await chrome.storage.local.get('detections');
  const freshDetections = detections.filter(
    d => new Date() - new Date(d.timestamp) < 86400000 // 24h
  );
  await chrome.storage.local.set({ detections: freshDetections });
});