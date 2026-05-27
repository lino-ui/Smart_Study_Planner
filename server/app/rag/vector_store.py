import os
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from typing import List, Dict, Any

from app.core.config import settings

# Load API key cleanly, falling back to direct active key if empty
API_KEY = settings.GEMINI_API_KEY
if not API_KEY or API_KEY == "dummy-key":
    API_KEY = "AIzaSyCrbvdklOMhF4Fm7f9_KjmNLRw_pxzSiEg"

# Initialize Google Generative AI for embeddings
genai.configure(api_key=API_KEY)

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
    if not API_KEY or API_KEY == "dummy-key":
        # Fallback for dev without key: Return a dummy vector (768 length)
        return [0.0] * 768 
        
    try:
        # Use standard modern text-embedding-004 model
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embeddings with models/text-embedding-004: {e}")
        try:
            # Fallback to gemini-embedding-2 model if text-embedding-004 fails
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as inner_e:
            raise Exception(f"Failed to generate embeddings using Google Generative AI: {inner_e}")

def generate_query_embedding(text: str) -> list[float]:
    if not API_KEY or API_KEY == "dummy-key":
        return [0.0] * 768
        
    try:
        # Use standard modern text-embedding-004 model
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating query embeddings with models/text-embedding-004: {e}")
        try:
            # Fallback to gemini-embedding-2 model if text-embedding-004 fails
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as inner_e:
            raise Exception(f"Failed to generate query embeddings using Google Generative AI: {inner_e}")

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
