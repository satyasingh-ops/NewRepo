@echo off
echo ============================================================
echo   Knowledge Navigator 10X - Backend Startup
echo ============================================================
echo.

REM Check .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and add your GOOGLE_API_KEY
    pause
    exit /b 1
)

REM Check if GOOGLE_API_KEY is set
findstr /C:"PASTE_YOUR_GOOGLE_API_KEY_HERE" .env >nul 2>&1
if %errorlevel%==0 (
    echo WARNING: You have not set your GOOGLE_API_KEY in .env
    echo The server will run in demo mode with limited AI responses.
    echo.
    echo To get a FREE key: https://aistudio.google.com/app/apikey
    echo.
)

REM Check if vector store is populated
if not exist "vector_store\chroma.sqlite3" (
    echo [Step 1/2] Seeding knowledge base into vector store...
    python seed_knowledge.py
    if %errorlevel% neq 0 (
        echo ERROR: Knowledge base seeding failed. Check your API key.
        pause
        exit /b 1
    )
) else (
    echo [Step 1/2] Vector store already populated. Skipping seed.
)

echo.
echo [Step 2/2] Starting FastAPI server on http://localhost:8000
echo.
echo  - API Docs:     http://localhost:8000/docs
echo  - Health Check: http://localhost:8000/health
echo  - Frontend:     http://localhost:5173
echo.
echo Press Ctrl+C to stop the server.
echo ============================================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
