"""Analytics service for tracking queries and generating insights."""
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict
import random


class AnalyticsService:
    """In-memory analytics service (can be replaced with a database)."""
    
    def __init__(self):
        # In-memory storage for demo
        self._search_history: List[Dict[str, Any]] = []
        self._bookmarks: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._seed_demo_data()
    
    def _seed_demo_data(self):
        """Seed with demo analytics data."""
        domains = ["operations", "automation", "risk", "controls", "audit",
                   "compliance", "governance", "euda", "learning", "hr"]
        personas = ["operations_analyst", "manager", "internal_auditor",
                    "compliance_officer", "risk_owner", "new_joiner", "director"]
        sample_questions = [
            "What are the key SLA requirements for operations?",
            "How do I set up an EUDA inventory?",
            "What are the top audit readiness actions?",
            "Explain the three lines of defense model",
            "What controls are required for automation?",
            "How do I escalate a risk issue?",
            "What is the GDPR compliance checklist?",
            "How do I onboard as a new employee?",
            "What are the governance policy review requirements?",
            "What documentation is needed for controls testing?",
            "How do I classify an EUDA application?",
            "What are the operational risk indicators?",
            "Explain the audit planning process",
            "What are the compliance reporting obligations?",
            "How do I perform root cause analysis?",
        ]
        
        now = datetime.now()
        for i in range(50):
            days_ago = random.randint(0, 30)
            self._search_history.append({
                "id": str(uuid.uuid4()),
                "question": random.choice(sample_questions),
                "persona": random.choice(personas),
                "domain": random.choice(domains),
                "timestamp": (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat(),
                "response_time": round(random.uniform(0.5, 3.5), 2),
                "session_id": str(uuid.uuid4()),
            })
    
    def record_query(self, question: str, persona: str, domain: Optional[str],
                     response_time: float, session_id: str):
        """Record a query to history."""
        self._search_history.append({
            "id": str(uuid.uuid4()),
            "question": question,
            "persona": persona,
            "domain": domain or "unknown",
            "timestamp": datetime.now().isoformat(),
            "response_time": response_time,
            "session_id": session_id,
        })
    
    def get_history(self, limit: int = 50, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get search history."""
        history = sorted(self._search_history, key=lambda x: x["timestamp"], reverse=True)
        return history[:limit]
    
    def get_analytics(self) -> Dict[str, Any]:
        """Generate analytics summary."""
        if not self._search_history:
            return self._empty_analytics()
        
        # Domain distribution
        domains = [h["domain"] for h in self._search_history if h.get("domain")]
        domain_dist = dict(Counter(domains).most_common(10))
        
        # Persona distribution
        personas = [h["persona"] for h in self._search_history if h.get("persona")]
        persona_dist = dict(Counter(personas).most_common())
        
        # Top queries
        questions = [h["question"] for h in self._search_history]
        question_counts = Counter(questions).most_common(10)
        top_queries = [{"query": q, "count": c} for q, c in question_counts]
        
        # Daily trends (last 7 days)
        now = datetime.now()
        daily_trends = []
        for day_offset in range(6, -1, -1):
            target_date = (now - timedelta(days=day_offset)).strftime("%Y-%m-%d")
            count = sum(
                1 for h in self._search_history
                if h["timestamp"].startswith(target_date)
            )
            daily_trends.append({"date": target_date, "count": count})
        
        # Average response time
        times = [h["response_time"] for h in self._search_history if h.get("response_time")]
        avg_time = sum(times) / len(times) if times else 0.0
        
        # Knowledge gaps (domains with few queries)
        all_domains = ["operations", "automation", "risk", "controls", "audit",
                       "compliance", "governance", "euda", "learning", "hr"]
        gaps = [d for d in all_domains if domain_dist.get(d, 0) < 3]
        
        return {
            "total_queries": len(self._search_history),
            "domain_distribution": domain_dist,
            "persona_distribution": persona_dist,
            "top_queries": top_queries,
            "daily_trends": daily_trends,
            "avg_response_time": round(avg_time, 2),
            "knowledge_gaps": gaps,
        }
    
    def _empty_analytics(self) -> Dict[str, Any]:
        return {
            "total_queries": 0,
            "domain_distribution": {},
            "persona_distribution": {},
            "top_queries": [],
            "daily_trends": [],
            "avg_response_time": 0.0,
            "knowledge_gaps": [],
        }
    
    def add_bookmark(self, user_id: str, question: str, answer: str, domain: str):
        self._bookmarks[user_id].append({
            "id": str(uuid.uuid4()),
            "question": question,
            "answer": answer,
            "domain": domain,
            "timestamp": datetime.now().isoformat(),
        })
    
    def get_bookmarks(self, user_id: str) -> List[Dict[str, Any]]:
        return self._bookmarks.get(user_id, [])


# Singleton
analytics_service = AnalyticsService()
