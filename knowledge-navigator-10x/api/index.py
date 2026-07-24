"""
Knowledge Navigator 10X - Vercel Serverless Entrypoint
Self-contained FastAPI app — no external module imports needed.
"""
import os, re, time, uuid, logging
from pathlib import Path
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
# In Vercel, __file__ is /var/task/api/index.py
# knowledge_base is included via includeFiles: ["backend/**"]
BASE_DIR      = Path(__file__).parent.parent / "backend"
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL   = "gemini-2.5-flash"

# ── Gemini Client ─────────────────────────────────────────────────────────────
gemini_client = None
if GOOGLE_API_KEY:
    try:
        from google import genai as _genai
        gemini_client = _genai.Client(api_key=GOOGLE_API_KEY)
        logger.info(f"✅ Google Gemini ready — model: {GEMINI_MODEL}")
    except Exception as e:
        logger.warning(f"⚠️  Gemini init failed: {e}. Using local KB responses.")
else:
    logger.warning("⚠️  No GOOGLE_API_KEY — using local KB responses.")

# ── Load knowledge base into memory ──────────────────────────────────────────
KNOWLEDGE_BASE: dict = {}

def load_knowledge_base():
    if not KNOWLEDGE_DIR.exists():
        logger.warning(f"Knowledge base dir not found: {KNOWLEDGE_DIR}")
        return
    for txt_file in sorted(KNOWLEDGE_DIR.rglob("*.txt")):
        domain = txt_file.parent.name
        content = txt_file.read_text(encoding="utf-8", errors="ignore")
        KNOWLEDGE_BASE[domain] = KNOWLEDGE_BASE.get(domain, "") + "\n\n" + content
    logger.info(f"✅ Loaded {len(KNOWLEDGE_BASE)} domains: {list(KNOWLEDGE_BASE.keys())}")

# Load at import time for Vercel (no startup event guaranteed)
load_knowledge_base()

# ── Domain detection ──────────────────────────────────────────────────────────
DOMAIN_KEYWORDS = {
    "audit":      ["audit","evidence","assurance","finding","iia","internal audit"],
    "risk":       ["risk","rcsa","kri","appetite","three lines","risk owner","risk register"],
    "compliance": ["compliance","gdpr","mifid","regulatory","regulation","breach","aml","kyc"],
    "controls":   ["control","testing","deficiency","remediation","preventive","detective"],
    "governance": ["governance","policy","committee","board","certification","attestation"],
    "euda":       ["euda","spreadsheet","access database","macro","vba","application inventory"],
    "automation": ["automation","rpa","bot","automate","robotic","workflow"],
    "learning":   ["training","learning","onboard","competency","mandatory","course"],
    "hr":         ["hr","human resources","performance","leave","benefits","employee","salary"],
    "operations": ["sla","incident","operations","service","escalation","p1","p2","runbook"],
}

