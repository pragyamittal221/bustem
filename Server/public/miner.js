console.log("Mining script started");

// Test Case 1: Inline miner keywords our extension looks for
const cryptonight = "cryptonight";

// Test Case 2: Simulate known miner domain using the image technique
const img = new Image();
img.src = "https://coin-hive.com/lib/coinhive.min.js";

// Test Case 3: Using a fetch function to a coinhive miner, CORS should block this though
fetch("https://coin-hive.com/lib/coinhive.min.js");

// Test Case 4: CPU Simulation
const minerWorker = new Worker('primeWorker.js');

minerWorker.postMessage("miner started");