// Global variables
let isSelecting = false;
let isDragging = false;
let isResizing = false;
let startX = 0;
let startY = 0;
let currentResizeHandle = null;
let selectionElement = null;
let selectionInfo = null;
let screenshotDataUrl = null;

// Selection coordinates
let selection = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

// Initialize the screen capture UI
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    selectionElement = document.getElementById('selection');
    selectionInfo = document.getElementById('selectionInfo');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load the screenshot taken by the background script
    loadScreenshot();
});

// Set up all event listeners
function setupEventListeners() {
    const overlay = document.getElementById('overlay');
    
    // Mouse events for selection
    overlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Handle buttons
    document.getElementById('captureButton').addEventListener('click', captureSelection);
    document.getElementById('cancelButton').addEventListener('click', cancelCapture);
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelCapture();
        } else if (e.key === 'Enter') {
            if (!selectionElement.classList.contains('hidden') && 
                selection.width > 10 && selection.height > 10) {
                captureSelection();
            }
        }
    });
    
    // Handle resize handles
    document.querySelectorAll('.handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            isSelecting = false;
            isDragging = false;
            currentResizeHandle = handle.dataset.handle;
            startX = e.clientX;
            startY = e.clientY;
        });
    });
    
    // Handle dragging the selection
    selectionElement.addEventListener('mousedown', (e) => {
        if (!isResizing) {
            isDragging = true;
            isSelecting = false;
            startX = e.clientX;
            startY = e.clientY;
            e.stopPropagation();
        }
    });
}

// Load the screenshot from the background script
function loadScreenshot() {
    chrome.runtime.sendMessage({ action: 'getScreenshot' }, (response) => {
        if (response && response.screenshot) {
            screenshotDataUrl = response.screenshot;
            
            // Set the screenshot as background (optional for visual reference)
            // This is just to help the user see what they're selecting
            // document.getElementById('overlay').style.backgroundImage = `url(${screenshotDataUrl})`;
            // document.getElementById('overlay').style.backgroundSize = 'cover';
        }
    });
}

// Handle mouse down event (start selection)
function handleMouseDown(e) {
    // Only start a new selection if we're not resizing or dragging
    if (!isResizing && !isDragging) {
        isSelecting = true;
        
        // Set starting position
        startX = e.clientX;
        startY = e.clientY;
        
        // Initialize selection properties
        selection.x = startX;
        selection.y = startY;
        selection.width = 0;
        selection.height = 0;
        
        // Update the selection element
        updateSelectionElement();
        
        // Show the selection element
        selectionElement.classList.remove('hidden');
        
        // Hide instructions once user starts selecting
        document.getElementById('instructions').style.opacity = '0';
    }
}

// Handle mouse move event (update selection)
function handleMouseMove(e) {
    if (isSelecting) {
        // Calculate the width and height of the selection
        selection.width = Math.abs(e.clientX - startX);
        selection.height = Math.abs(e.clientY - startY);
        
        // Calculate top-left position (in case user drags left or up)
        selection.x = Math.min(e.clientX, startX);
        selection.y = Math.min(e.clientY, startY);
        
        // Update the selection element
        updateSelectionElement();
    } else if (isDragging) {
        // Move the entire selection
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        selection.x += deltaX;
        selection.y += deltaY;
        
        // Update starting point for next move
        startX = e.clientX;
        startY = e.clientY;
        
        // Update the selection element
        updateSelectionElement();
    } else if (isResizing) {
        // Resize the selection based on which handle is being dragged
        resizeSelection(e);
        
        // Update the selection element
        updateSelectionElement();
    }
}

// Handle mouse up event (finish selection/drag/resize)
function handleMouseUp() {
    // If we were selecting and have a valid selection size, show capture actions
    if ((isSelecting || isDragging || isResizing) && 
        selection.width > 10 && selection.height > 10) {
        document.getElementById('captureActions').classList.remove('hidden');
    }
    
    // Reset flags
    isSelecting = false;
    isDragging = false;
    isResizing = false;
    currentResizeHandle = null;
}

