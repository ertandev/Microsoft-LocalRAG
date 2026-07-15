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
import threading
import time
import psutil
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
embedding_alias = "qwen3-embedding-0.6b"

# Global download state
download_state = {
    "status": "idle",       # "idle", "downloading", "success", "error", "cancelled"
    "model_alias": None,
    "progress": 0.0,
    "downloaded_mb": 0.0,
    "total_mb": 0.0,
    "speed": "",
    "error": None
}
download_cancel_event = None
download_lock = threading.Lock()

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
        embed_model = manager.catalog.get_model(embedding_alias)
        if not embed_model.is_cached:
            print(f"Downloading default embedding model: {embedding_alias}...")
            embed_model.download()
        embed_model.load()
        embedding_client = embed_model.get_embedding_client()

        # Load chat model
        print("Loading chat model...")
        chat_model = manager.catalog.get_model(chat_alias)
        if not chat_model.is_cached:
            print(f"Downloading default chat model: {chat_alias}...")
            chat_model.download()
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
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT,
                embedding TEXT,
                file_name TEXT,
                embedding_model TEXT
            )
        """)
        
        # Migrations for existing DB instances
        try:
            cursor.execute("ALTER TABLE sessions ADD COLUMN is_pinned INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass # Already exists
            
        try:
            cursor.execute("ALTER TABLE documents ADD COLUMN embedding_model TEXT")
        except sqlite3.OperationalError:
            pass # Already exists
            
        # Update existing records to default embedding model if empty
        cursor.execute("UPDATE documents SET embedding_model = 'qwen3-embedding-8b' WHERE embedding_model IS NULL OR embedding_model = ''")
            
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
    embedding_model: str
    is_compatible: bool

class ModelSelectRequest(BaseModel):
    chat_model: str = None
    embedding_model: str = None

class ModelDeleteRequest(BaseModel):
    model_alias: str

@app.get("/api/status")
def get_status():
    return {
        "status": "ready",
        "chat_model": chat_alias,
        "embedding_model": embedding_alias,
        "api_endpoint": manager.urls[0] if manager and manager.urls else None
    }

@app.get("/api/models")
def get_models():
    global manager
    if not manager:
        raise HTTPException(status_code=503, detail="Foundry Local not initialized.")
    try:
        models = manager.catalog.list_models()
        model_list = []
        for m in models:
            capabilities = getattr(m, 'capabilities', '')
            input_modalities = getattr(m, 'input_modalities', '')
            
            # Extract file size in MB
            file_size_mb = 0
            if hasattr(m, 'info') and m.info:
                file_size_mb = getattr(m.info, 'file_size_mb', 0) or 0
            
            if 'embedding' in capabilities:
                model_type = "embedding"
            elif 'reasoning' in capabilities or 'tool-calling' in capabilities or 'text' in input_modalities:
                model_type = "chat"
            else:
                model_type = "other"
                
            model_list.append({
                "alias": getattr(m, 'alias', ''),
                "id": getattr(m, 'id', ''),
                "capabilities": capabilities,
                "input_modalities": input_modalities,
                "is_cached": bool(getattr(m, 'is_cached', False)),
                "is_loaded": bool(getattr(m, 'is_loaded', False)),
                "file_size_mb": file_size_mb,
                "type": model_type
            })
        return {"models": model_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_model_download_in_background(model_alias, chat_or_embed):
    global download_state, download_cancel_event, embedding_client, local_client, chat_alias, embedding_alias, manager
    
    # Initialize download variables
    cancel_event = threading.Event()
    with download_lock:
        download_cancel_event = cancel_event
        download_state = {
            "status": "downloading",
            "model_alias": model_alias,
            "progress": 0.0,
            "downloaded_mb": 0.0,
            "total_mb": 0.0,
            "speed": "0 KB/s",
            "error": None
        }
    
    try:
        model = manager.catalog.get_model(model_alias)
        file_size_mb = 1000
        if hasattr(model, 'info') and model.info:
            file_size_mb = getattr(model.info, 'file_size_mb', 1000) or 1000
            
        last_time = [time.time()]
        last_net_bytes = [psutil.net_io_counters().bytes_recv]
            
        # Detect if it's a percentage (0.0 - 100.0) or raw MBs.
        # ONNX chat models return percentage, embedding models return MBs.
        is_percentage = (chat_or_embed == "chat")

        def progress_callback(progress_value):
            global download_state
            current_time = time.time()
            delta_time = current_time - last_time[0]
            
            with download_lock:
                if download_state["status"] == "downloading":
                    if is_percentage:
                        percentage = min(round(progress_value, 2), 100.0)
                        ratio = progress_value / 100.0
                        downloaded_mb = ratio * file_size_mb
                        total_mb = file_size_mb
                    else:
                        total_mb = max(file_size_mb, progress_value)
                        percentage = min(round((progress_value / total_mb) * 100, 2), 100.0) if total_mb > 0 else 0.0
                        downloaded_mb = progress_value
                        
                    download_state["progress"] = percentage
                    download_state["downloaded_mb"] = round(downloaded_mb, 2)
                    download_state["total_mb"] = round(total_mb, 2)
                    
                    if delta_time >= 0.5:
                        current_net_bytes = psutil.net_io_counters().bytes_recv
                        delta_bytes = current_net_bytes - last_net_bytes[0]
                        
                        speed_mb_s = (delta_bytes / delta_time) / (1024 * 1024) if delta_time > 0 else 0
                        if speed_mb_s >= 1.0:
                            download_state["speed"] = f"{round(speed_mb_s, 1)} MB/s"
                        else:
                            download_state["speed"] = f"{round(speed_mb_s * 1024, 0):.0f} KB/s"
                        
                        last_time[0] = current_time
                        last_net_bytes[0] = current_net_bytes
                    
        # Start download
        model.download(progress_callback=progress_callback, cancel_event=cancel_event)
        
        # If cancelled, check event
        if cancel_event.is_set():
            raise Exception("Operation cancelled")
            
        # Load the model after downloading
        model.load()
        
        # Post-load initialization
        if chat_or_embed == "chat":
            # Unload old model
            try:
                old_chat_model = manager.catalog.get_model(chat_alias)
                old_chat_model.unload()
            except Exception:
                pass
            chat_alias = model_alias
            
            # Recreate OpenAI local client
            local_url = manager.urls[0]
            local_client = openai.OpenAI(
                base_url=f"{local_url}/v1",
                api_key="local-key"
            )
        else:
            # Unload old model
            try:
                old_embed_model = manager.catalog.get_model(embedding_alias)
                old_embed_model.unload()
            except Exception:
                pass
            embedding_alias = model_alias
            embedding_client = model.get_embedding_client()
            
        with download_lock:
            download_state["status"] = "success"
            download_state["progress"] = 100.0
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        err_msg = str(e)
        status = "error"
        if "cancelled" in err_msg.lower() or cancel_event.is_set():
            status = "cancelled"
            err_msg = "Download cancelled by user."
            
        with download_lock:
            download_state["status"] = status
            download_state["error"] = err_msg
            
        # Clean up partial download files from cache
        try:
            print(f"Cleaning up partial download files for {model_alias}...")
            model = manager.catalog.get_model(model_alias)
            
            # Retry deletion on Windows due to asynchronous file locks
            deleted = False
            for i in range(5):
                try:
                    time.sleep(0.5)
                    model.remove_from_cache()
                    deleted = True
                    print(f"Successfully cleaned up cache for {model_alias} via SDK.")
                    break
                except Exception as del_err:
                    print(f"SDK deletion attempt {i+1} failed: {del_err}")
            
            if not deleted and hasattr(model, 'get_path'):
                model_path = model.get_path()
                if model_path:
                    # Let's delete the version directory or the parent model name directory
                    parent_path = os.path.dirname(model_path)
                    if os.path.exists(parent_path):
                        for i in range(5):
                            try:
                                time.sleep(0.5)
                                shutil.rmtree(parent_path)
                                print(f"Manually cleaned up model folder: {parent_path}")
                                break
                            except Exception as manual_del_err:
                                print(f"Manual deletion attempt {i+1} failed: {manual_del_err}")
        except Exception as cleanup_err:
            print(f"Failed to clean up partial cache: {cleanup_err}")
            
    finally:
        with download_lock:
            download_cancel_event = None

@app.get("/api/models/download-status")
def get_download_status():
    global download_state
    with download_lock:
        return download_state

@app.post("/api/models/download-cancel")
def cancel_download():
    global download_cancel_event, download_state
    with download_lock:
        if download_state["status"] == "downloading" and download_cancel_event:
            print("Cancelling download...")
            download_cancel_event.set()
            return {"status": "success", "message": "Cancellation request sent."}
        else:
            return {"status": "error", "message": "No active download to cancel."}

@app.post("/api/models/delete")
def delete_model(request: ModelDeleteRequest):
    global manager, chat_alias, embedding_alias
    if not manager:
        raise HTTPException(status_code=503, detail="Foundry Local not initialized.")
    try:
        alias = request.model_alias
        # Protect default models
        defaults = ["phi-3.5-mini", "qwen3-embedding-8b", "qwen3-embedding-0.6b"]
        if alias in defaults:
            raise HTTPException(status_code=400, detail="Cannot delete default system models.")
            
        # Protect active models
        if alias == chat_alias or alias == embedding_alias:
            raise HTTPException(status_code=400, detail="Cannot delete a model that is currently active and loaded.")
            
        model = manager.catalog.get_model(alias)
        if not model.is_cached:
            raise HTTPException(status_code=400, detail="Model is not cached locally.")
            
        # Unload if loaded
        try:
            model.unload()
        except Exception:
            pass
            
        model.remove_from_cache()
        return {"status": "success", "message": f"Model {alias} removed from local cache."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/models/select")
def select_models(request: ModelSelectRequest):
    global manager, embedding_client, local_client, chat_alias, embedding_alias, download_state
    if not manager:
        raise HTTPException(status_code=503, detail="Foundry Local not initialized.")
        
    try:
        # Check if a download is already in progress
        with download_lock:
            if download_state["status"] == "downloading":
                raise HTTPException(status_code=400, detail=f"Another download is already in progress: {download_state['model_alias']}")
                
        # Load embedding model if requested and different
        if request.embedding_model and request.embedding_model != embedding_alias:
            print(f"Switching embedding model to: {request.embedding_model}")
            new_embed_model = manager.catalog.get_model(request.embedding_model)
            if not new_embed_model.is_cached:
                print(f"Embedding model not cached. Starting background download: {request.embedding_model}")
                thread = threading.Thread(
                    target=run_model_download_in_background,
                    args=(request.embedding_model, "embedding")
                )
                thread.daemon = True
                thread.start()
                return {
                    "status": "downloading",
                    "chat_model": chat_alias,
                    "embedding_model": embedding_alias
                }
            else:
                new_embed_model.load()
                new_embedding_client = new_embed_model.get_embedding_client()
                
                # Unload old model
                try:
                    old_embed_model = manager.catalog.get_model(embedding_alias)
                    old_embed_model.unload()
                except Exception as e:
                    print(f"Error unloading old embedding model: {e}")
                    
                embedding_alias = request.embedding_model
                embedding_client = new_embedding_client
                
        # Load chat model if requested and different
        if request.chat_model and request.chat_model != chat_alias:
            print(f"Switching chat model to: {request.chat_model}")
            new_chat_model = manager.catalog.get_model(request.chat_model)
            if not new_chat_model.is_cached:
                print(f"Chat model not cached. Starting background download: {request.chat_model}")
                thread = threading.Thread(
                    target=run_model_download_in_background,
                    args=(request.chat_model, "chat")
                )
                thread.daemon = True
                thread.start()
                return {
                    "status": "downloading",
                    "chat_model": chat_alias,
                    "embedding_model": embedding_alias
                }
            else:
                new_chat_model.load()
                
                # Unload old model
                try:
                    old_chat_model = manager.catalog.get_model(chat_alias)
                    old_chat_model.unload()
                except Exception as e:
                    print(f"Error unloading old chat model: {e}")
                    
                chat_alias = request.chat_model
                
                # Recreate local_client openAI instance to make sure base URL or model configuration is fresh
                local_url = manager.urls[0]
                local_client = openai.OpenAI(
                    base_url=f"{local_url}/v1",
                    api_key="local-key"
                )
                
        return {
            "status": "success",
            "chat_model": chat_alias,
            "embedding_model": embedding_alias
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents", response_model=List[FileResponse])
def get_documents():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.file_name, COUNT(d.text), COALESCE(m.is_pinned, 0), COALESCE(MAX(d.embedding_model), 'qwen3-embedding-8b')
            FROM documents d
            LEFT JOIN document_metadata m ON d.file_name = m.file_name
            WHERE d.file_name IS NOT NULL
            GROUP BY d.file_name
            ORDER BY COALESCE(m.is_pinned, 0) DESC, d.file_name ASC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [{
            "file_name": r[0] if r[0] else "Unknown File", 
            "chunks_count": r[1], 
            "is_pinned": bool(r[2]),
            "embedding_model": r[3],
            "is_compatible": r[3] == embedding_alias
        } for r in rows]
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

        # 2. Retrieve document vectors from SQLite (filtering by active embedding model to prevent dimension mismatches)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        if target_file:
            cursor.execute("SELECT text, embedding, file_name FROM documents WHERE file_name = ? AND embedding_model = ?", (target_file, embedding_alias))
        else:
            cursor.execute("SELECT text, embedding, file_name FROM documents WHERE embedding_model = ?", (embedding_alias,))
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

        # Sort and select the top matches
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Filter matches above threshold
        valid_matches = [r for r in results if r[1] >= 0.15]
        
        if not valid_matches:
            top_text = results[0][0]
            top_score = results[0][1]
            top_file_name = results[0][2]
            context_text = "The available source text is insufficient or irrelevant."
        else:
            # Take top 3 valid matches
            top_matches = valid_matches[:3]
            top_text = top_matches[0][0] # Primary context for UI meta
            top_score = top_matches[0][1]
            top_file_name = top_matches[0][2]
            
            # Combine the texts from the top 3 chunks for context
            combined_texts = []
            for idx, (text, score, file_name) in enumerate(top_matches):
                combined_texts.append(f"[Source {idx+1}: {file_name} (Similarity: {round(score*100, 1)}%)]\n{text}")
            context_text = "\n\n".join(combined_texts)

        # 4. Construct prompt and generate answer
        system_prompt = (
            "You are a local, offline support AI assistant specialized in document-based information retrieval.\n\n"
            "Behaviour Rules:\n"
            "- Always prioritize safety. If the procedure or topic involves risk, explicitly call out warnings.\n"
            "- Do not hallucinate or guess procedures, measurements, timelines, or specifications.\n"
            "- Answer the user's question by strictly adhering to the 'SOURCE TEXTS' provided below.\n"
            "- If the answer is not in the provided source texts, state: 'This information is not available in the local knowledge base.'\n"
            "- Be concise, direct, and structure your responses with bullet points or numbered lists where applicable.\n\n"
            f"SOURCE TEXTS:\n{context_text}"
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
            cursor.execute("INSERT INTO documents (text, embedding, file_name, embedding_model) VALUES (?, ?, ?, ?)", (chunk, vector_str, file.filename, embedding_alias))
            
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
