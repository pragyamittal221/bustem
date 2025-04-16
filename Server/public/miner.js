console.log("Mining script started");

// Test Case 1: Inline miner keywords our extension looks for
const cryptonight = "cryptonight";

// Test Case 2: Simulate known miner domain using the image technique
const img = new Image();
img.src = "https://coin-hive.com/lib/coinhive.min.js";

// Test Case 3: Using a fetch function to a local WASM miner
fetch("cryptonight.wasm");

// Test Case 4: CPU Simulation, Absolutely drains CPU, 4 prime workers
const minerWorker = new Worker('primeWorker.js');
minerWorker.postMessage("miner started");
const minerWorker2 = new Worker('primeWorker.js');
minerWorker2.postMessage("miner started");
const minerWorker3 = new Worker('primeWorker.js');
minerWorker3.postMessage("miner started");
const minerWorker4 = new Worker('primeWorker.js');
minerWorker4.postMessage("miner started");