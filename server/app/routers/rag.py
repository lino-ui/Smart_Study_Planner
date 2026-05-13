from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.document import Document
from app.models.subject import Subject
from app.schemas.document import DocumentResponse, RagQueryRequest, RagQueryResponse
from app.rag.document_processor import extract_text_from_file, chunk_text
from app.rag.vector_store import add_documents_to_store, query_user_documents, delete_document_from_store

# We also need the LLM client to generate the final grounded response
from app.llm.client import llm_client

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    subject_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a document, extracts text, chunks it, and stores in ChromaDB.
    """
    if not file.filename.lower().endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
        
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size > 5 * 1024 * 1024: # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Limit is 5MB.")

    # 1. Extract and Chunk Text
    try:
        text = extract_text_from_file(file_bytes, file.filename)
        chunks = chunk_text(text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process document: {str(e)}")
        
    if not chunks:
        raise HTTPException(status_code=400, detail="Document appears to be empty or unreadable.")

    # 2. Save DB Metadata
    db_doc = Document(
        user_id=current_user.id,
        title=file.filename.rsplit('.', 1)[0].replace('_', ' ').title(),
        filename=file.filename,
        file_type=file.filename.rsplit('.', 1)[1].lower(),
        file_size_bytes=file_size,
        subject_id=subject_id
    )
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)

    # 3. Store in Vector Store
    try:
        add_documents_to_store(current_user.id, db_doc.id, chunks)
    except Exception as e:
        # If vector store fails, rollback DB
        await db.delete(db_doc)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

    response_dict = db_doc.__dict__.copy()
    if subject_id:
        sub = await db.get(Subject, subject_id)
        if sub:
            response_dict["subject_name"] = sub.name

    return response_dict

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.subject))
        .where(Document.user_id == current_user.id)
        .order_by(Document.upload_date.desc())
    )
    docs = result.scalars().all()
    
    resp = []
    for d in docs:
        d_dict = d.__dict__.copy()
        if d.subject:
            d_dict["subject_name"] = d.subject.name
        resp.append(d_dict)
    return resp

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await db.delete(doc)
    await db.commit()
    
    # Delete from Vector Store
    delete_document_from_store(document_id)
    
    return None

@router.post("/query-context", response_model=RagQueryResponse)
async def query_with_context(
    request: RagQueryRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    RAG Endpoint: Retrieves context and queries LLM.
    """
    # 1. Retrieve Context
    context = query_user_documents(
        query=request.query, 
        user_id=current_user.id, 
        document_ids=request.document_ids
    )
    
    if not context:
        # No context found, return a polite failure or just use raw LLM
        return RagQueryResponse(
            answer="I couldn't find any relevant information in your uploaded notes to answer this question. Please try asking a different question or uploading more related documents.",
            context_used=False
        )

    # 2. Formulate Prompt
    system_prompt = f"""You are an intelligent study assistant.
The user has asked a question based on their uploaded study notes.
Here is the extracted context from their notes. Answer their question strictly using ONLY the provided context. If the answer is not in the context, say so. Do not use outside knowledge.

--- CONTEXT ---
{context}
---------------
"""

    # 3. Ask LLM
    try:
        answer = await llm_client.generate_response(
            system_prompt=system_prompt,
            history=[],
            new_message=request.query
        )
        return RagQueryResponse(answer=answer, context_used=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get answer from AI.")
