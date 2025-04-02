// Hook WebAssembly to detect miners using WASM instance to mine
const originalInstantiate = WebAssembly.instantiate;
WebAssembly.instantiate = function(buffer, imports) {
  console.warn("🚨 WebAssembly.instantiate called - possible miner!");

  chrome.runtime.sendMessage({
    type: 'wasm_usage',
    url: window.location.href
  });

  return originalInstantiate(buffer, imports);
};

// Check for inline mining scripts
function scanScripts() {
  document.querySelectorAll('script').forEach(script => {
    const content = script.textContent.toLowerCase();
    const suspiciousPatterns = [
      'cryptonight',
      'miner.start',
      'webassembly',
      'coinimp',
      'xmr.js',
      'crypto.mining'
    ];

    if (suspiciousPatterns.some(p => content.includes(p))) {
      chrome.runtime.sendMessage({
        type: 'inline_miner',
        url: window.location.href
      });
    }
  });
}

// Check for hidden miner iframes
function checkIframes() {
  document.querySelectorAll('iframe').forEach(iframe => {
    try {
      if (iframe.contentDocument) {
        iframe.contentDocument.querySelectorAll('script').forEach(script => {
          if (script.src && MINING_SCRIPTS.some(regex => regex.test(script.src))) {
            chrome.runtime.sendMessage({
              type: 'miner_iframe',
              url: script.src
            });
          }
        });
      }
    } catch (e) {
      // Cross-origin iframe (can't inspect)
    }
  });
}

// Run initial scan
scanScripts();
checkIframes();

// Monitor dynamically added scripts
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.tagName === 'SCRIPT') scanScripts();
      if (node.tagName === 'IFRAME') checkIframes();
    });
  });
});

observer.observe(document, {
  childList: true,
  subtree: true
});