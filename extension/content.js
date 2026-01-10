chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoTitle') {
        const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
        const title = titleElement ? titleElement.textContent : 'Unknown Video';
        sendResponse({ title: title });
    }
    return true;
});