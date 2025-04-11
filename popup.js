// Global variables
let apiKey = '';
let isSettingsVisible = false;
let isApiKeyVisible = false;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    // Load saved API key
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKey = result.apiKey;
            document.getElementById('apiKey').value = apiKey;
        }
    });
    
    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    // Settings toggle
    document.getElementById('settingsToggle').addEventListener('click', toggleSettings);
    
    // API key visibility toggle
    document.getElementById('toggleApiVisibility').addEventListener('click', toggleApiKeyVisibility);
    
    // Save settings
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Capture button
    document.getElementById('captureButton').addEventListener('click', initiateScreenCapture);
}

// Toggle settings panel visibility
function toggleSettings() {
    isSettingsVisible = !isSettingsVisible;
    const settingsPanel = document.getElementById('settingsPanel');
    
    if (isSettingsVisible) {
        settingsPanel.classList.remove('hidden');
    } else {
        settingsPanel.classList.add('hidden');
    }
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
    isApiKeyVisible = !isApiKeyVisible;
    const apiKeyInput = document.getElementById('apiKey');
    
    if (isApiKeyVisible) {
        apiKeyInput.type = 'text';
        document.getElementById('toggleApiVisibility').textContent = '🔒';
    } else {
        apiKeyInput.type = 'password';
        document.getElementById('toggleApiVisibility').textContent = '👁️';
    }
}

// Save settings
function saveSettings() {
    const newApiKey = document.getElementById('apiKey').value.trim();
    
    if (newApiKey) {
        apiKey = newApiKey;
        chrome.storage.local.set({ apiKey }, () => {
            showNotification('Settings saved successfully!');
            toggleSettings(); // Hide settings after saving
        });
    } else {
        showNotification('Please enter a valid API key', true);
    }
}

// Initiate the screen capture process
function initiateScreenCapture() {
    // Check if API key is set
    if (!apiKey) {
        showNotification('Please set your OpenAI API key in settings first', true);
        toggleSettings();
        return;
    }
    
    // Send message to background script to start the capture process
    chrome.runtime.sendMessage({ action: 'initiateScreenCapture' });
    
    // Close the popup as we'll open a new interface for screen capture
    window.close();
}

// Show a notification message
function showNotification(message, isError = false) {
    // Check if a notification already exists and remove it
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}