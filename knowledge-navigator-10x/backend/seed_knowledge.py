"""
Knowledge Navigator 10X - Knowledge Base Seeder
================================================
Populates the ChromaDB vector store with all knowledge base documents.
Run this ONCE after setting up your .env with a valid API key.

Usage:
    python seed_knowledge.py
"""
import os
import sys
import time
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
GOOGLE_API_KEY  = os.getenv("GOOGLE_API_KEY", "")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
AI_PROVIDER     = os.getenv("AI_PROVIDER", "google")
GEMINI_MODEL    = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
BASE_DIR        = Path(__file__).parent
KNOWLEDGE_DIR   = BASE_DIR / "knowledge_base"
VECTOR_STORE    = BASE_DIR / "vector_store"
COLLECTION_NAME = "knowledge_navigator"
CHUNK_SIZE      = 800   # words per chunk
CHUNK_OVERLAP   = 100   # words overlap


def get_embeddings():
    """Create embedding function — tries Google, then HuggingFace (free fallback)."""
    if AI_PROVIDER == "google" and GOOGLE_API_KEY and GOOGLE_API_KEY != "PASTE_YOUR_GOOGLE_API_KEY_HERE":
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            logger.info("✅ Using Google Gemini Embeddings")
            return GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=GOOGLE_API_KEY
            )
        except Exception as e:
            logger.warning(f"Google embeddings failed: {e}. Falling back to local embeddings.")

    if AI_PROVIDER == "openai" and OPENAI_API_KEY:
        try:
            from langchain_openai import OpenAIEmbeddings
            logger.info("✅ Using OpenAI Embeddings")
            return OpenAIEmbeddings(api_key=OPENAI_API_KEY)
        except Exception as e:
            logger.warning(f"OpenAI embeddings failed: {e}. Falling back to local embeddings.")

    # Free local fallback — no API key needed
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        logger.info("✅ Using HuggingFace sentence-transformers (free, local, no API key needed)")
        return HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    except Exception as e:
        logger.error(f"❌ Cannot initialize any embedding model: {e}")
        logger.error("Run: pip install sentence-transformers")
        sys.exit(1)


def load_documents():
    """Load all .txt files from the knowledge_base directory."""
    docs = []
    if not KNOWLEDGE_DIR.exists():
        logger.error(f"❌ Knowledge base directory not found: {KNOWLEDGE_DIR}")
        sys.exit(1)

    for txt_file in sorted(KNOWLEDGE_DIR.rglob("*.txt")):
        try:
            content = txt_file.read_text(encoding="utf-8").strip()
            if not content:
                continue
            domain = txt_file.parent.name
            docs.append({
                "content": content,
                "domain": domain,
                "filename": txt_file.name,
                "source": str(txt_file.relative_to(BASE_DIR)),
            })
            logger.info(f"  📄 Loaded: {domain}/{txt_file.name} ({len(content)} chars)")
        except Exception as e:
            logger.warning(f"  ⚠️  Failed to load {txt_file}: {e}")

    return docs


def chunk_documents(docs):
    """Split documents into overlapping chunks."""
    from langchain_core.documents import Document

    chunks = []
    for doc in docs:
        words = doc["content"].split()
        start = 0
        chunk_idx = 0

        while start < len(words):
            end = min(start + CHUNK_SIZE, len(words))
            chunk_text = " ".join(words[start:end])

            chunks.append(Document(
                page_content=chunk_text,
                metadata={
                    "domain":    doc["domain"],
                    "filename":  doc["filename"],
                    "source":    doc["source"],
                    "chunk_idx": chunk_idx,
                    "title":     doc["filename"].replace("_", " ").replace(".txt", "").title(),
                }
            ))
            chunk_idx += 1
            if end == len(words):
                break
            start = end - CHUNK_OVERLAP

    return chunks


def seed():
    """Main seeding function."""
    print("\n" + "="*60)
    print("  Knowledge Navigator 10X — Knowledge Base Seeder")
    print("="*60)

    # Validate API key
    if AI_PROVIDER == "google" and (not GOOGLE_API_KEY or GOOGLE_API_KEY == "PASTE_YOUR_GOOGLE_API_KEY_HERE"):
        logger.warning("⚠️  No Google API key set. Using free local embeddings (HuggingFace).")
        logger.warning("    For best results, add GOOGLE_API_KEY to backend/.env")

    # 1. Load documents
    logger.info(f"\n📂 Loading documents from: {KNOWLEDGE_DIR}")
    docs = load_documents()
    if not docs:
        logger.error("❌ No documents found in knowledge_base/")
        sys.exit(1)
    logger.info(f"✅ Loaded {len(docs)} documents")

    # 2. Chunk documents
    logger.info(f"\n✂️  Chunking documents (chunk_size={CHUNK_SIZE} words, overlap={CHUNK_OVERLAP})...")
    chunks = chunk_documents(docs)
    logger.info(f"✅ Created {len(chunks)} chunks")

    # 3. Initialize embeddings
    logger.info("\n🔧 Initializing embedding model...")
    embeddings = get_embeddings()

    # 4. Create vector store
    logger.info(f"\n💾 Creating ChromaDB vector store at: {VECTOR_STORE}")
    VECTOR_STORE.mkdir(parents=True, exist_ok=True)

    try:
        from langchain_chroma import Chroma

        # Clear existing collection if it exists
        try:
            import chromadb
            client = chromadb.PersistentClient(path=str(VECTOR_STORE))
            existing = [c.name for c in client.list_collections()]
            if COLLECTION_NAME in existing:
                client.delete_collection(COLLECTION_NAME)
                logger.info(f"  🗑️  Cleared existing collection: {COLLECTION_NAME}")
        except Exception:
            pass

        # Batch embed and store (process in batches to avoid rate limits)
        BATCH_SIZE = 50
        logger.info(f"  📊 Embedding {len(chunks)} chunks in batches of {BATCH_SIZE}...")

        vector_store = None
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE
            logger.info(f"  ⏳ Batch {batch_num}/{total_batches} ({len(batch)} chunks)...")

            if vector_store is None:
                vector_store = Chroma.from_documents(
                    documents=batch,
                    embedding=embeddings,
                    collection_name=COLLECTION_NAME,
                    persist_directory=str(VECTOR_STORE),
                )
            else:
                vector_store.add_documents(batch)

            # Small delay to avoid rate limits on Google API
            if AI_PROVIDER == "google" and i + BATCH_SIZE < len(chunks):
                time.sleep(0.5)

        logger.info(f"\n✅ Successfully seeded {len(chunks)} chunks into ChromaDB!")

    except Exception as e:
        logger.error(f"❌ ChromaDB seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # 5. Verify
    logger.info("\n🔍 Verifying vector store...")
    try:
        test_results = vector_store.similarity_search("risk management framework", k=3)
        logger.info(f"✅ Test search returned {len(test_results)} results")
        for r in test_results:
            logger.info(f"   • [{r.metadata.get('domain')}] {r.metadata.get('filename')}")
    except Exception as e:
        logger.warning(f"⚠️  Verification failed: {e}")

    print("\n" + "="*60)
    print("  🎉 Knowledge Base Ready!")
    print("="*60)
    print("\nNext step — start the backend server:")
    print("  python -m uvicorn app.main:app --reload --port 8000\n")


if __name__ == "__main__":
    seed()
