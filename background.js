// Background script for Canvas Vision Assistant

// Global variables
let lastScreenshot = null;
let chatTabId = null;

// Install and update events
chrome.runtime.onInstalled.addListener(() => {
    console.log('Canvas Vision Assistant installed');
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'initiateScreenCapture':
            captureVisibleTab();
            break;
            
        case 'getScreenshot':
            sendResponse({ screenshot: lastScreenshot });
            break;
            
        case 'cancelCapture':
            lastScreenshot = null;
            break;
            
        case 'processScreenshot':
            processScreenshot(request.screenshot);
            break;
    }
    
    // Important for async responses
    return true;
});

// Capture the visible tab
function captureVisibleTab() {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
            console.error('Screenshot failed:', chrome.runtime.lastError);
            return;
        }
        
        // Store the screenshot temporarily
        lastScreenshot = dataUrl;
        
        // Open the screenshot crop page
        openScreenshotCropPage();
    });
}

// Open the screenshot crop page
function openScreenshotCropPage() {
    const cropUrl = chrome.runtime.getURL('screenshotCrop.html');
    
    chrome.tabs.create({ url: cropUrl, active: true }, (tab) => {
        // We might need to track this tab for later use
    });
}

// Process the screenshot after cropping
function processScreenshot(croppedScreenshot) {
    // Store the cropped screenshot
    lastScreenshot = croppedScreenshot;
    
    // Open the chat interface (we'll implement this next)
    openChatInterface(croppedScreenshot);
}

// Open the chat interface with the screenshot
function openChatInterface(screenshot) {
    // For now, we'll use a placeholder - we'll implement the actual chat UI next
    const chatUrl = chrome.runtime.getURL('chat.html');
    
    chrome.tabs.create({ url: chatUrl, active: true }, (tab) => {
        chatTabId = tab.id;
        
        // Wait for the tab to load, then send the screenshot
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                // Remove the listener
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Send the screenshot to the chat page
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'setScreenshot',
                        screenshot: screenshot
                    });
                }, 200);
            }
        });
    });
}