chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoTitle') {
        // Try multiple selectors as YouTube DOM changes
        let title = 'Unknown Video';
        const selectors = [
            'h1.ytd-watch-metadata yt-formatted-string',
            'h1.style-scope.ytd-watch-metadata',
            'div#info-strings h1',
            'h1.watch-title-container span',
            'h1 yt-formatted-string'
        ];
        
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                title = element.textContent.trim();
                break;
            }
        }
        sendResponse({ title: title });
    }
    return true;
});