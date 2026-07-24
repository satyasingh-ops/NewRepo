"""Documents router for Knowledge Navigator 10X."""
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.rag_service import rag_service
from app.config import KNOWLEDGE_BASE_DIR, KNOWLEDGE_DOMAINS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/domains")
async def get_domains():
    """Get all knowledge domains with metadata."""
    domains_info = []
    for domain in KNOWLEDGE_DOMAINS:
        domain_dir = Path(KNOWLEDGE_BASE_DIR) / domain["id"]
        doc_count = len(list(domain_dir.glob("*.txt"))) if domain_dir.exists() else 0
        domains_info.append({
            **domain,
            "document_count": doc_count,
            "status": "active" if doc_count > 0 else "empty",
        })
    return {"domains": domains_info}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    domain: str = Form(...),
    description: str = Form(default="")
):
    """Upload a document to the knowledge base."""
    allowed_extensions = {".txt", ".pdf", ".docx", ".md"}
    file_ext = Path(file.filename or "").suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not supported")
    
    # Save file
    domain_dir = Path(KNOWLEDGE_BASE_DIR) / domain
    domain_dir.mkdir(parents=True, exist_ok=True)
    
    doc_id = str(uuid.uuid4())[:8]
    save_path = domain_dir / f"{doc_id}_{file.filename}"
    
    content = await file.read()
    
    if file_ext == ".txt" or file_ext == ".md":
        text_content = content.decode("utf-8", errors="ignore")
    elif file_ext == ".pdf":
        text_content = _extract_pdf_text(content)
    elif file_ext == ".docx":
        text_content = _extract_docx_text(content)
    else:
        text_content = content.decode("utf-8", errors="ignore")
    
    # Save as txt
    txt_path = domain_dir / f"{doc_id}_{Path(file.filename).stem}.txt"
    txt_path.write_text(text_content, encoding="utf-8")
    
    # Ingest to vector store
    await rag_service.ingest_knowledge_base()
    
    return {
        "message": "Document uploaded and indexed successfully",
        "document_id": doc_id,
        "domain": domain,
        "filename": file.filename,
    }


@router.post("/search")
async def search_documents(request: dict):
    """Search documents semantically."""
    query = request.get("query", "")
    domain = request.get("domain")
    top_k = request.get("top_k", 5)
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    results = await rag_service.search(query=query, domain=domain, top_k=top_k)
    return {"results": results, "query": query}


@router.post("/ingest")
async def ingest_knowledge_base():
    """Trigger re-ingestion of all knowledge base documents."""
    result = await rag_service.ingest_knowledge_base()
    return result


@router.get("/status")
async def get_rag_status():
    """Get RAG pipeline status."""
    return {
        "initialized": rag_service.is_initialized(),
        "vector_store": "chromadb",
        "knowledge_base": str(KNOWLEDGE_BASE_DIR),
    }


def _extract_pdf_text(content: bytes) -> str:
    """Extract text from PDF."""
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        logger.warning(f"PDF extraction failed: {e}")
        return content.decode("utf-8", errors="ignore")


def _extract_docx_text(content: bytes) -> str:
    """Extract text from DOCX."""
    try:
        import docx
        import io
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs)
    except Exception as e:
        logger.warning(f"DOCX extraction failed: {e}")
        return ""
