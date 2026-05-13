from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    subject_id: Optional[int] = None

class DocumentCreate(DocumentBase):
    filename: str
    file_type: str
    file_size_bytes: int

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    filename: str
    file_type: str
    file_size_bytes: int
    upload_date: datetime
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True

class RagQueryRequest(BaseModel):
    query: str
    document_ids: Optional[List[int]] = None # Optional filters

class RagQueryResponse(BaseModel):
    answer: str
    context_used: bool
