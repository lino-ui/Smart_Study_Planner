import os
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from typing import List, Dict, Any

from app.core.config import settings

# Initialize Google Generative AI for embeddings
genai.configure(api_key=settings.GEMINI_API_KEY)

# Initialize local ChromaDB
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
os.makedirs(CHROMA_DB_DIR, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Get or create a collection
# We use a single collection and filter by user_id to isolate tenants.
collection = chroma_client.get_or_create_collection(name="user_documents")

def generate_embedding(text: str) -> list[float]:
    """
    Generates an embedding vector for the text using Gemini.
    """
    if not settings.GEMINI_API_KEY:
        # Fallback for dev without key: Return a dummy vector (Chroma requires standard length, usually 768 for models)
        # Actually, if no key, we can't do real RAG. We'll return 0s if possible, or raise error.
        return [0.0] * 768 
        
    result = genai.embed_content(
        model="models/embedding-001",
        content=text,
        task_type="retrieval_document"
    )
    return result['embedding']

def generate_query_embedding(text: str) -> list[float]:
    if not settings.GEMINI_API_KEY:
        return [0.0] * 768
    result = genai.embed_content(
        model="models/embedding-001",
        content=text,
        task_type="retrieval_query"
    )
    return result['embedding']

def add_documents_to_store(user_id: int, document_id: int, chunks: List[str]):
    """
    Embeds and stores chunks in ChromaDB with metadata.
    """
    if not chunks:
        return
        
    ids = []
    embeddings = []
    metadatas = []
    documents = []
    
    for i, chunk in enumerate(chunks):
        ids.append(f"doc_{document_id}_chunk_{i}")
        documents.append(chunk)
        # We compute embeddings manually since Chroma's default is SentenceTransformers (heavy)
        embeddings.append(generate_embedding(chunk))
        metadatas.append({
            "user_id": user_id,
            "document_id": document_id,
            "chunk_index": i
        })
        
    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )

def query_user_documents(query: str, user_id: int, top_k: int = 3, document_ids: List[int] = None) -> str:
    """
    Retrieves the most relevant chunks for a given query and user.
    """
    query_emb = generate_query_embedding(query)
    
    # Build where filter
    where_filter = {"user_id": user_id}
    if document_ids:
        # ChromaDB syntax for IN operator if multiple, or simple equals if single
        if len(document_ids) == 1:
            where_filter["document_id"] = document_ids[0]
        else:
            where_filter["document_id"] = {"$in": document_ids}
            
    results = collection.query(
        query_embeddings=[query_emb],
        n_results=top_k,
        where=where_filter
    )
    
    if not results['documents'] or not results['documents'][0]:
        return ""
        
    # Combine retrieved chunks into a single context string
    retrieved_texts = results['documents'][0]
    context = "\n\n---\n\n".join(retrieved_texts)
    
    return context

def delete_document_from_store(document_id: int):
    """
    Removes all chunks associated with a document_id.
    """
    collection.delete(where={"document_id": document_id})
