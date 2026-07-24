"""Main FastAPI application for Knowledge Navigator 10X."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import ALLOWED_ORIGINS
from app.routers import auth, chat, documents, analytics
from app.models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown."""
    logger.info("🚀 Knowledge Navigator 10X starting up...")

    # Try to initialize RAG service (non-fatal if it fails)
    try:
        from app.services.rag_service import rag_service
        if rag_service.is_initialized():
            logger.info("✅ RAG service initialized — vector search active")
            # Only ingest if collection is empty
            try:
                count = rag_service.get_document_count()
                if count == 0:
                    logger.info("📚 Vector store is empty — ingesting knowledge base...")
                    result = await rag_service.ingest_knowledge_base()
                    logger.info(f"Knowledge base ingestion: {result}")
                else:
                    logger.info(f"📚 Vector store ready: {count} chunks loaded")
            except Exception as e:
                logger.warning(f"Knowledge base check failed: {e}")
        else:
            logger.warning("⚠️  RAG service not initialized — running without vector search")
            logger.warning("    Run 'python seed_knowledge.py' to populate the knowledge base")
    except Exception as e:
        logger.warning(f"⚠️  RAG startup error (non-fatal): {e}")

    logger.info("✅ Knowledge Navigator 10X API ready at http://localhost:8000")
    logger.info("📖 API Docs available at http://localhost:8000/docs")
    yield
    logger.info("🔻 Knowledge Navigator 10X shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Knowledge Navigator 10X API",
    description="AI-powered enterprise knowledge assistant for Deutsche Bank",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow frontend on port 5173 and 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(analytics.router)

# Also mount under /api for Vercel fallback compatibility
api_router = FastAPI()
api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(documents.router)
api_router.include_router(analytics.router)
app.mount("/api", api_router)


@app.get("/", response_class=JSONResponse)
@api_router.get("/", response_class=JSONResponse)
async def root():
    return {
        "name": "Knowledge Navigator 10X",
        "tagline": "Navigate Enterprise Knowledge 10X Faster",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse)
@api_router.get("/health", response_model=HealthResponse)
async def health_check():
    from app.config import AI_PROVIDER, KNOWLEDGE_DOMAINS, GOOGLE_API_KEY
    ai_status = f"{AI_PROVIDER}" + (" ✅" if GOOGLE_API_KEY and GOOGLE_API_KEY != "PASTE_YOUR_GOOGLE_API_KEY_HERE" else " ⚠️ (no API key)")
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        ai_provider=ai_status,
        vector_store="chromadb",
        knowledge_domains=len(KNOWLEDGE_DOMAINS),
    )


if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
