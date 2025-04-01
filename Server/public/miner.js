console.log("Mining script started");

// Test Case 1: Inline miner keywords our extension looks for
const cryptonight = "cryptonight";

// Test Case 2: Simulate known miner domain using the image technique
const img = new Image();
img.src = "https://coin-hive.com/lib/coinhive.min.js";

// Test Case 3: Using a fetch function to a coinhive miner, CORS should block this though
fetch("https://coin-hive.com/lib/coinhive.min.js");

// Test Case 4: CPU Simulation
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker
// Source for Prime Numbers was chatGPT
const blob = new Blob([`
  onmessage = function () {
  let i = 2;
  while (true) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    i++;
  }
}
`], { type: "application/javascript" });

const minerWorker = new Worker(URL.createObjectURL(blob));
minerWorker.postMessage("miner started");