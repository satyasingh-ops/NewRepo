"""Configuration for Knowledge Navigator 10X backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent.parent
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
VECTOR_STORE_DIR = BASE_DIR / "vector_store"

# AI Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_PROVIDER = os.getenv("AI_PROVIDER", "google")  # "google" or "openai"

# Model config
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# ChromaDB
CHROMADB_PERSIST_DIR = str(VECTOR_STORE_DIR)
CHROMADB_COLLECTION = "knowledge_navigator"

# Chunking
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
TOP_K_RESULTS = 5

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Demo users
DEMO_USERS = {
    "admin@deutschebank.com": {"password": "demo123", "name": "Admin User", "role": "admin"},
    "analyst@deutschebank.com": {"password": "demo123", "name": "John Smith", "role": "analyst"},
    "manager@deutschebank.com": {"password": "demo123", "name": "Sarah Johnson", "role": "manager"},
    "auditor@deutschebank.com": {"password": "demo123", "name": "Michael Chen", "role": "auditor"},
    "compliance@deutschebank.com": {"password": "demo123", "name": "Emma Wilson", "role": "compliance"},
    "demo@demo.com": {"password": "demo", "name": "Demo User", "role": "analyst"},
}

# Knowledge domains
KNOWLEDGE_DOMAINS = [
    {"id": "operations", "name": "Operations & Service Management", "icon": "🏭"},
    {"id": "automation", "name": "Automation & Innovation", "icon": "🤖"},
    {"id": "risk", "name": "Risk Management", "icon": "⚠️"},
    {"id": "controls", "name": "Controls Framework", "icon": "🛡️"},
    {"id": "audit", "name": "Audit & Assurance", "icon": "🔍"},
    {"id": "compliance", "name": "Compliance & Data Protection", "icon": "📋"},
    {"id": "governance", "name": "Governance & Policy Management", "icon": "⚖️"},
    {"id": "euda", "name": "EUDA & Application Governance", "icon": "💻"},
    {"id": "learning", "name": "Learning & Onboarding", "icon": "📚"},
    {"id": "hr", "name": "HR Management", "icon": "👥"},
]

# Personas
PERSONAS = [
    {"id": "new_joiner", "name": "New Joiner", "icon": "🌱"},
    {"id": "operations_analyst", "name": "Operations Analyst", "icon": "📊"},
    {"id": "manager", "name": "Manager", "icon": "👔"},
    {"id": "director", "name": "Director", "icon": "🎯"},
    {"id": "automation_team", "name": "Automation Team", "icon": "⚙️"},
    {"id": "internal_auditor", "name": "Internal Auditor", "icon": "🔎"},
    {"id": "external_auditor", "name": "External Auditor", "icon": "📑"},
    {"id": "compliance_officer", "name": "Compliance Officer", "icon": "✅"},
    {"id": "risk_owner", "name": "Risk Owner", "icon": "🛡️"},
    {"id": "process_owner", "name": "Process Owner", "icon": "🔄"},
]
