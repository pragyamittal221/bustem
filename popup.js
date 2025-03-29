// Display detections when popup opens
async function updateDetections() {
  const { detections = [] } = await chrome.storage.local.get('detections');
  const container = document.getElementById('detections');

  if (detections.length === 0) {
    container.innerHTML = '<p>No miners detected yet.</p>';
    return;
  }

  container.innerHTML = detections
    .map(d => `
      <div class="detection">
        <div><strong>${d.type.replace('_', ' ')}</strong></div>
        <div>${d.url}</div>
        <div class="timestamp">${new Date(d.timestamp).toLocaleString()}</div>
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