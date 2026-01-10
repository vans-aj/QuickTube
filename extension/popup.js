// API Configuration
const API_BASE_URL = 'http://localhost:8000'; // Change this after deployment
// For local testing: const API_BASE_URL = 'http://localhost:8000';

let currentVideoUrl = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkYouTubePage();
    setupEventListeners();
});

// Check if on YouTube page and get video URL
async function checkYouTubePage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || !tab.url.includes('youtube.com/watch')) {
            showElement('notYouTube');
            hideElement('videoInfo');
            return;
        }

        currentVideoUrl = tab.url;
        hideElement('notYouTube');
        showElement('videoInfo');
        
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
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Summary
    document.getElementById('summarizeBtn').addEventListener('click', generateSummary);
    document.getElementById('copySummary').addEventListener('click', () => copyToClipboard('summaryText'));

    // Q&A
    document.getElementById('askBtn').addEventListener('click', askQuestion);
    document.getElementById('copyAnswer').addEventListener('click', () => copyToClipboard('answerText'));

    // Transcript
    document.getElementById('getTranscriptBtn').addEventListener('click', getTranscript);
    document.getElementById('copyTranscript').addEventListener('click', () => copyToClipboard('transcriptText'));
}

// Tab Switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
}

// Generate Summary
async function generateSummary() {
    const style = document.getElementById('summaryStyle').value;
    
    showLoading();
    hideError();
    hideElement('summaryResult');

    try {
        const response = await fetch(`${API_BASE_URL}/api/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_url: currentVideoUrl,
                style: style
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate summary');
        }

        const data = await response.json();
        
        document.getElementById('summaryText').textContent = data.summary;
        showElement('summaryResult');
        
        // Add fade-in animation
        document.getElementById('summaryResult').classList.add('fade-in');

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Ask Question
async function askQuestion() {
    const question = document.getElementById('questionInput').value.trim();
    
    if (!question) {
        showError('Please enter a question');
        return;
    }

    showLoading();
    hideError();
    hideElement('answerResult');

    try {
        const response = await fetch(`${API_BASE_URL}/api/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_url: currentVideoUrl,
                question: question
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get answer');
        }

        const data = await response.json();
        
        document.getElementById('answerText').textContent = data.answer;
        showElement('answerResult');
        
        // Add to history
        addToQAHistory(question, data.answer);
        
        // Clear input
        document.getElementById('questionInput').value = '';

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Get Transcript
async function getTranscript() {
    showLoading();
    hideError();
    hideElement('transcriptResult');

    try {
        const response = await fetch(`${API_BASE_URL}/api/transcript`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_url: currentVideoUrl
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get transcript');
        }

        const data = await response.json();
        
        document.getElementById('transcriptText').textContent = data.transcript;
        showElement('transcriptResult');

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Add to Q&A History
function addToQAHistory(question, answer) {
    const historyDiv = document.getElementById('qaHistory');
    const historyItem = document.createElement('div');
    historyItem.className = 'bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm fade-in';
    historyItem.innerHTML = `
        <p class="font-medium text-gray-800 mb-1">Q: ${question}</p>
        <p class="text-gray-600">A: ${answer}</p>
    `;
    historyDiv.prepend(historyItem);
}

// Copy to Clipboard
async function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    try {
        await navigator.clipboard.writeText(text);
        showTemporaryMessage('Copied to clipboard!');
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
}

// Show temporary success message
function showTemporaryMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg fade-in';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 2000);
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}