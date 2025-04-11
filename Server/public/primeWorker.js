// Source for Prime Numbers was chatGPT: https://chatgpt.com/share/67ec4b3d-0f98-8000-a16a-65f74cbc3b45 
function isPrime(num) {
    if (num <= 1) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;
    const sqrt = Math.sqrt(num);
    for (let i = 3; i <= sqrt; i += 2) {
        if (num % i === 0) return false;
    }
    return true;
}

let current = 2;

function findPrimes() {
    while (true) {
        if (isPrime(current)) {
            postMessage(current);
        }
        current++;
    }
}

findPrimes();  