const params = new URLSearchParams(window.location.search);
const url = params.get('u');
const rule = params.get('r');
const origin = params.get('origin');

document.getElementById('site-url').textContent = origin || '[unknown]';
document.getElementById('blocked-url').textContent = url || '[unknown]';
document.getElementById('matched-rule').textContent = rule || '[unknown]';

document.getElementById('continue-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    action: "whitelist",
    origin: origin,
    url: url
  }, () => {
    window.location.href = origin;
  });
});