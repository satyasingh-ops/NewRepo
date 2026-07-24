"""Analytics router for Knowledge Navigator 10X."""
from fastapi import APIRouter
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_analytics_dashboard():
    """Get analytics dashboard data."""
    return analytics_service.get_analytics()


@router.get("/history")
async def get_search_history(limit: int = 50):
    """Get search history."""
    history = analytics_service.get_history(limit=limit)
    return {"history": history, "total": len(history)}


@router.post("/bookmark")
async def add_bookmark(request: dict):
    """Add a bookmark."""
    analytics_service.add_bookmark(
        user_id=request.get("user_id", "demo"),
        question=request.get("question", ""),
        answer=request.get("answer", ""),
        domain=request.get("domain", ""),
    )
    return {"message": "Bookmarked successfully"}


@router.get("/bookmarks/{user_id}")
async def get_bookmarks(user_id: str):
    """Get user's bookmarks."""
    bookmarks = analytics_service.get_bookmarks(user_id)
    return {"bookmarks": bookmarks}
