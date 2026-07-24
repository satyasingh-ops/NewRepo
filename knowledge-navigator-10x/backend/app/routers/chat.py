"""Chat router for Knowledge Navigator 10X."""
import uuid
import time
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse, SourceDocument
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from app.services.analytics_service import analytics_service
from prompts.system_prompt import build_prompt

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Process a chat message and return AI response."""
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        # 1. Semantic search for relevant documents
        search_results = await rag_service.search(
            query=request.question,
            domain=request.domain,
            top_k=5
        )

        # 2. Search internet
        from app.services.web_search_service import web_search_service
        web_results = web_search_service.search(request.question, max_results=3)
        web_context_str = web_search_service.format_web_results(web_results)

        # 3. Format context from retrieved documents
        db_context = rag_service.format_context(search_results)
        
        context = ""
        if db_context:
            context += f"## Internal Database Context:\n{db_context}\n\n"
        if web_context_str:
            context += f"## Universal Internet Context:\n{web_context_str}\n\n"

        # 4. Return constrained response if no relevant data found in either
        if not context.strip():
            response_time = round(time.time() - start_time, 2)
            not_found_answer = "Sorry, I am not supposed to answer which is not in my database or the internet."
            
            analytics_service.record_query(
                question=request.question,
                persona=request.persona,
                domain=request.domain,
                response_time=response_time,
                session_id=session_id,
            )
            return ChatResponse(
                answer=not_found_answer,
                sources=[],
                suggested_questions=[],
                domain_detected=request.domain,
                persona=request.persona,
                response_time=response_time,
                session_id=session_id,
            )

        # 5. Detect domain from question if not specified
        detected_domain = request.domain or _detect_domain(request.question)
        
        # Force operations_analyst persona as requested by user
        effective_persona = "operations_analyst"

        # 6. Build prompt with persona and context
        prompt = build_prompt(
            question=request.question,
            persona=effective_persona,
            domain=detected_domain,
            context=context
        )

        # 7. Generate response
        answer = await llm_service.generate(prompt)
        
        # 8. Generate suggested follow-up questions
        suggested_questions = await llm_service.generate_suggested_questions(
            question=request.question,
            domain=detected_domain or "general",
            persona=request.persona
        )
        
        response_time = round(time.time() - start_time, 2)
        
        # 9. Record to analytics
        analytics_service.record_query(
            question=request.question,
            persona=request.persona,
            domain=detected_domain,
            response_time=response_time,
            session_id=session_id,
        )
        
        # 10. Build source documents
        sources = [
            SourceDocument(
                content=r["content"][:300] + "..." if len(r["content"]) > 300 else r["content"],
                metadata=r["metadata"],
                relevance_score=r.get("score", 0.0)
            )
            for r in search_results
        ]
        
        for w in web_results:
            sources.append(
                SourceDocument(
                    content=w["snippet"][:300] + "..." if len(w["snippet"]) > 300 else w["snippet"],
                    metadata={"source": w["url"], "title": w["title"]},
                    relevance_score=0.9
                )
            )
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            suggested_questions=suggested_questions,
            domain_detected=detected_domain,
            persona=request.persona,
            response_time=response_time,
            session_id=session_id,
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.post("/top10")
async def generate_top10(request: dict):
    """Generate a Top 10 list for a given topic."""
    topic = request.get("topic", "")
    domain = request.get("domain", "")
    persona = request.get("persona", "operations_analyst")
    
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    
    prompt = f"""You are Knowledge Navigator 10X for Deutsche Bank.
Generate a comprehensive Top 10 list for: "{topic}"
Domain Context: {domain or 'General Enterprise'}
Persona: {persona}

Format EXACTLY as follows - provide exactly 10 numbered items:
**🏆 Top 10: {topic}**

1. **[Concise Title]** — [2-3 sentence actionable description with business context]
2. **[Concise Title]** — [2-3 sentence actionable description with business context]
... continue to 10

**💡 Key Takeaway:**
[1-2 sentence summary of the most important insight]

