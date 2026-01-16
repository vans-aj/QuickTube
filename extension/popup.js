// API Configuration
const API_BASE_URL = 'http://localhost:8000';

let currentVideoUrl = '';
let currentVideoId = '';
let qaHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkYouTubePage();
    setupEventListeners();
});

// Load Q&A history for current video from Chrome storage
async function loadQAHistory() {
    return new Promise((resolve) => {
        // Use video ID as the storage key for per-video history
        chrome.storage.session.get([`chat_${currentVideoId}`], (result) => {
            const key = `chat_${currentVideoId}`;
            if (result[key]) {
                qaHistory = result[key];
            } else {
                qaHistory = [];
            }
            displayChatMessages();
            resolve();
        });
    });
}

// Save Q&A history to Chrome storage with video ID as key
function saveQAHistory() {
    const key = `chat_${currentVideoId}`;
    chrome.storage.session.set({ [key]: qaHistory });
}

// Display chat messages
function displayChatMessages() {
    const messagesArea = document.getElementById('messagesArea');
    
    if (qaHistory.length === 0) {
        messagesArea.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <p>Start asking questions about the video...</p>
            </div>
        `;
        return;
    }
    
    messagesArea.innerHTML = '';
    
    // Reverse to show oldest first
    [...qaHistory].reverse().forEach(item => {
        // User message
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `<div class="message-bubble">${escapeHtml(item.question)}</div>`;
        messagesArea.appendChild(userMsg);
        
        // Bot response
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.innerHTML = `<div class="message-bubble">${escapeHtml(item.answer)}</div>`;
        messagesArea.appendChild(botMsg);
    });
    
    // Auto-scroll to bottom
    setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);
}

// Check if on YouTube page and get video URL
async function checkYouTubePage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || !tab.url.includes('youtube.com/watch')) {
            document.getElementById('messagesArea').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📺</div>
                    <p>Please open a YouTube video to use QuickTube</p>
                </div>
            `;
            document.getElementById('videoInfo').style.display = 'none';
            document.getElementById('askButton').disabled = true;
            document.getElementById('questionInput').disabled = true;
            return;
        }

        currentVideoUrl = tab.url;
        
        // Extract video ID from URL
        if (currentVideoUrl.includes('youtu.be/')) {
            currentVideoId = currentVideoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (currentVideoUrl.includes('youtube.com/watch?v=')) {
            currentVideoId = currentVideoUrl.split('v=')[1].split('&')[0];
        }
        
        document.getElementById('videoInfo').classList.add('show');
        
        // Load chat history for this specific video
        await loadQAHistory();
        
        // Get video title from page
        chrome.tabs.sendMessage(tab.id, { action: 'getVideoTitle' }, (response) => {
            if (response && response.title) {
                document.getElementById('videoTitle').textContent = response.title;
            }
        });
    } catch (error) {
        console.error('Error checking page:', error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    const askButton = document.getElementById('askButton');
    const questionInput = document.getElementById('questionInput');
    
    // Send on button click
    askButton.addEventListener('click', askQuestion);
    
    // Send on Enter key (Shift+Enter for new line)
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    });
    
    // Auto-resize textarea
    questionInput.addEventListener('input', () => {
        questionInput.style.height = 'auto';
        questionInput.style.height = Math.min(questionInput.scrollHeight, 80) + 'px';
    });
}

// Ask Question
async function askQuestion() {
    const question = document.getElementById('questionInput').value.trim();
    
    if (!question) {
        return;
    }

    // Disable input during request
    const askButton = document.getElementById('askButton');
    const questionInput = document.getElementById('questionInput');
    askButton.disabled = true;
    questionInput.disabled = true;
    
    // Add user message immediately
    const messagesArea = document.getElementById('messagesArea');
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.innerHTML = `<div class="message-bubble">${escapeHtml(question)}</div>`;
    messagesArea.appendChild(userMsg);
    
    // Add loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'message bot';
    loadingMsg.innerHTML = `
        <div class="message-bubble loading">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        </div>
    `;
    messagesArea.appendChild(loadingMsg);
    
    // Auto-scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    try {
        // Build conversation context from last 3 items
        let conversationContext = '';
        if (qaHistory.length > 0) {
            conversationContext = '\n\nPrevious conversation:\n';
            const lastItems = qaHistory.slice(0, Math.min(3, qaHistory.length));
            for (let item of lastItems) {
                conversationContext += `Q: ${item.question}\nA: ${item.answer}\n\n`;
            }
        }

        const response = await fetch(`${API_BASE_URL}/api/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_url: currentVideoUrl,
                question: question,
                conversation_context: conversationContext
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get answer');
        }

        const data = await response.json();
        
        // Remove loading indicator
        loadingMsg.remove();
        
        // Add bot response
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.innerHTML = `<div class="message-bubble">${escapeHtml(data.answer)}</div>`;
        messagesArea.appendChild(botMsg);
        
        // Add to history
        addToQAHistory(question, data.answer);
        
        // Auto-scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;

    } catch (error) {
        console.error('Error:', error);
        loadingMsg.remove();
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'message bot';
        errorMsg.innerHTML = `<div class="message-bubble error-message" style="background: #fee; color: #c33; border-bottom-left-radius: 12px;">Error: ${escapeHtml(error.message)}</div>`;
        messagesArea.appendChild(errorMsg);
    } finally {
        // Re-enable input
        askButton.disabled = false;
        questionInput.disabled = false;
        questionInput.value = '';
        questionInput.style.height = 'auto';
        questionInput.focus();
    }
}

// Add to Q&A History
function addToQAHistory(question, answer) {
    qaHistory.unshift({
        question: question,
        answer: answer,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // Keep only last 50 items per video
    if (qaHistory.length > 50) {
        qaHistory.pop();
    }
    
    saveQAHistory();
}

// Clear chat for current video
function clearCurrentChat() {
    if (confirm('Clear chat for this video?')) {
        qaHistory = [];
        const key = `chat_${currentVideoId}`;
        chrome.storage.session.remove([key]);
        displayChatMessages();
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}