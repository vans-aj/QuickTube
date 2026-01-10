from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from rag_pipeline import YouTubeRAG

# Load environment variables
load_dotenv()

app = FastAPI(
    title="QuickTube AI Analyzer API",
    description="AI-powered YouTube video analyzer with RAG",
    version="1.0.0"
)

# CORS - Allow Chrome extension to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store RAG instances (in production, use Redis/database)
rag_instances = {}


# Request Models
class VideoURLRequest(BaseModel):
    video_url: str


class QuestionRequest(BaseModel):
    video_url: str
    question: str


class SummaryRequest(BaseModel):
    video_url: str
    style: str = "detailed"  # brief, detailed, bullets


# Response Models
class TranscriptResponse(BaseModel):
    video_id: str
    transcript: str
    success: bool


class SummaryResponse(BaseModel):
    video_id: str
    summary: str
    style: str
    success: bool


class AnswerResponse(BaseModel):
    video_id: str
    question: str
    answer: str
    success: bool


@app.get("/")
async def root():
    return {
        "message": "QuickTube AI Analyzer API",
        "version": "1.0.0",
        "endpoints": [
            "/api/transcript",
            "/api/summarize",
            "/api/ask"
        ]
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/transcript", response_model=TranscriptResponse)
async def get_transcript(request: VideoURLRequest):
    """Extract transcript from YouTube video"""
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        rag = YouTubeRAG(openai_key)
        video_id = rag.extract_video_id(request.video_url)
        transcript = rag.get_transcript(video_id)
        
        # Store RAG instance for this video
        rag_instances[video_id] = rag
        
        return TranscriptResponse(
            video_id=video_id,
            transcript=transcript,
            success=True
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/summarize", response_model=SummaryResponse)
async def summarize_video(request: SummaryRequest):
    """Generate AI summary of YouTube video"""
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        rag = YouTubeRAG(openai_key)
        video_id = rag.extract_video_id(request.video_url)
        
        # Get transcript
        transcript = rag.get_transcript(video_id)
        
        # Process for RAG (store for future questions)
        rag.process_transcript(transcript)
        rag_instances[video_id] = rag
        
        # Generate summary
        summary = rag.summarize(transcript, style=request.style)
        
        return SummaryResponse(
            video_id=video_id,
            summary=summary,
            style=request.style,
            success=True
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about the video using RAG"""
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        video_id = request.video_url.split("v=")[-1].split("&")[0] if "v=" in request.video_url else request.video_url
        
        # Check if we already have RAG instance for this video
        if video_id not in rag_instances:
            rag = YouTubeRAG(openai_key)
            transcript = rag.get_transcript(video_id)
            rag.process_transcript(transcript)
            rag_instances[video_id] = rag
        
        rag = rag_instances[video_id]
        answer = rag.ask_question(request.question)
        
        return AnswerResponse(
            video_id=video_id,
            question=request.question,
            answer=answer,
            success=True
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)