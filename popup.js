document.addEventListener('DOMContentLoaded', function() {
  const powerButton = document.getElementById('powerButton');
  const statusText = document.getElementById('statusText');
  const blockedCount = document.getElementById('blockedCount');
  const whitelistCount = document.getElementById('whitelistCount');
  const whitelistContainer = document.getElementById('whitelist');
  const blockedListContainer = document.getElementById('blockedList');

  // Initialize state
  let isActive = false;

  // Load saved state from storage
  chrome.storage.sync.get(['protectionActive', 'whitelisted', 'blocked'], function(data) {
    isActive = data.protectionActive !== false; // Default to true if undefined
    updateUI();

    // Populate whitelist
    if (data.whitelisted) {
      whitelistCount.textContent = Object.keys(data.whitelisted).length;
      populateList(whitelistContainer, data.whitelisted);
    }

    // Populate blocked list
    if (data.blocked) {
      blockedCount.textContent = data.blocked.length;
      populateList(blockedListContainer, data.blocked);
    }
  });

  // Toggle protection
  powerButton.addEventListener('click', function() {
    isActive = !isActive; // Toggle the active state
    updateUI();

    // Save state and notify background script
    chrome.storage.sync.set({ protectionActive: isActive }, function() {
      chrome.runtime.sendMessage({
        action: "toggleProtection",
        isActive: isActive
      });
    });
  });

  // Update UI based on current state
  function updateUI() {
    if (isActive) {
      powerButton.classList.add('active');
      powerButton.classList.remove('power-off');
      statusText.textContent = 'ON';
      document.body.style.backgroundColor = '#1a1a2e';
    } else {
      powerButton.classList.remove('active');
      powerButton.classList.add('power-off');
      statusText.textContent = 'OFF';
      document.body.style.backgroundColor = '#2e1a1a';
    }
  }

  // Populate list containers
  function populateList(container, items) {
    container.innerHTML = ''; // Clear current list

    if (Array.isArray(items)) {
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.textContent = item;
        container.appendChild(div);
      });
    } else if (typeof items === 'object') {
      for (const origin in items) {
        items[origin].forEach(url => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.textContent = url;
          container.appendChild(div);
        });
      }
    }
  }

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateBlockedCount") {
      blockedCount.textContent = request.count;
    } else if (request.action === "updateBlockedList") {
      populateList(blockedListContainer, request.items);
    } else if (request.action === "updateWhitelist") {
      whitelistCount.textContent = Object.keys(request.items).length;
      populateList(whitelistContainer, request.items);
    } else if (request.action === "protectionStateChanged") {
      isActive = request.isActive;
      updateUI();
    }
  });
});


const ctx = document.getElementById('cpuChart').getContext('2d');
const cpuChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(20).fill(''),
    datasets: [{
      label: 'CPU Usage (%)',
      data: Array(20).fill(0),
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: {
      legend: { display: false },
      // This will adjust the scale after the chart updates
      autocolors: false,
    },
    scales: {
      y: {
        // Remove hardcoded min/max
        ticks: {
          callback: function(value) {
            return value + '%'; // Keep percentage format
          }
        },
        // Add adaptive configuration
        beginAtZero: true,
        grace: '5%' // Adds 5% padding above/below data range
      }
    }
  }
});

// Function to update chart with new data point
function updateChart(newValue) {
  // Add new data and remove oldest
  cpuChart.data.datasets[0].data.push(newValue);
  cpuChart.data.datasets[0].data.shift();

  // Update chart
  cpuChart.update();
}

// 📥 Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'cpuSample' && typeof request.avgUsage === 'number') {
    const usage = Math.round(request.avgUsage);
    const dataset = cpuChart.data.datasets[0];

    dataset.data.push(usage);
    if (dataset.data.length > 20) dataset.data.shift(); // keep 20 points

    cpuChart.update();
  }
});


