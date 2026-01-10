QuickTube AI Analyzer - Backend API
FastAPI backend for the YouTube video analyzer Chrome extension.

🚀 Features
Extract YouTube video transcripts
AI-powered summarization (brief, detailed, bullets)
Q&A using RAG (Retrieval Augmented Generation)
FAISS vector database for semantic search
🛠️ Tech Stack
FastAPI - Modern Python web framework
LangChain - RAG pipeline orchestration
OpenAI API - GPT-4 for summarization and Q&A
FAISS - Vector similarity search
youtube-transcript-api - Transcript extraction
📦 Installation
1. Clone the repository
bash
git clone <your-repo-url>
cd backend
2. Create virtual environment
bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
3. Install dependencies
bash
pip install -r requirements.txt
4. Setup environment variables
bash
cp .env.example .env
# Edit .env and add your OpenAI API key
5. Run the server
bash
python main.py
Server will start at http://localhost:8000

📚 API Endpoints
1. Get Transcript
http
POST /api/transcript
Content-Type: application/json

{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
2. Generate Summary
http
POST /api/summarize
Content-Type: application/json

{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "style": "detailed"  // brief, detailed, bullets
}
3. Ask Question
http
POST /api/ask
Content-Type: application/json

{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "question": "What are the main topics?"
}
🚀 Deployment (Render.com)
1. Push to GitHub
bash
git add .
git commit -m "Initial commit"
git push origin main
2. Deploy on Render
Go to Render.com
Click "New +" → "Web Service"
Connect your GitHub repository
Configure:
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Environment Variables: Add OPENAI_API_KEY
Click "Create Web Service"
Your API will be live at: https://your-app.onrender.com

🧪 Testing
Test with curl:

bash
curl -X POST http://localhost:8000/api/transcript \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://www.youtube.com/watch?v=fNk_zzaMoSs"}'
📝 Environment Variables
OPENAI_API_KEY - Your OpenAI API key (required)
PORT - Server port (default: 8000)
🔧 Development
Run in development mode with auto-reload:

bash
uvicorn main:app --reload
Access API documentation:

Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
