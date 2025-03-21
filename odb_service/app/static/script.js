// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return (bytes / Math.pow(k, i)).toFixed(decimals) + ' ' + sizes[i];
}

// Format timestamp to readable date
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

// Set progress bar color based on usage percentage
function setProgressColor(element, percentage) {
    if (percentage > 80) {
        element.style.backgroundColor = 'var(--danger-color)';
    } else if (percentage > 60) {
        element.style.backgroundColor = 'var(--warning-color)';
    } else {
        element.style.backgroundColor = 'var(--primary-color)';
    }
}

// Set temperature color based on value
function setTempColor(element, temperature) {
    if (temperature > 70) {
        element.style.color = 'var(--danger-color)';
    } else if (temperature > 55) {
        element.style.color = 'var(--warning-color)';
    } else {
        element.style.color = 'var(--success-color)';
    }
}

// Update distance indicator based on value
function updateDistanceIndicator(value) {
    const indicator = document.getElementById('object-status');
    const statusText = document.getElementById('status-text');
    
    indicator.classList.remove('near', 'medium', 'far');
    
    if (value === null || value === undefined) {
        statusText.textContent = 'No data available';
        return;
    }
    
    if (value < 30) {
        indicator.classList.add('near');
        statusText.textContent = 'Object is near';
    } else if (value < 100) {
        indicator.classList.add('medium');
        statusText.textContent = 'Object at medium distance';
    } else {
        indicator.classList.add('far');
        statusText.textContent = 'Object is far away';
    }
}

// Update the UI with system data
function updateUI(data) {
    if (!data) {
        console.error('No data received');
        return;
    }
    
    // Update CPU usage
    const cpuPercent = document.getElementById('cpu-percent');
    const cpuBar = document.getElementById('cpu-bar');
    
    if (data.cpu_percent !== undefined) {
        const cpuValue = parseFloat(data.cpu_percent);
        cpuPercent.textContent = cpuValue.toFixed(1);
        cpuBar.style.width = `${cpuValue}%`;
        setProgressColor(cpuBar, cpuValue);
    } else {
        cpuPercent.textContent = 'N/A';
        cpuBar.style.width = '0%';
    }
    
    // Update CPU temperature
    const cpuTemp = document.getElementById('cpu-temp');
    
    if (data.cpu_temp !== undefined) {
        const tempValue = parseFloat(data.cpu_temp);
        cpuTemp.textContent = tempValue.toFixed(1);
        setTempColor(cpuTemp, tempValue);
    } else {
        cpuTemp.textContent = 'N/A';
    }
    
    // Calculate RAM percentage only if both values are available
    let ramUsedPercent = 0;
    if (data.ram_used !== undefined && data.ram_total !== undefined && data.ram_total > 0) {
        ramUsedPercent = (data.ram_used / data.ram_total) * 100;
    }
    
    // Update RAM
    const ramPercent = document.getElementById('ram-percent');
    const ramBar = document.getElementById('ram-bar');
    const ramUsed = document.getElementById('ram-used');
    const ramTotal = document.getElementById('ram-total');
    const ramFree = document.getElementById('ram-free');
    
    ramPercent.textContent = ramUsedPercent.toFixed(1);
    ramBar.style.width = `${ramUsedPercent}%`;
    setProgressColor(ramBar, ramUsedPercent);
    
    ramUsed.textContent = data.ram_used !== undefined ? formatBytes(data.ram_used) : 'N/A';
    ramTotal.textContent = data.ram_total !== undefined ? formatBytes(data.ram_total) : 'N/A';
    ramFree.textContent = data.ram_free !== undefined ? formatBytes(data.ram_free) : 'N/A';
    
    // Update distance sensor data
    const distanceValue = document.getElementById('distance-value');
    const distanceTimestamp = document.getElementById('distance-timestamp');
    
    if (data.distance !== undefined) {
        const distance = parseFloat(data.distance);
        distanceValue.textContent = distance.toFixed(1);
        
        // Update the status indicator
        updateDistanceIndicator(distance);
        
        // Update timestamp if available
        if (data.distance_timestamp) {
            distanceTimestamp.textContent = `Last updated: ${formatTimestamp(data.distance_timestamp)}`;
        }
    } else {
        distanceValue.textContent = 'N/A';
        updateDistanceIndicator(null);
        distanceTimestamp.textContent = 'No data available';
    }
    
    // Update system info
    document.getElementById('request-id').textContent = data.request_id || 'N/A';
    document.getElementById('timestamp').textContent = formatTimestamp(data.timestamp);
    
    // Update last updated time
    document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    
    // Update raw output
    document.getElementById('output').textContent = JSON.stringify(data, null, 2);
}

// Toggle raw data visibility
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-raw');
    const output = document.getElementById('output');
    
    toggleBtn.addEventListener('click', function() {
        output.classList.toggle('hidden');
    });
});

// Fetch system data
async function fetchData() {
    const refreshBtn = document.getElementById('refresh-btn');
    const output = document.getElementById('output');
    
    // Disable button and show loading state
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Loading...';
    
    try {
        // First fetch call to trigger data collection
        await fetch("/admin/request");
        
        // Wait 2 seconds and then get the status
        setTimeout(async () => {
            try {
                let response = await fetch("/admin/status");
                let responseText = await response.text();
                
                // Remove surrounding quotes if they exist
                if (responseText.startsWith('"') && responseText.endsWith('"')) {
                    responseText = responseText.slice(1, -1);
                }
                
                // Unescape backslashes in the string
                responseText = responseText.replace(/\\"/g, '"');
                
                let data;
                try {
                    // Parse the cleaned JSON string
                    data = JSON.parse(responseText);
                    console.log('Parsed data:', data); // Debug log
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    output.textContent = "Error: Invalid JSON format. Raw response: " + responseText;
                    return;
                }
                
                // Check if data is valid before updating UI
                if (data) {
                    // Update the raw output first
                    output.textContent = JSON.stringify(data, null, 2);
                    
                    // Update the UI with the data
                    updateUI(data);
                } else {
                    output.textContent = "Error: No valid data received.";
                }
            } catch (statusError) {
                console.error('Error fetching status:', statusError);
                output.textContent = "Error fetching status data: " + statusError.message;
            } finally {
                // Re-enable the refresh button
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        }, 2000);
    } catch (requestError) {
        console.error('Error requesting data collection:', requestError);
        output.textContent = "Error requesting data collection: " + requestError.message;
        
        // Re-enable the refresh button
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Fetch data when page loads
    fetchData();
    
    // Add click event for refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', fetchData);
    
    // Optional: Set up auto-refresh every minute
    // setInterval(fetchData, 60000);
});