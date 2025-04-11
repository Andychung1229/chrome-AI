# Canvas Vision AI Assistant

A Chrome extension for analyzing Canvas content using OpenAI's Vision API.

## Features

- **Screenshot Capture**: Capture any portion of your Canvas page with an easy-to-use selection tool
- **AI Analysis**: Analyze screenshots using OpenAI's Vision API for detailed explanations
- **Chat Interface**: Ask follow-up questions about your screenshots in a simple chat interface
- **Context Awareness**: The AI understands Canvas-specific content like assignments, discussions, and lecture materials
- **Note Storage**: Save important insights for future reference
- **Privacy-Focused**: Your data stays local; only the screenshots you select are sent for analysis
- **Canvas Integration**: Works seamlessly with any Canvas LMS instance

## Use Cases

- Get explanations for complex course materials
- Summarize lecture slides and notes
- Understand assignment instructions better
- Analyze graphs, diagrams, and visual content in your courses
- Get help with difficult concepts without leaving your browser

## Project Structure

```
canvas-vision-assistant/
├── manifest.json        # Extension configuration
├── background.js        # Background service worker
├── popup.html           # Main extension popup UI
├── popup.js             # Popup functionality
├── popup.css            # Popup styling
├── screenshotCrop.html  # Screenshot selection interface
├── screenshotCrop.js    # Screenshot functionality
├── screenshotCrop.css   # Screenshot UI styling
├── utils.js             # Utility functions
├── icons/
│   ├── icon16.png       # Small icon
│   ├── icon48.png       # Medium icon
│   └── icon128.png      # Large icon
└── README.md            # Documentation
```

## Installation

### Installation from Chrome Web Store

~~This extension is available in the Chrome Web Store: [Canvas Vision AI Assistant](https://chrome.google.com/webstore/detail/canvas-vision-ai-assistant/abcdefghijklmnopqrstuvwxyz)~~

*Note: This extension is currently under development and not yet available in the Chrome Web Store.*

### Manual Installation (Development Version)

1. Download the extension files:
   - GitHub repo: [https://github.com/yourusername/canvas-vision-assistant](https://github.com/yourusername/canvas-vision-assistant)
   - Or download directly: [canvas-vision-assistant.zip](https://github.com/yourusername/canvas-vision-assistant/releases/download/v1.0/canvas-vision-assistant.zip)

2. Extract the ZIP file to a folder on your computer

3. Open Chrome and navigate to `chrome://extensions/`

4. Enable "Developer mode" by toggling the switch in the top right corner

5. Click "Load unpacked" and select the folder containing the extension files

6. The extension icon should now appear in your browser toolbar

## Setup

1. Click on the extension icon to open the popup

2. Enter your OpenAI API key in the settings section
   - If you don't have an API key, you can get one from [OpenAI](https://platform.openai.com/api-keys)

3. The extension is now ready to use!

## Usage

1. Navigate to any Canvas page with content you want to analyze

2. Click the extension icon and select "Screenshot"

3. Select the area of the screen you want to analyze

4. The AI will analyze the screenshot and provide insights

5. Ask follow-up questions in the chat interface

## Privacy

This extension:
- Only sends the screenshots you explicitly capture to OpenAI
- Stores your API key locally in Chrome's secure storage
- Does not track your browsing or collect any usage data
- Does not modify any Canvas content

## Requirements

- Google Chrome browser (v88 or newer)
- An OpenAI API key with access to the Vision API

## Feedback and Support

For bugs, feature requests, or support, please:
- Create an issue on GitHub: [Report an Issue](https://github.com/yourusername/canvas-vision-assistant/issues)
- Send an email to: youremail@example.com

## License

MIT License - See [LICENSE](LICENSE) for details

---

*Note: This extension is not affiliated with or endorsed by Canvas LMS or OpenAI.*
