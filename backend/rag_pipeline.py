from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
import os


class YouTubeRAG:
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        os.environ["OPENAI_API_KEY"] = openai_api_key
        
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        self.vectorstore = None
        self.chain = None
    
    def extract_video_id(self, url: str) -> str:
        """Extract video ID from YouTube URL"""
        if "youtu.be/" in url:
            return url.split("youtu.be/")[1].split("?")[0]
        elif "youtube.com/watch?v=" in url:
            return url.split("v=")[1].split("&")[0]
        else:
            return url
    
    def get_transcript(self, video_id: str) -> str:
        """Fetch transcript from YouTube video"""
        try:
            ytt_api = YouTubeTranscriptApi()
            data = ytt_api.fetch(video_id, languages=["en"])
        except NoTranscriptFound:
            try:
                data = ytt_api.fetch(video_id, languages=["hi"])
            except Exception as e:
                raise Exception(f"No transcript found for this video: {str(e)}")
        except TranscriptsDisabled:
            raise Exception("Transcripts are disabled for this video")
        except Exception as e:
            raise Exception(f"Error fetching transcript: {str(e)}")
        
        # Handle both dict and object formats from the API
        transcript_parts = []
        for item in data:
            if isinstance(item, dict):
                transcript_parts.append(item['text'])
            else:
                # FetchedTranscriptSnippet object
                transcript_parts.append(item.text)
        
        transcript = " ".join(transcript_parts)
        return transcript
    
    def process_transcript(self, transcript: str):
        """Split transcript and create vector store with RAG chain"""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = splitter.create_documents([transcript])
        
        self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        
        # Create improved RAG chain prompt
        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are a helpful AI assistant analyzing a YouTube video transcript.

CONTEXT FROM VIDEO:
{context}

USER QUESTION: {question}

INSTRUCTIONS:
1. Answer based ONLY on the provided context
2. Be conversational and helpful
3. If the answer exists in context, provide a clear answer
4. If NOT found in context, say "I don't know based on this video"
5. Do NOT make up information
6. Try to give time stamp if possible
7. if the query is like thanks or something genral so you can answer
ANSWER:"""
        )
        
        def format_docs(retrieved_docs):
            return "\n\n".join(doc.page_content for doc in retrieved_docs)
        
        parallel_chain = RunnableParallel({
            'context': retriever | RunnableLambda(format_docs),
            'question': RunnablePassthrough()
        })
        
        parser = StrOutputParser()
        self.chain = parallel_chain | prompt | self.llm | parser
    
    def ask_question(self, question: str) -> str:
        """Ask a question about the video"""
        if not self.chain:
            raise Exception("Please process a transcript first")
        return self.chain.invoke(question)
    
    def summarize(self, transcript: str, style: str = "detailed") -> str:
        """Generate summary of the video using RAG chain"""
        # First process the transcript to create RAG chain if not already done
        if not self.chain:
            self.process_transcript(transcript)
        
        # Create a summarization prompt that uses the RAG chain
        if style == "brief":
            summary_question = "Provide a brief 2-3 sentence summary of the main points in this video."
        elif style == "bullets":
            summary_question = "List 5-7 key points from this video in bullet format."
        else:  # detailed
            summary_question = "Provide a detailed 3-4 paragraph summary of the main topics and key takeaways from this video."
        
        # Use the RAG chain to generate summary with context from the video
        summary = self.chain.invoke(summary_question)
        return summary