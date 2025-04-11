// Global variables
let apiKey = '';
let currentScreenshot = null;
let isSettingsVisible = false;
let isApiKeyVisible = false;
let isTyping = false;
let conversationHistory = [];

// Initialize the chat interface
document.addEventListener('DOMContentLoaded', () => {
    // Load saved API key
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKey = result.apiKey;
            document.getElementById('apiKey').value = apiKey;
        } else {
            // If no API key is set, show settings panel
            toggleSettings(true);
        }
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Auto-resize textarea on input
    const userInput = document.getElementById('userInput');
    userInput.addEventListener('input', autoResizeTextarea);
});

// Set up all event listeners
function setupEventListeners() {
    // Settings related
    document.getElementById('settingsBtn').addEventListener('click', () => toggleSettings(true));
    document.getElementById('closeSettingsBtn').addEventListener('click', () => toggleSettings(false));
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('toggleApiVisibility').addEventListener('click', toggleApiKeyVisibility);
    
    // Chat related
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keydown', handleInputKeydown);
    document.getElementById('clearChatBtn').addEventListener('click', clearChat);
    document.getElementById('newCaptureBtn').addEventListener('click', initiateNewCapture);
}

// Toggle settings panel visibility
function toggleSettings(show) {
    isSettingsVisible = show !== undefined ? show : !isSettingsVisible;
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
    const model = document.getElementById('modelSelect').value;
    
    if (newApiKey) {
        apiKey = newApiKey;
        chrome.storage.local.set({ apiKey, model }, () => {
            showNotification('Settings saved successfully!');
            toggleSettings(false);
        });
    } else {
        showNotification('Please enter a valid API key', true);
    }
}

// Handle key presses in the input field
function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea based on content
function autoResizeTextarea() {
    const textarea = document.getElementById('userInput');
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Send a message to the API
function sendMessage() {
    // Get the user's message
    const userInput = document.getElementById('userInput');
    const userMessage = userInput.value.trim();
    
    // Don't send empty messages
    if (!userMessage) return;
    
    // Add the user's message to the chat
    addUserMessage(userMessage);
    
    // Clear the input field
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Add user message to conversation history
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });
    
    // Prepare the request for OpenAI Vision API
    const requestData = prepareOpenAIRequest(userMessage);
    
    // Call the OpenAI API
    callOpenAIAPI(requestData);
}

// Prepare the request data for OpenAI API
function prepareOpenAIRequest(userMessage) {
    // Get selected model
    const model = document.getElementById('modelSelect').value || 'gpt-4-vision-preview';
    
    // Build messages array with the conversation history and the screenshot
    const messages = [
        {
            role: 'system',
            content: 'You are Canvas Vision Assistant, an AI that helps analyze screenshots from Canvas LMS. Provide helpful, concise analysis of Canvas content. When you see assignment details, due dates, grades, or other Canvas UI elements, explain them clearly. Keep your answers focused on what is visible in the screenshot.'
        }
    ];
    
    // Add initial message with screenshot if this is the first message
    if (conversationHistory.length === 1) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: 'Here is a screenshot from Canvas LMS: ' },
                { 
                    type: 'image_url', 
                    image_url: { url: currentScreenshot }
                },
                { type: 'text', text: userMessage }
            ]
        });
    } else {
        // For follow-up questions, include the conversation history
        conversationHistory.forEach(msg => {
            if (msg.role === 'user' && msg === conversationHistory[0]) {
                // First user message includes the image
                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Here is a screenshot from Canvas LMS: ' },
                        { 
                            type: 'image_url', 
                            image_url: { url: currentScreenshot }
                        },
                        { type: 'text', text: msg.content }
                    ]
                });
            } else {
                // Other messages are just text
                messages.push(msg);
            }
        });
    }
    
    return {
        model: model,
        messages: messages,
        max_tokens: 1000
    };
}

