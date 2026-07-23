"""Authentication router for Knowledge Navigator 10X."""
import uuid
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import LoginRequest, UserResponse
from app.config import DEMO_USERS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Simple in-memory token store (use Redis/JWT in production)
_active_tokens: dict = {}


@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    """Authenticate user and return session token."""
    user = DEMO_USERS.get(request.email)
    if not user or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    _active_tokens[token] = {"email": request.email, "user_id": user_id, **user}
    
    return UserResponse(
        id=user_id,
        email=request.email,
        name=user["name"],
        role=user["role"],
        token=token,
    )


@router.post("/logout")
async def logout(token: str):
    """Invalidate session token."""
    _active_tokens.pop(token, None)
    return {"message": "Logged out successfully"}


@router.get("/demo-credentials")
async def get_demo_credentials():
    """Return demo credentials for hackathon demo."""
    return {
        "credentials": [
            {"email": "admin@deutschebank.com", "password": "demo123", "role": "Admin"},
            {"email": "analyst@deutschebank.com", "password": "demo123", "role": "Operations Analyst"},
            {"email": "manager@deutschebank.com", "password": "demo123", "role": "Manager"},
            {"email": "auditor@deutschebank.com", "password": "demo123", "role": "Internal Auditor"},
            {"email": "compliance@deutschebank.com", "password": "demo123", "role": "Compliance Officer"},
            {"email": "demo@demo.com", "password": "demo", "role": "Demo User"},
        ]
    }


@router.get("/validate")
async def validate_token(token: str):
    """Validate session token."""
    if token in _active_tokens:
        user_data = _active_tokens[token]
        return {"valid": True, "user": user_data}
    raise HTTPException(status_code=401, detail="Invalid or expired token")
