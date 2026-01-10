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
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
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
        
        transcript = " ".join(item.text for item in data.snippets)
        return transcript
    
    def process_transcript(self, transcript: str):
        """Split transcript and create vector store"""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = splitter.create_documents([transcript])
        
        self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 4}
        )
        
        # Create RAG chain
        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template="""Use the following context from a YouTube video to answer the question.
If the answer is not found in the context, say "I don't know based on this video".

Context: {context}

Question: {question}

Answer:"""
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
        """Generate summary of the video"""
        if style == "brief":
            prompt = f"""Summarize this YouTube video transcript in 2-3 sentences:

{transcript[:3000]}

Brief Summary:"""
        elif style == "bullets":
            prompt = f"""Create a bullet-point summary of this YouTube video transcript with 5-7 key points:

{transcript[:3000]}

Key Points:"""
        else:  # detailed
            prompt = f"""Provide a detailed summary of this YouTube video transcript in 3-4 paragraphs:

{transcript[:3000]}

Detailed Summary:"""
        
        response = self.llm.invoke(prompt)
        return response.content