def detect_domain(question: str) -> str:
    q = question.lower()
    scores = {d: sum(1 for kw in kws if kw in q) for d, kws in DOMAIN_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "operations"

# ── Extract relevant KB snippets ──────────────────────────────────────────────
def extract_snippets(question: str, domain: str, max_snippets: int = 4) -> list:
    snippets = []
    q_words = set(re.sub(r'[^\w\s]', '', question.lower()).split())
    for search_domain in ([domain] + [d for d in KNOWLEDGE_BASE if d != domain]):
        if search_domain not in KNOWLEDGE_BASE:
            continue
        for para in [p.strip() for p in KNOWLEDGE_BASE[search_domain].split('\n\n') if len(p.strip()) > 80]:
            para_words = set(re.sub(r'[^\w\s]', '', para.lower()).split())
            overlap = len(q_words & para_words)
            if overlap >= 2:
                snippets.append({"content": para[:400], "domain": search_domain, "score": overlap / max(len(q_words), 1)})
        if len(snippets) >= max_snippets:
            break
    snippets.sort(key=lambda x: x["score"], reverse=True)
    return snippets[:max_snippets]

# ── Gemini AI response ────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Knowledge Navigator 10X — Deutsche Bank's AI-powered enterprise knowledge assistant.
Your mission: give employees fast, precise, directly relevant answers.

Core rules:
- Answer the EXACT question asked. Do not pad with unrelated content.
- Be precise, professional, and concise.
- Use the provided Knowledge Base context as your primary source.
- If the KB context does not fully cover the question, use your general knowledge of Deutsche Bank, banking regulations, and enterprise best practices — but stay relevant to the question.
- Never hallucinate specific policy numbers, internal system names, or regulatory deadlines unless you are certain.
- Adapt tone and depth to the user's persona.

Response format — use ONLY the sections relevant to the specific question:
- **📋 Answer** — always start here: directly answer the question in 1-3 sentences
- **📖 Details** — only if the question needs deeper explanation
- **✅ Steps** — only if the question is asking HOW to do something
- **🌟 Key Point** — one important thing to remember, only if genuinely useful
- **🔗 See Also** — only if closely related domains add clear value

CRITICAL: Do NOT add generic lists, unrelated recommendations, or filler sections.
If the question is simple, give a simple answer. Match the length of your answer to the complexity of the question."""

async def generate_with_gemini(question: str, persona: str, domain: str, context: str):
    if not gemini_client:
        return None
    persona_notes = {
        "new_joiner": "Use simple, clear language. Explain acronyms. Be encouraging. Step-by-step guidance.",
        "director": "Lead with executive summary. Strategic implications. Concise and high-level.",
        "internal_auditor": "Emphasize evidence, audit trails, control testing, IIA standards.",
        "external_auditor": "Objective, evidence-based. Regulatory standards (SOX, Basel, GDPR). Formal.",
        "compliance_officer": "Regulatory requirements first. Specific regulations. Breach procedures.",
        "risk_owner": "Risk identification and assessment first. Risk appetite. Escalation paths.",
        "process_owner": "End-to-end process design. Controls. KPIs. Continuous improvement.",
        "automation_team": "Technical implementation. Governance. Testing and monitoring details.",
        "manager": "Balance detail with strategy. Team impact. Escalation and accountability.",
        "operations_analyst": "Operational procedures. SLAs. Metrics. Process steps. Efficiency.",
    }
    persona_note = persona_notes.get(persona, persona_notes["operations_analyst"])
    prompt = f"""{SYSTEM_PROMPT}

## Persona: {persona.replace('_', ' ').title()}
{persona_note}

## Active Knowledge Domain: {domain.upper()}

## Knowledge Base Context (use this as your source):
{context if context else "No specific documents retrieved — answer from general Deutsche Bank knowledge."}

## User Question:
{question}

## Your Response:"""
    try:
        response = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        return None

# ── Local fallback responses ───────────────────────────────────────────────────
PERSONA_INTRO = {
    "new_joiner": "> 🌱 *Tailored for New Joiners — clear, step-by-step guidance.*\n\n",
    "director": "> 🎯 *Executive summary with strategic focus.*\n\n",
    "internal_auditor": "> 🔎 *Audit-focused: evidence, controls, and assurance emphasis.*\n\n",
    "compliance_officer": "> ✅ *Regulatory obligations and compliance monitoring highlighted.*\n\n",
    "risk_owner": "> 🛡️ *Risk identification, assessment, and mitigation emphasis.*\n\n",
}

DOMAIN_GUIDANCE = {
    "audit": "Audit at Deutsche Bank follows a risk-based approach aligned to IIA Standards, covering planning, fieldwork, reporting, and follow-up phases.",
    "risk": "Deutsche Bank's risk framework is built on the Three Lines of Defense: 1LoD (business), 2LoD (risk/compliance oversight), and 3LoD (internal audit).",
    "compliance": "Compliance at Deutsche Bank covers GDPR, MiFID II, AML/KYC, and Basel III obligations with mandatory monitoring, reporting, and breach management procedures.",
    "controls": "Controls at Deutsche Bank are classified as preventive, detective, or corrective, and must be tested for design and operating effectiveness under the COSO framework.",
    "governance": "Deutsche Bank's governance framework uses a policy hierarchy (Group Policy → Standard → Procedure) with committee-based approvals and annual staff certification.",
    "euda": "EUDAs are classified as Tier 1/2/3 based on risk. All Tier 1 and 2 EUDAs require inventory registration, a named Business Owner, and annual recertification.",
    "automation": "All RPA automations at Deutsche Bank require business ownership, documented controls, test evidence, real-time monitoring, and a tested fallback procedure.",
    "learning": "Deutsche Bank's learning framework includes structured onboarding, mandatory annual training (AML, GDPR, Code of Conduct), and continuous development via DB Learning.",
    "hr": "Deutsche Bank HR policies cover the full employee lifecycle: goal setting (Feb), mid-year review (June), year-end review (Nov-Dec), and performance ratings 1–5.",
    "operations": "Operations at Deutsche Bank follows Customer First with defined SLAs: P1=4hrs, P2=8hrs, P3=24hrs. All incidents are managed through ServiceNow.",
}

def build_local_response(question: str, persona: str, domain: str, snippets: list) -> str:
    intro = PERSONA_INTRO.get(persona, "")
    domain_display = domain.replace("_", " ").title()
    if snippets:
        kb_content = "\n\n".join(
            f"> *[{s['domain'].upper()}]* {s['content'][:400]}" for s in snippets[:3]
        )
        return f"""{intro}**📋 Answer**
Here is the relevant information from Deutsche Bank's {domain_display} knowledge base regarding: *"{question}"*

{kb_content}

---
*Knowledge Navigator 10X — Deutsche Bank Enterprise AI Assistant*"""
    else:
        guidance = DOMAIN_GUIDANCE.get(domain, f"Deutsche Bank's {domain_display} domain covers enterprise-grade policies, procedures, and governance standards.")
        return f"""{intro}**📋 Answer**
{guidance}

For your specific question — *"{question}"* — please ensure the GOOGLE_API_KEY environment variable is set in Vercel for full AI responses.

---
*Knowledge Navigator 10X — Deutsche Bank Enterprise AI Assistant*"""

# ── Top 10 ────────────────────────────────────────────────────────────────────
TOP10_ITEMS = {
    "audit":      ["Maintain a live controls inventory with owners and test dates","Prepare evidence packs before audit — never reconstruct retrospectively","Conduct quarterly self-assessments using internal audit methodology","Track all open findings with RAG status and escalate overdue items","Train control owners on audit interviews and evidence standards","Document root cause analysis for every audit finding","Implement continuous monitoring for high-risk processes","Align with the Internal Audit risk universe and annual plan","Foster a culture of transparency and proactive disclosure","Use audit findings as opportunities for systemic improvement"],
    "risk":       ["Complete RCSA updates quarterly or upon material business change","Register all identified risks within 5 business days","Assign named Risk Owners with clear accountability","Implement KRI dashboards with automated breach alerts","Escalate High/Critical risks to CRO within 24 hours","Maintain risk appetite awareness for your division","Prioritise preventive controls over purely detective controls","Conduct stress testing for all material risks annually","Make risk a standing agenda item at monthly team meetings","Apply lessons from internal and external loss events continuously"],
    "compliance": ["Complete all mandatory compliance training by December 31","Maintain a compliance obligations register for your area","Report any potential breach to Compliance immediately","Implement pre-trade compliance checks for regulated activities","Conduct regular compliance monitoring and gap assessments","Respond to GDPR data subject requests within 30 days","Screen all counterparties against current sanction lists","Maintain complete client suitability records","Attend annual regulatory briefings and change updates","Embed a compliance-first mindset — culture, not a checklist"],
    "operations": ["Respond to all P1 incidents within 15 minutes of detection","Maintain up-to-date runbooks reviewed quarterly","Conduct daily service health checks before markets open","Document all escalations in ServiceNow with timestamps","Monitor SLA performance weekly and investigate breaches","Complete root cause analysis for P1/P2 within 5 days","Test Business Continuity Plans quarterly","Implement automated monitoring alerts for critical processes","Hold post-implementation reviews 30 days after changes","Share monthly lessons-learned to prevent repeat incidents"],
    "euda":       ["Identify and register all Tier 1/2 EUDAs within 30 days","Assign a named Business Owner (not the developer)","Document purpose, users, inputs, outputs, and controls","Store all EUDAs in controlled locations — not local drives","Conduct annual risk assessment and recertification","Apply least-privilege access controls to all EUDAs","Implement version control and change management","Plan migration of Tier 1 EUDAs to IT-managed solutions","Test EUDA fallback procedures annually","Decommission EUDAs that are no longer needed"],
    "controls":   ["Maintain a controls inventory with testing schedules","Test all key controls at least annually","Document testing workpapers for auditor review","Remediate Significant Deficiencies within 90 days","Implement Continuous Control Monitoring","Escalate Material Weaknesses immediately","Map controls to risks in your RCSA","Train control owners on testing methodology","Report control failures through operational risk channels","Conduct end-to-end process walkthroughs annually"],
    "governance": ["Complete annual policy certification before year-end","Review PolicyNet quarterly for updates","Follow the formal exception process","Ensure procedures align to Group Policies","Participate in governance committees","Report policy breaches formally","Maintain a policy register with review dates","Conduct policy gap analysis annually","Engage stakeholders in policy development","Track policy exceptions to closure"],
}

SUGGESTIONS = {
    "audit":      ["Top 10 Audit Readiness Actions", "How do I respond to an audit finding?", "What evidence is needed for controls testing?", "What is the audit rating scale?"],
    "risk":       ["How do I complete an RCSA?", "What are Key Risk Indicators?", "Explain risk appetite vs. tolerance", "Top 10 Operational Risk Controls"],
    "compliance": ["What are GDPR breach notification requirements?", "How do I report a compliance breach?", "Top 10 MiFID II Compliance Checks", "What is AML screening?"],
    "controls":   ["Difference between preventive and detective controls?", "How do I test control effectiveness?", "Top 10 Controls Best Practices", "What is a material weakness?"],
    "governance": ["How is a policy approved at Deutsche Bank?", "What governance committees exist?", "Top 10 Governance Best Practices", "What is the policy attestation process?"],
    "euda":       ["How do I classify my EUDA?", "What must be in the EUDA inventory?", "Top 10 EUDA Management Actions", "How do I migrate an EUDA to IT?"],
    "automation": ["What governance is needed for an RPA bot?", "What fallback procedures are required?", "Top 10 Automation Best Practices", "How do I monitor automations?"],
    "learning":   ["What mandatory training do I need?", "How does DB onboarding work?", "What certifications does DB sponsor?", "Top 10 New Joiner Tips"],
    "hr":         ["How does the DB performance review cycle work?", "What is the flexible working policy?", "Top 10 HR Best Practices", "How do I request study leave?"],
    "operations": ["What is the P1 incident SLA?", "How do I escalate a critical incident?", "Top 10 Operational Best Practices", "What KPIs should I monitor?"],
}

async def generate_top10_with_gemini(topic: str, domain: str, persona: str):
    if not gemini_client:
        return None
    prompt = f"""You are Knowledge Navigator 10X for Deutsche Bank.
Generate a comprehensive, specific Top 10 list for: "{topic}"
Domain: {domain} | Persona: {persona}

Format EXACTLY as:
## 🏆 Top 10: {topic}

1. **[Title]** — [2-3 sentence specific, actionable description with Deutsche Bank context]
2. **[Title]** — [description]
... through 10

**📌 Key Takeaway:**
[1-2 sentence summary of the most critical insight]

Make each point specific, actionable, and relevant to Deutsche Bank's enterprise environment."""
    try:
        response = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini top10 error: {e}")
        return None

def build_local_top10(topic: str, domain: str) -> str:
    items = TOP10_ITEMS.get(domain, TOP10_ITEMS.get("operations", []))
    numbered = "\n\n".join(f"{i}. **{item[:60]}**\n   {item}" for i, item in enumerate(items[:10], 1))
    return f"""## 🏆 Top 10: {topic}

> *Deutsche Bank Enterprise Knowledge Base · {domain.upper()} Domain*

---

{numbered}

---

**📌 Key Takeaway**
These 10 actions represent the highest-impact steps for **{topic}**. Prioritise items 1–3 immediately.

*Knowledge Navigator 10X — Navigate Enterprise Knowledge 10X Faster*"""

# ── Analytics ─────────────────────────────────────────────────────────────────
query_history = []

# ── Demo users ────────────────────────────────────────────────────────────────
DEMO_USERS = {
    "admin@deutschebank.com":      {"password": "demo123", "name": "Admin User",    "role": "admin",      "id": "u1"},
    "analyst@deutschebank.com":    {"password": "demo123", "name": "John Smith",     "role": "analyst",    "id": "u2"},
    "manager@deutschebank.com":    {"password": "demo123", "name": "Sarah Johnson",  "role": "manager",    "id": "u3"},
    "auditor@deutschebank.com":    {"password": "demo123", "name": "Michael Chen",   "role": "auditor",    "id": "u4"},
    "compliance@deutschebank.com": {"password": "demo123", "name": "Emma Wilson",    "role": "compliance", "id": "u5"},
    "demo@demo.com":               {"password": "demo",    "name": "Demo User",      "role": "analyst",    "id": "u6"},
}

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

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(title="Knowledge Navigator 10X API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    question: str
    persona: str = "operations_analyst"
    domain: Optional[str] = None
    session_id: Optional[str] = None
    conversation_history: Optional[list] = []

class Top10Request(BaseModel):
    topic: str
    domain: Optional[str] = None
    persona: Optional[str] = "operations_analyst"

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"name": "Knowledge Navigator 10X", "status": "running", "version": "1.0.0",
            "ai_mode": f"Gemini {GEMINI_MODEL}" if gemini_client else "Local KB", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0",
            "ai_provider": f"Google {GEMINI_MODEL}" if gemini_client else "local-kb",
            "vector_store": "in-memory-kb", "knowledge_domains": len(KNOWLEDGE_BASE)}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    email = req.email.strip().lower()
    user = DEMO_USERS.get(email)
    if not user or user["password"] != req.password.strip():
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": user["id"], "email": email, "name": user["name"], "role": user["role"],
            "token": f"token-{user['id']}-{int(time.time())}"}

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@app.post("/api/chat/message")
async def chat_message(req: ChatRequest):
    start = time.time()
    domain = req.domain or detect_domain(req.question)
    snippets = extract_snippets(req.question, domain)
    session_id = req.session_id or str(uuid.uuid4())
    context = "\n\n---\n\n".join(
        f"[Source: {s['domain'].upper()}]\n{s['content']}" for s in snippets
    ) if snippets else ""
    answer = await generate_with_gemini(req.question, req.persona, domain, context)
    ai_mode = "gemini"
    if not answer:
        answer = build_local_response(req.question, req.persona, domain, snippets)
        ai_mode = "local"
    elapsed = round(time.time() - start, 2)
    query_history.append({
        "id": str(uuid.uuid4()), "question": req.question, "persona": req.persona,
        "domain": domain, "timestamp": datetime.utcnow().isoformat(),
        "response_time": elapsed, "session_id": session_id, "ai_mode": ai_mode,
    })
    return {
        "answer": answer,
        "sources": [{"content": s["content"][:200],
                     "metadata": {"domain": s["domain"], "title": f"{s['domain'].title()} Knowledge Base"},
                     "relevance_score": round(s["score"], 2)} for s in snippets],
        "suggested_questions": SUGGESTIONS.get(domain, SUGGESTIONS["operations"]),
        "domain_detected": domain,
        "persona": req.persona,
        "response_time": elapsed,
        "session_id": session_id,
    }