// Call the OpenAI API
function callOpenAIAPI(requestData) {
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error?.message || 'API request failed');
            });
        }
        return response.json();
    })
    .then(data => {
        // Hide typing indicator
        hideTypingIndicator();
        
        // Get the AI's response
        const aiResponse = data.choices[0].message.content;
        
        // Add the response to the chat
        addAIMessage(aiResponse);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
    })
    .catch(error => {
        hideTypingIndicator();
        addErrorMessage(`Error: ${error.message}`);
        console.error('API Error:', error);
    });
}

// Add a user message to the chat
function addUserMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove welcome screen if it exists
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.textContent = text;
    
    // Add to chat
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
}

// Add an AI message to the chat
function addAIMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message';
    
    // Use simple markdown-like parsing for code blocks, lists, etc.
    // For a full markdown implementation, you'd want to use a library
    const formattedText = formatMarkdown(text);
    messageElement.innerHTML = formattedText;
    
    // Add to chat
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
}

// Add the screenshot to the chat
function addScreenshotToChat(dataUrl) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove welcome screen if it exists
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    // Create screenshot container
    const screenshotContainer = document.createElement('div');
    screenshotContainer.className = 'screenshot-container';
    
    // Create image element
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Screenshot from Canvas';
    screenshotContainer.appendChild(img);
    
    // Add caption
    const caption = document.createElement('div');
    caption.className = 'screenshot-caption';
    caption.textContent = 'Canvas Screenshot';
    screenshotContainer.appendChild(caption);
    
    // Add to chat
    chatMessages.appendChild(screenshotContainer);
    
    // Add initial AI message
    addAIMessage('I can help analyze this Canvas screenshot. What would you like to know about it?');
    
    // Scroll to bottom
    scrollToBottom();
}

// Add an error message to the chat
function addErrorMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = text;
    
    // Add to chat
    chatMessages.appendChild(errorElement);
    
    // Scroll to bottom
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typingIndicator';
    typingIndicator.className = 'typing-indicator';
    
    // Add dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingIndicator.appendChild(dot);
    }
    
    // Add to chat
    chatMessages.appendChild(typingIndicator);
    
    // Scroll to bottom
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// Clear the chat
function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    
    // Clear messages but keep the screenshot
    chatMessages.innerHTML = '';
    
    // Reset conversation history
    conversationHistory = [];
    
    // If we have a screenshot, re-add it
    if (currentScreenshot) {
        addScreenshotToChat(currentScreenshot);
    } else {
        // Add welcome screen if no screenshot
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen';
        welcomeScreen.innerHTML = `
            <h2>Analyze your Canvas screenshot</h2>
            <p>Ask a question about the screenshot you captured</p>
        `;
        chatMessages.appendChild(welcomeScreen);
    }
}

// Start a new screen capture
function initiateNewCapture() {
    chrome.runtime.sendMessage({ action: 'initiateScreenCapture' });
    window.close();
}

// Format text with basic markdown-like syntax
function formatMarkdown(text) {
    // Handle code blocks
    text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle bullet lists
    text = text.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>').replace(/<li>(.+)<\/li>\s*<li>/g, '<li>$1</li><li>');
    
    // Handle numbered lists
    text = text.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>').replace(/<li>(.+)<\/li>\s*<li>/g, '<li>$1</li><li>');
    
    // Wrap adjacent list items in ul/ol tags
    if (text.includes('<li>')) {
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }
    
    // Handle paragraphs
    text = text.split('\n\n').map(para => {
        if (!para.trim().startsWith('<')) {
            return `<p>${para}</p>`;
        }
        return para;
    }).join('');
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Scroll to the bottom of the chat
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show a notification
function showNotification(message, isError = false) {
    console.log(message);
    // You could implement a toast notification here
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setScreenshot') {
        currentScreenshot = message.screenshot;
        
        // Add screenshot to chat
        addScreenshotToChat(currentScreenshot);
    }
});