Make each item specific, actionable, and relevant to Deutsche Bank operations."""
    
    response = await llm_service.generate(prompt, max_tokens=1500)
    return {"response": response, "topic": topic, "domain": domain}


@router.get("/suggestions")
async def get_suggested_prompts(persona: str = "operations_analyst", domain: str = ""):
    """Get suggested prompts for the chat interface."""
    PROMPTS_BY_PERSONA = {
        "new_joiner": [
            "What should I do in my first week at Deutsche Bank?",
            "Explain the three lines of defense model",
            "What mandatory training do I need to complete?",
            "How do I raise a risk or compliance concern?",
            "What is the escalation process for operational issues?",
        ],
        "operations_analyst": [
            "What are the SLA requirements for Operations?",
            "How do I perform a root cause analysis?",
            "What are the key escalation triggers for incidents?",
            "Top 10 Operational Best Practices",
            "What documentation is required for process changes?",
        ],
        "manager": [
            "How do I monitor team performance metrics?",
            "What are my governance and oversight responsibilities?",
            "Top 10 Risk Management Actions for Managers",
            "How do I handle an audit finding in my area?",
            "What are the annual certification requirements?",
        ],
        "director": [
            "What are the key regulatory priorities for Deutsche Bank?",
            "Summarize the enterprise risk framework",
            "Top 10 Strategic Governance Practices",
            "What are the board-level reporting requirements?",
            "How does our compliance program address GDPR?",
        ],
        "internal_auditor": [
            "Top 10 Audit Readiness Actions",
            "What evidence is required for controls testing?",
            "How do I assess the effectiveness of operational controls?",
            "What are the key audit risk indicators?",
            "How should I document audit findings and recommendations?",
        ],
        "compliance_officer": [
            "Top 10 Compliance Checks for Deutsche Bank",
            "What are the GDPR key obligations?",
            "How do I investigate a potential compliance breach?",
            "What are the regulatory reporting timelines?",
            "Summarize MiFID II compliance requirements",
        ],
        "risk_owner": [
            "Top 10 Operational Risk Indicators",
            "How do I assess and score operational risks?",
            "What is the risk escalation framework?",
            "How do I write an effective risk acceptance statement?",
            "What are the key controls for risk mitigation?",
        ],
        "process_owner": [
            "How do I document a process end-to-end?",
            "What controls should I embed in my process?",
            "Top 10 Process Improvement Ideas",
            "How do I perform a process risk assessment?",
            "What are the process review and certification requirements?",
        ],
    }
    
    prompts = PROMPTS_BY_PERSONA.get(persona, PROMPTS_BY_PERSONA["operations_analyst"])
    return {"suggestions": prompts}


def _detect_domain(question: str) -> Optional[str]:
    """Simple keyword-based domain detection."""
    from typing import Optional
    question_lower = question.lower()
    
    domain_keywords = {
        "operations": ["sla", "incident", "operations", "service", "escalation", "customer", "process"],
        "automation": ["automation", "rpa", "bot", "script", "euda", "macro", "automate"],
        "risk": ["risk", "risk management", "appetite", "tolerance", "risk owner", "risk register"],
        "controls": ["control", "testing", "effectiveness", "deficiency", "remediation"],
        "audit": ["audit", "auditor", "evidence", "findings", "assurance", "testing"],
        "compliance": ["compliance", "regulation", "gdpr", "mifid", "regulatory", "breach"],
        "governance": ["governance", "policy", "committee", "board", "certification", "approval"],
        "euda": ["euda", "spreadsheet", "access database", "application governance", "inventory"],
        "learning": ["training", "learning", "onboarding", "development", "competency"],
        "hr": ["hr", "human resources", "performance", "leave", "benefits", "employee"],
        "dbis_business": ["dbis", "securities", "trade", "asset services", "tax services", "cds", "reconciliation"],
    }
    
    scores = {}
    for domain, keywords in domain_keywords.items():
        score = sum(1 for kw in keywords if kw in question_lower)
        if score > 0:
            scores[domain] = score
    
    return max(scores, key=scores.get) if scores else None
