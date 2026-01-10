🎬 QuickTube AI Analyzer
AI-powered Chrome extension for analyzing YouTube videos with instant summaries and intelligent Q&A.

Show Image
Show Image

✨ Features
🚀 Instant Transcript Extraction - Get full video transcripts in seconds
🤖 AI-Powered Summaries - Multiple summary styles (brief, detailed, bullet points)
💬 Intelligent Q&A - Ask questions about the video using RAG technology
🎯 Context-Aware Answers - Powered by GPT-4 and vector similarity search
📋 Copy to Clipboard - Easy export of summaries and answers
🎨 Clean Modern UI - Professional and user-friendly interface
🎥 Demo
[Add demo GIF or video here]

🛠️ Tech Stack
Backend
FastAPI - High-performance Python web framework
LangChain - RAG pipeline orchestration
OpenAI GPT-4 - Language model for summaries and Q&A
FAISS - Vector database for semantic search
youtube-transcript-api - Transcript extraction
Frontend
Chrome Extension (Manifest V3) - Browser extension
Vanilla JavaScript - Lightweight and fast
Tailwind CSS - Modern styling
Deployment
Render.com - Backend API hosting (free tier)
GitHub - Code repository and version control
📸 Screenshots
Summary Tab
[Add screenshot]

Q&A Tab
[Add screenshot]

Transcript Tab
[Add screenshot]

🚀 Installation
Prerequisites
Python 3.8+
OpenAI API key (Get one here)
Chrome browser
Backend Setup
Clone the repository
bash
git clone https://github.com/yourusername/quicktube-analyzer.git
cd quicktube-analyzer/backend
Create virtual environment
bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
Install dependencies
bash
pip install -r requirements.txt
Setup environment variables
bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
Run the server
bash
python main.py
Backend will be running at http://localhost:8000

Chrome Extension Setup
Update API URL
javascript
// In extension/popup.js, update line 2:
const API_BASE_URL = 'http://localhost:8000';
// After deployment, change to your Render URL
Load extension in Chrome
Open Chrome and go to chrome://extensions/
Enable "Developer mode" (top right)
Click "Load unpacked"
Select the extension folder
Extension is now installed! 🎉
Test it out
Go to any YouTube video
Click the extension icon
Start analyzing!
📚 API Documentation
Once the backend is running, visit:

Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
Endpoints
Method	Endpoint	Description
GET	/	API information
POST	/api/transcript	Get video transcript
POST	/api/summarize	Generate AI summary
POST	/api/ask	Ask questions (RAG)
🚀 Deployment
Deploy Backend to Render
Push code to GitHub
bash
git add .
git commit -m "Ready for deployment"
git push origin main
Create Render account at render.com
Create new Web Service
Connect your GitHub repository
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Add Environment Variable
Key: OPENAI_API_KEY
Value: Your OpenAI API key
Deploy! Your API will be live at https://your-app.onrender.com
Update Extension
javascript
// In extension/popup.js:
const API_BASE_URL = 'https://your-app.onrender.com';
🎯 Usage
Open a YouTube video in Chrome
Click the extension icon in your toolbar
Choose your action:
Summary Tab: Select style and generate summary
Q&A Tab: Type a question and get AI-powered answer
Transcript Tab: View full video transcript
Copy results with one click
🔧 Development
Run Backend in Dev Mode
bash
cd backend
uvicorn main:app --reload
Test API with curl
bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "style": "detailed"
  }'
🐛 Troubleshooting
"OpenAI API key not configured"
Make sure you've added OPENAI_API_KEY to your .env file (backend)
For Render deployment, add it in Environment Variables
"No transcript found"
Some videos don't have transcripts available
Try a different video with captions/subtitles
Extension not working
Check if you're on a YouTube video page (youtube.com/watch?v=...)
Check browser console for errors (F12)
Verify API URL in popup.js matches your backend
📊 Project Structure
quicktube-analyzer/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── rag_pipeline.py      # RAG logic
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   └── README.md
│
├── extension/
│   ├── manifest.json        # Extension config
│   ├── popup.html           # UI
│   ├── popup.js             # Logic
│   ├── content.js           # YouTube page script
│   └── icons/               # Extension icons
│
└── README.md                # This file
🤝 Contributing
Contributions are welcome! Feel free to:

Report bugs
Suggest features
Submit pull requests
📝 License
MIT License - see LICENSE file for details

👨‍💻 Author
Your Name

GitHub: @yourusername
LinkedIn: Your Profile
🙏 Acknowledgments
OpenAI for GPT-4 API
LangChain for RAG framework
3Blue1Brown for inspiration (test video)
⭐ Star this repo if you find it helpful!

💼 Built for internship applications - Demonstrates full-stack development, AI integration, and deployment skills.

