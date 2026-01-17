const API_BASE_URL = 'http://localhost:8000';

let currentVideoUrl = '';
let currentVideoId = '';
let qaHistory = [];

// Initialize on popup load
window.addEventListener('load', async () => {
    console.log('Popup loaded, initializing...');
    await checkYouTubePage();
    setupEventListeners();
    setupTabs();
});

async function checkYouTubePage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        currentVideoUrl = url;
        
        // Extract video ID
        if (url.includes('youtube.com/watch')) {
            currentVideoId = new URL(url).searchParams.get('v');
        } else if (url.includes('youtu.be')) {
            currentVideoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        
        console.log('Video ID:', currentVideoId);
        
        if (currentVideoId) {
            const titleEl = document.getElementById('videoTitle');
            if (titleEl) {
                titleEl.textContent = 'Video loaded';
            }
            await loadQAHistory();
        }
    } catch (error) {
        console.error('Error checking page:', error);
    }
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
}

async function loadQAHistory() {
    return new Promise((resolve) => {
        const key = `chat_${currentVideoId}`;
        chrome.storage.session.get([key], (result) => {
            qaHistory = result[key] || [];
            displayQASection();
            resolve();
        });
    });
}

function displayQASection() {
    const qaSection = document.getElementById('qaSection');
    
    if (qaHistory.length === 0) {
        qaSection.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <div class="empty-text">Ask anything about this video</div>
                <div class="empty-subtext">Try the quick actions above or type your own question</div>
            </div>
        `;
    } else {
        qaSection.innerHTML = qaHistory.map(item => `
            <div class="qa-item">
                <div class="question">Q: ${escapeHtml(item.question)}</div>
                <div class="answer">${escapeHtml(item.answer)}</div>
            </div>
        `).join('');
    }
}

function setupEventListeners() {
    const textarea = document.querySelector('textarea');
    
    if (textarea) {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        });
        
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askQuestion();
            }
        });
    }
}

async function askQuestion() {
    if (!currentVideoId) {
        alert('Please open a YouTube video');
        return;
    }
    
    const textarea = document.querySelector('textarea');
    const question = textarea.value.trim();
    
    if (!question) return;
    
    const sendButton = document.querySelector('.send-button');
    sendButton.disabled = true;
    
    // Add to history
    qaHistory.unshift({ question, answer: 'Loading...' });
    displayQASection();
    textarea.value = '';
    textarea.style.height = 'auto';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_url: currentVideoUrl,
                question: question
            })
        });
        
        const data = await response.json();
        qaHistory[0].answer = data.answer;
        saveQAHistory();
        displayQASection();
    } catch (err) {
        qaHistory[0].answer = 'Error: Backend not responding';
        displayQASection();
    } finally {
        sendButton.disabled = false;
    }
}

function askQuickQuestion(question) {
    document.querySelector('textarea').value = question;
    askQuestion();
}

function saveQAHistory() {
    const key = `chat_${currentVideoId}`;
    chrome.storage.session.set({ [key]: qaHistory });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Summary functionality
document.addEventListener('DOMContentLoaded', () => {
    const summaryOptions = document.querySelectorAll('.summary-option');
    summaryOptions.forEach(option => {
        option.addEventListener('click', () => {
            summaryOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
});
