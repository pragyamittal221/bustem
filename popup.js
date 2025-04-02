// Display detections when popup opens
async function updateDetections() {
  const { detections = [] } = await chrome.storage.local.get('detections');
  const container = document.getElementById('detections');

  if (detections.length === 0) {
    container.innerHTML = '<p>No miners detected yet, you\'re safe.</p>';
    return;
  }

  container.innerHTML = detections
    .map(d => `
      <div class="detection">
        <p><b>You are!</b></p>
        <div>Type of mining: <strong>${d.type.replace('_', ' ')}</strong></div>
        <div class="url">URL: ${d.url}</div>
        <div class="timestamp">Time: ${new Date(d.timestamp).toLocaleString()}</div>
      </div>
    `)
    .join('');
}

// Update on popup open
updateDetections();

// Live updates (if popup stays open)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.detections) {
    updateDetections();
  }
});