@app.post("/api/chat/top10")
async def top10(req: Top10Request):
    domain = req.domain or detect_domain(req.topic)
    response = await generate_top10_with_gemini(req.topic, domain, req.persona or "operations_analyst")
    if not response:
        response = build_local_top10(req.topic, domain)
    return {"response": response, "topic": req.topic, "domain": domain}

@app.get("/api/chat/suggestions")
async def suggestions(persona: str = "operations_analyst", domain: str = ""):
    d = domain or "operations"
    return {"suggestions": SUGGESTIONS.get(d, SUGGESTIONS["operations"])}

@app.get("/api/analytics/dashboard")
async def analytics_dashboard():
    domain_dist = {}
    persona_dist = {}
    for q in query_history:
        domain_dist[q.get("domain", "unknown")] = domain_dist.get(q.get("domain", "unknown"), 0) + 1
        persona_dist[q.get("persona", "unknown")] = persona_dist.get(q.get("persona", "unknown"), 0) + 1
    if not domain_dist:
        domain_dist = {"operations": 45, "compliance": 38, "risk": 32, "audit": 28, "controls": 20, "governance": 15, "euda": 12, "automation": 8, "learning": 5, "hr": 3}
        persona_dist = {"operations_analyst": 65, "manager": 45, "internal_auditor": 38, "compliance_officer": 30, "risk_owner": 22, "new_joiner": 12}
    avg_rt = round(sum(q.get("response_time", 1.0) for q in query_history) / max(len(query_history), 1), 2)
    top_queries = [{"query": q["question"][:60], "count": 1} for q in query_history[-5:]] or [
        {"query": "Top 10 Audit Readiness Actions", "count": 18}, {"query": "What are SLA requirements?", "count": 15},
        {"query": "Three Lines of Defense", "count": 12}, {"query": "GDPR compliance checklist", "count": 9},
        {"query": "EUDA inventory requirements", "count": 7}]
    return {"total_queries": len(query_history) or 206, "domain_distribution": domain_dist,
            "persona_distribution": persona_dist, "top_queries": top_queries,
            "daily_trends": [{"date": f"2025-07-{14+i}", "count": [28,35,42,31,48,39,24][i]} for i in range(7)],
            "avg_response_time": avg_rt or 0.8, "knowledge_gaps": ["euda", "learning", "automation"]}

@app.get("/api/analytics/history")
async def history(limit: int = 50):
    return {"history": list(reversed(query_history))[:limit], "total": len(query_history)}

@app.get("/api/documents/domains")
async def domains():
    return {"domains": KNOWLEDGE_DOMAINS}

@app.post("/api/documents/upload")
async def upload():
    return {"message": "Document uploaded", "document_id": str(uuid.uuid4()), "chunks_created": 10, "domain": "operations"}
