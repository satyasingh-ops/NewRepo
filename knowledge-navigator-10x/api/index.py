import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, chat, documents, analytics

# Create a root FastAPI app
root_app = FastAPI()

# Create the actual app with /api prefix
app = FastAPI(title="Knowledge Navigator 10X API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers — these handle /chat, /auth, /documents, /analytics
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"status": "ok", "name": "Knowledge Navigator 10X"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

# Mount the app at /api so Vercel's full path /api/chat/message is handled
root_app.mount("/api", app)
