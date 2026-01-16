from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from rag_pipeline import YouTubeRAG
from openai import OpenAI

# Load environment variables
load_dotenv()

app = FastAPI(
    title="QuickTube AI Analyzer API",
    description="AI-powered YouTube video analyzer using RAG",
    version="1.0.0"
)

# CORS - Allow Chrome extension to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG and OpenAI client
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key:
    rag = YouTubeRAG(openai_key)
    client = OpenAI(api_key=openai_key)
else:
    rag = None
    client = None


# Request Models
class VideoURLRequest(BaseModel):
    video_url: str


class QuestionRequest(BaseModel):
    video_url: str
    question: str
    conversation_context: str = ""  # Previous conversation for context


class SummaryRequest(BaseModel):
    video_url: str
    style: str = "detailed"


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


def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL"""
    return rag.extract_video_id(url) if rag else url


def get_transcript(video_id: str) -> str:
    """Fetch transcript from YouTube video"""
    return rag.get_transcript(video_id) if rag else ""


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




@app.post("/api/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about the video using RAG pipeline"""
    try:
        if not rag or not client:
            raise HTTPException(status_code=500, detail="RAG pipeline or OpenAI API key not configured")
        
        # Check if this is a polite/conversational message
        polite_inputs = ['thank', 'thanks', 'thankyou', 'thank you', 'okay', 'ok', 'alright', 'got it', 'i see', 'i understand', 'good', 'great', 'nice', 'cool', 'awesome', 'perfect', 'sure', 'yes', 'no']
        user_input_lower = request.question.lower().strip().replace('!', '').replace('?', '')
        
        # If input is just a polite response, handle it naturally
        
        # Use RAG pipeline to answer the question
        video_id = rag.extract_video_id(request.video_url)
        transcript = rag.get_transcript(video_id)
        
        # Process transcript with RAG
        rag.process_transcript(transcript)
        
        # Ask the question using RAG chain
        answer = rag.ask_question(request.question)
        
        return AnswerResponse(
            video_id=video_id,
            question=request.question,
            answer=answer,
            success=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