// Update the selection element position and size
function updateSelectionElement() {
    // Update position and size
    selectionElement.style.left = `${selection.x}px`;
    selectionElement.style.top = `${selection.y}px`;
    selectionElement.style.width = `${selection.width}px`;
    selectionElement.style.height = `${selection.height}px`;
    
    // Update info text
    selectionInfo.textContent = `${Math.round(selection.width)} × ${Math.round(selection.height)}`;
    
    // Position the info text above the selection
    if (selection.y < 40) {
        selectionInfo.style.top = 'auto';
        selectionInfo.style.bottom = '-30px';
    } else {
        selectionInfo.style.top = '-30px';
        selectionInfo.style.bottom = 'auto';
    }
}

// Resize the selection based on which handle is being dragged
function resizeSelection(e) {
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    switch (currentResizeHandle) {
        case 'top-left':
            const newWidthTL = selection.x + selection.width - currentX;
            const newHeightTL = selection.y + selection.height - currentY;
            
            if (newWidthTL > 10) {
                selection.x = currentX;
                selection.width = newWidthTL;
            }
            
            if (newHeightTL > 10) {
                selection.y = currentY;
                selection.height = newHeightTL;
            }
            break;
            
        case 'top-right':
            const newWidthTR = currentX - selection.x;
            const newHeightTR = selection.y + selection.height - currentY;
            
            if (newWidthTR > 10) {
                selection.width = newWidthTR;
            }
            
            if (newHeightTR > 10) {
                selection.y = currentY;
                selection.height = newHeightTR;
            }
            break;
            
        case 'bottom-left':
            const newWidthBL = selection.x + selection.width - currentX;
            const newHeightBL = currentY - selection.y;
            
            if (newWidthBL > 10) {
                selection.x = currentX;
                selection.width = newWidthBL;
            }
            
            if (newHeightBL > 10) {
                selection.height = newHeightBL;
            }
            break;
            
        case 'bottom-right':
            const newWidthBR = currentX - selection.x;
            const newHeightBR = currentY - selection.y;
            
            if (newWidthBR > 10) {
                selection.width = newWidthBR;
            }
            
            if (newHeightBR > 10) {
                selection.height = newHeightBR;
            }
            break;
    }
}

// Capture the selected region
function captureSelection() {
    // Show loading indicator
    showLoading();
    
    // Make sure we have a screenshot
    if (!screenshotDataUrl) {
        alert('Screenshot data not available. Please try again.');
        closeCaptureTool();
        return;
    }
    
    // Crop the screenshot to the selected region
    cropScreenshot(screenshotDataUrl, selection, (croppedDataUrl) => {
        // Send the cropped screenshot to the background script
        chrome.runtime.sendMessage({ 
            action: 'processScreenshot', 
            screenshot: croppedDataUrl,
            region: selection
        }, () => {
            // Close the capture tool
            closeCaptureTool();
        });
    });
}

// Crop the screenshot to the selected region
function cropScreenshot(dataUrl, region, callback) {
    const canvas = document.getElementById('screenshotCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // Set canvas size to the selection size
        canvas.width = region.width;
        canvas.height = region.height;
        
        // Draw only the selected portion
        ctx.drawImage(
            img,
            region.x, region.y, region.width, region.height,
            0, 0, region.width, region.height
        );
        
        // Get the cropped image as data URL
        const croppedDataUrl = canvas.toDataURL('image/png');
        callback(croppedDataUrl);
    };
    
    img.src = dataUrl;
}

// Cancel the capture and close the tool
function cancelCapture() {
    chrome.runtime.sendMessage({ action: 'cancelCapture' });
    closeCaptureTool();
}

// Close the capture tool
function closeCaptureTool() {
    window.close();
}

// Show loading indicator
function showLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    loadingElement.appendChild(spinner);
    document.body.appendChild(loadingElement);
}

// Handle messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'error') {
        alert(message.error);
        closeCaptureTool();
    }
});