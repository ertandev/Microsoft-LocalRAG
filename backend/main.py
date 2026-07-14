from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import sqlite3
import json
import math
import openai
from typing import List, Dict, Any
import os
from foundry_local_sdk import Configuration, FoundryLocalManager

DB_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.db")

app = FastAPI(title="Local RAG API", description="FastAPI Backend for local RAG chatbot using Microsoft Foundry Local")

# Enable CORS for React frontend (default Vite port is 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development we can allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for Foundry resources
manager = None
embedding_client = None
local_client = None
chat_alias = "phi-3.5-mini"

# Similarity calculation function
def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot_product = sum(x * y for x, y in zip(v1, v2))
    norm_v1 = math.sqrt(sum(x * x for x in v1))
    norm_v2 = math.sqrt(sum(x * x for x in v2))
    if not norm_v1 or not norm_v2:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

# Start models and local web service on startup
@app.on_event("startup")
def startup_event():
    global manager, embedding_client, local_client
    try:
        print("Starting Foundry Local SDK...")
        config = Configuration(app_name="local_rag_app")
        try:
            FoundryLocalManager.initialize(config)
        except Exception:
            # Already initialized
            pass
        manager = FoundryLocalManager.instance

        # Load embedding model
        print("Loading embedding model...")
        embed_model = manager.catalog.get_model("qwen3-embedding-0.6b")
        embed_model.load()
        embedding_client = embed_model.get_embedding_client()

        # Load chat model
        print("Loading chat model...")
        chat_model = manager.catalog.get_model(chat_alias)
        chat_model.load()

        # Start service
        print("Starting local web service...")
        try:
            manager.start_web_service()
        except Exception:
            # Already running
            pass
            
        local_url = manager.urls[0]
        print(f"Local web service running at {local_url}")

        local_client = openai.OpenAI(
            base_url=f"{local_url}/v1",
            api_key="local-key"
        )
        
        # Initialize chat history tables in SQLite
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_pinned INTEGER DEFAULT 0
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                role TEXT,
                content TEXT,
                context TEXT,
                score REAL,
                file_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_metadata (
                file_name TEXT PRIMARY KEY,
                is_pinned INTEGER DEFAULT 0
            )
        """)
        
        # Migrations for existing DB instances
        try:
            cursor.execute("ALTER TABLE sessions ADD COLUMN is_pinned INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass # Already exists
            
        conn.commit()
        conn.close()

        print("Foundry Local initialized successfully!")
    except Exception as e:
        print(f"Error during startup initialization: {e}")

# Shutdown hook to stop service
@app.on_event("shutdown")
def shutdown_event():
    global manager
    if manager:
        print("Stopping local web service...")
        try:
            manager.stop_web_service()
        except Exception:
            pass

# Request models
class ChatRequest(BaseModel):
    question: str
    target_file: str = None

class FileResponse(BaseModel):
    file_name: str
    chunks_count: int
    is_pinned: bool

@app.get("/api/status")
def get_status():
    return {
        "status": "ready",
        "chat_model": chat_alias,
        "embedding_model": "qwen3-embedding-0.6b",
        "api_endpoint": manager.urls[0] if manager and manager.urls else None
    }

@app.get("/api/documents", response_model=List[FileResponse])
def get_documents():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.file_name, COUNT(d.text), COALESCE(m.is_pinned, 0)
            FROM documents d
            LEFT JOIN document_metadata m ON d.file_name = m.file_name
            WHERE d.file_name IS NOT NULL
            GROUP BY d.file_name
            ORDER BY COALESCE(m.is_pinned, 0) DESC, d.file_name ASC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [{"file_name": r[0] if r[0] else "Unknown File", "chunks_count": r[1], "is_pinned": bool(r[2])} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    global embedding_client, local_client
    if not embedding_client or not local_client:
        raise HTTPException(status_code=503, detail="Models are not initialized yet.")
    
    question = request.question.strip()
    target_file = request.target_file
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        # 1. Generate query vector
        query_response = embedding_client.generate_embedding(question)
        query_vector = query_response.data[0].embedding

        # 2. Retrieve document vectors from SQLite
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        if target_file:
            cursor.execute("SELECT text, embedding, file_name FROM documents WHERE file_name = ?", (target_file,))
        else:
            cursor.execute("SELECT text, embedding, file_name FROM documents")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            if target_file:
                return {
                    "answer": f"No content found for the selected document '{target_file}'. Please make sure it is indexed.",
                    "context": "No chunks found in database.",
                    "score": 0.0,
                    "file_name": target_file
                }
            else:
                return {
                    "answer": "No documents found in the database to search. Please upload and index documents first.",
                    "context": "Database is empty.",
                    "score": 0.0,
                    "file_name": "None"
                }

        # 3. Calculate similarities
        results = []
        for row in rows:
          doc_text = row[0]
          doc_vector = json.loads(row[1])
          doc_file_name = row[2] if row[2] else "Unknown File"
          score = cosine_similarity(query_vector, doc_vector)
          results.append((doc_text, score, doc_file_name))

        # Sort and select the top match
        results.sort(key=lambda x: x[1], reverse=True)
        top_text, top_score, top_file_name = results[0]

        # Grounding check: if score is too low, handle gracefully
        if top_score < 0.15:
          context_text = "The available source text is insufficient or irrelevant."
        else:
          context_text = top_text

        # 4. Construct prompt and generate answer
        system_prompt = (
            "You are a knowledgeable and helpful assistant.\n"
            "Answer the user's question by strictly adhering to the 'SOURCE TEXT' provided below.\n"
            "Rules:\n"
            "1. Use only the information from the provided source text.\n"
            "2. Do not make up or assume anything not directly mentioned in the source text.\n"
            "3. If the source text is insufficient or the information is not found, state this politely without guessing.\n"
            "4. Provide a clear, correct, and fluent response in English.\n\n"
            f"SOURCE TEXT:\n{context_text}"
        )

        response = local_client.chat.completions.create(
            model=chat_alias,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.3
        )

        answer = response.choices[0].message.content
        return {
            "answer": answer,
            "context": top_text,
            "score": round(top_score * 100, 2),
            "file_name": top_file_name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing chat completion: {str(e)}")

class MessageStoreRequest(BaseModel):
    role: str
    content: str
    context: str = None
    score: float = None
    file_name: str = None

class SessionCreateRequest(BaseModel):
    id: str
    title: str

@app.get("/api/sessions")
def get_sessions():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, created_at, is_pinned FROM sessions ORDER BY is_pinned DESC, created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "title": r[1], "created_at": r[2], "is_pinned": bool(r[3])} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions")
def create_session(request: SessionCreateRequest):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT OR IGNORE INTO sessions (id, title) VALUES (?, ?)", (request.id, request.title))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}/messages")
def get_session_messages(session_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT role, content, context, score, file_name FROM chat_history WHERE session_id = ? ORDER BY id ASC", (session_id,))
        rows = cursor.fetchall()
        conn.close()
        return [{
            "role": r[0],
            "content": r[1],
            "context": r[2],
            "score": r[3],
            "file_name": r[4]
        } for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/messages")
def save_session_message(session_id: str, request: MessageStoreRequest):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_history (session_id, role, content, context, score, file_name) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, request.role, request.content, request.context, request.score, request.file_name)
        )
        # Update session title if it was default and this is the first user message
        cursor.execute("SELECT COUNT(*) FROM chat_history WHERE session_id = ?", (session_id,))
        count = cursor.fetchone()[0]
        if count == 1 and request.role == "user":
            title = request.content[:35] + "..." if len(request.content) > 35 else request.content
            cursor.execute("UPDATE sessions SET title = ? WHERE id = ?", (title, session_id))
        
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        cursor.execute("DELETE FROM chat_history WHERE session_id = ?", (session_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PinToggleRequest(BaseModel):
    is_pinned: bool

@app.put("/api/sessions/{session_id}/pin")
def pin_session(session_id: str, request: PinToggleRequest):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE sessions SET is_pinned = ? WHERE id = ?", (int(request.is_pinned), session_id))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/documents/{filename:path}/pin")
def pin_document(filename: str, request: PinToggleRequest):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO document_metadata (file_name, is_pinned) VALUES (?, ?)", (filename, int(request.is_pinned)))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
def upload_document(file: UploadFile = File(...)):
    global embedding_client
    if not embedding_client:
        raise HTTPException(status_code=503, detail="Embedding model is not initialized yet.")
        
    try:
        # Save file to documents directory
        docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "documents")
        if not os.path.exists(docs_dir):
            os.makedirs(docs_dir)
            
        file_path = os.path.join(docs_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process and ingest the new file dynamically
        from backend.ingest import extract_text, get_chunks
        
        raw_text = extract_text(file_path)
        if not raw_text:
            raise HTTPException(status_code=400, detail="Text could not be extracted or the file type is not supported.")
            
        chunks = get_chunks(raw_text)
        if not chunks:
            raise HTTPException(status_code=400, detail="The file is empty or could not be chunked.")
            
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        for chunk in chunks:
            if not chunk.strip():
                continue
            response = embedding_client.generate_embedding(chunk)
            vector = response.data[0].embedding
            vector_str = json.dumps(vector)
            cursor.execute("INSERT INTO documents (text, embedding, file_name) VALUES (?, ?, ?)", (chunk, vector_str, file.filename))
            
        conn.commit()
        conn.close()
        
        return {"status": "success", "filename": file.filename, "chunks": len(chunks)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/documents/{filename}")
def delete_document(filename: str):
    try:
        # Delete chunks from SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE file_name = ?", (filename,))
        cursor.execute("DELETE FROM document_metadata WHERE file_name = ?", (filename,))
        conn.commit()
        conn.close()
        
        # Delete file from local documents directory
        docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "documents")
        file_path = os.path.join(docs_dir, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"status": "success"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
