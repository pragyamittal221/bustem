//These tests need to be run individually in the extension console
//This is a brute force method of testing 

//For network_request
chrome.storage.local.set({ detections: [{ url: 'http://cryptoloot.com', type: 'network_request', timestamp: new Date().toISOString() }] }, () => {
    console.log("Data saved successfully. Network Request is working");
  });

//For wasm_usage
chrome.storage.local.set({ detections: [{ url: 'http://test.com', type: 'wasm_usage', timestamp: new Date().toISOString() }] }, () => {
    console.log("Data saved successfully. WASM usage detection is working");
  });
  
//For inline_miner
chrome.storage.local.set({ detections: [{ url: 'http://test.com', type: 'inline_miner', timestamp: new Date().toISOString() }] }, () => {
    console.log("Data saved successfully. Inline miner detection is working");
  });
  
//For miner_iframe
chrome.storage.local.set({ detections: [{ url: 'http://test.com', type: 'miner_iframe', timestamp: new Date().toISOString() }] }, () => {
    console.log("Data saved successfully. Miner iframe detection is working");
  });

//To clear
chrome.storage.local.clear();