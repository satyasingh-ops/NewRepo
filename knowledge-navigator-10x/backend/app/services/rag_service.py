"""RAG (Retrieval Augmented Generation) service for Knowledge Navigator 10X."""
import logging
import time
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

from app.config import (
    CHROMADB_PERSIST_DIR, CHROMADB_COLLECTION,
    KNOWLEDGE_BASE_DIR, CHUNK_SIZE, CHUNK_OVERLAP, TOP_K_RESULTS,
    GOOGLE_API_KEY, OPENAI_API_KEY, AI_PROVIDER
)

logger = logging.getLogger(__name__)


class RAGService:
    """Manages the RAG pipeline: ingestion, embedding, retrieval."""
    
    def __init__(self):
        self._vector_store = None
        self._embeddings = None
        self._initialized = False
        self._init_rag()
    
    def _init_rag(self):
        """Initialize embeddings and vector store."""
        try:
            self._embeddings = self._create_embeddings()
            self._vector_store = self._create_or_load_vector_store()
            self._initialized = True
            logger.info("RAG service initialized successfully")
        except Exception as e:
            logger.error(f"RAG initialization failed: {e}. Running without vector search.")
            self._initialized = False
    
    def _create_embeddings(self):
        """Create embedding model."""
        if AI_PROVIDER == "google" and GOOGLE_API_KEY:
            try:
                from langchain_google_genai import GoogleGenerativeAIEmbeddings
                return GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=GOOGLE_API_KEY
                )
            except ImportError:
                logger.warning("langchain-google-genai not available, trying sentence-transformers")
        
        if AI_PROVIDER == "openai" and OPENAI_API_KEY:
            try:
                from langchain_openai import OpenAIEmbeddings
                return OpenAIEmbeddings(api_key=OPENAI_API_KEY)
            except ImportError:
                pass
        
        # Fallback: use simple sentence transformers (free, no API needed)
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            logger.info("Using HuggingFace sentence-transformers for embeddings (no API key required)")
            return HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
        except Exception as e:
            logger.warning(f"Could not initialize any embeddings: {e}")
            return None
    
    def _create_or_load_vector_store(self):
        """Create or load ChromaDB vector store."""
        if self._embeddings is None:
            return None
        
        try:
            import chromadb
            from langchain_chroma import Chroma
            
            persist_path = Path(CHROMADB_PERSIST_DIR)
            persist_path.mkdir(parents=True, exist_ok=True)
            
            vector_store = Chroma(
                collection_name=CHROMADB_COLLECTION,
                embedding_function=self._embeddings,
                persist_directory=str(persist_path),
            )
            logger.info(f"ChromaDB loaded from {persist_path}")
            return vector_store
        except Exception as e:
            logger.error(f"ChromaDB initialization failed: {e}")
            return None
    
    def _load_text_documents(self, directory: Path) -> List[Dict[str, Any]]:
        """Load text documents from a directory."""
        documents = []
        if not directory.exists():
            return documents
        
        for txt_file in directory.rglob("*.txt"):
            try:
                content = txt_file.read_text(encoding='utf-8')
                domain = txt_file.parent.name
                documents.append({
                    "content": content,
                    "metadata": {
                        "source": str(txt_file),
                        "filename": txt_file.name,
                        "domain": domain,
                        "document_type": "text",
                    }
                })
            except Exception as e:
                logger.warning(f"Failed to load {txt_file}: {e}")
        
        return documents
    
    def _chunk_text(self, text: str, metadata: dict) -> List[Dict[str, Any]]:
        """Split text into chunks for embedding."""
        chunks = []
        words = text.split()
        chunk_size_words = CHUNK_SIZE // 5  # approx words per chunk
        overlap_words = CHUNK_OVERLAP // 5
        
        start = 0
        while start < len(words):
            end = min(start + chunk_size_words, len(words))
            chunk_text = " ".join(words[start:end])
            chunks.append({"content": chunk_text, "metadata": metadata.copy()})
            if end == len(words):
                break
            start = end - overlap_words
        
        return chunks
    
    async def ingest_knowledge_base(self) -> Dict[str, Any]:
        """Ingest all documents from the knowledge base directory."""
        if not self._initialized or self._vector_store is None:
            return {"status": "skipped", "reason": "Vector store not initialized"}
        
        try:
            from langchain_core.documents import Document
            
            all_documents = []
            domain_dirs = list(Path(KNOWLEDGE_BASE_DIR).iterdir())
            
            for domain_dir in domain_dirs:
                if domain_dir.is_dir():
                    docs = self._load_text_documents(domain_dir)
                    for doc in docs:
                        chunks = self._chunk_text(doc["content"], doc["metadata"])
                        all_documents.extend(chunks)
            
            if all_documents:
                langchain_docs = [
                    Document(page_content=d["content"], metadata=d["metadata"])
                    for d in all_documents
                ]
                self._vector_store.add_documents(langchain_docs)
                logger.info(f"Ingested {len(langchain_docs)} document chunks")
                return {"status": "success", "chunks_created": len(langchain_docs)}
            
            return {"status": "no_documents", "chunks_created": 0}
            
        except Exception as e:
            logger.error(f"Knowledge base ingestion failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def search(self, query: str, domain: Optional[str] = None, top_k: int = TOP_K_RESULTS) -> List[Dict[str, Any]]:
        """Semantic search for relevant documents."""
        if not self._initialized or self._vector_store is None:
            return []
        
        try:
            # Build filter for domain if specified
            where_filter = {"domain": domain} if domain else None
            
            if where_filter:
                results = self._vector_store.similarity_search_with_score(
                    query, k=top_k, filter=where_filter
                )
            else:
                results = self._vector_store.similarity_search_with_score(query, k=top_k)
            
            return [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score)
                }
                for doc, score in results
            ]
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    def format_context(self, search_results: List[Dict[str, Any]]) -> str:
        """Format search results into context string for LLM."""
        if not search_results:
            return ""
        
        context_parts = []
        for i, result in enumerate(search_results, 1):
            domain = result['metadata'].get('domain', 'unknown')
            filename = result['metadata'].get('filename', 'document')
            context_parts.append(
                f"[Source {i}] Domain: {domain} | Document: {filename}\n{result['content']}"
            )
        
        return "\n\n---\n\n".join(context_parts)
    
    def get_document_count(self) -> int:
        """Return number of documents in the vector store."""
        if not self._initialized or self._vector_store is None:
            return 0
        try:
            return self._vector_store._collection.count()
        except Exception:
            return 0

    def is_initialized(self) -> bool:
        return self._initialized


# Singleton instance
rag_service = RAGService()
