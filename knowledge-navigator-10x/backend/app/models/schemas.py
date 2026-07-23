"""Pydantic schemas for Knowledge Navigator 10X API."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    token: str

# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: Optional[datetime] = None
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    question: str
    persona: str = "operations_analyst"
    domain: Optional[str] = None
    conversation_history: Optional[List[ChatMessage]] = []
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class SourceDocument(BaseModel):
    content: str
    metadata: Dict[str, Any]
    relevance_score: Optional[float] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceDocument] = []
    suggested_questions: List[str] = []
    domain_detected: Optional[str] = None
    persona: str = "operations_analyst"
    response_time: Optional[float] = None
    session_id: str

# ─── Top 10 ──────────────────────────────────────────────────────────────────

class Top10Request(BaseModel):
    topic: str
    domain: Optional[str] = None
    persona: str = "operations_analyst"

class Top10Item(BaseModel):
    rank: int
    title: str
    description: str
    action: Optional[str] = None
    priority: Optional[str] = "medium"

class Top10Response(BaseModel):
    topic: str
    domain: Optional[str] = None
    items: List[Top10Item]
    summary: str
    generated_at: datetime

# ─── Documents ───────────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str
    chunks_created: int
    domain: str

class DocumentSearchRequest(BaseModel):
    query: str
    domain: Optional[str] = None
    top_k: int = 5

class DocumentSearchResult(BaseModel):
    content: str
    metadata: Dict[str, Any]
    score: float

# ─── Analytics ───────────────────────────────────────────────────────────────

class SearchHistoryItem(BaseModel):
    id: str
    question: str
    persona: str
    domain: Optional[str]
    timestamp: datetime
    response_time: float
    session_id: str

class AnalyticsResponse(BaseModel):
    total_queries: int
    domain_distribution: Dict[str, int]
    persona_distribution: Dict[str, int]
    top_queries: List[Dict[str, Any]]
    daily_trends: List[Dict[str, Any]]
    avg_response_time: float
    knowledge_gaps: List[str]

class HealthResponse(BaseModel):
    status: str
    version: str
    ai_provider: str
    vector_store: str
    knowledge_domains: int
