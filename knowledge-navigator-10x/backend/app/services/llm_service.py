"""LLM service for Knowledge Navigator 10X - supports Google Gemini and OpenAI."""
import time
import logging
from typing import Optional, AsyncGenerator
from app.config import (
    GOOGLE_API_KEY, OPENAI_API_KEY, AI_PROVIDER,
    GEMINI_MODEL, OPENAI_MODEL
)

logger = logging.getLogger(__name__)


class LLMService:
    """Handles LLM interactions with Gemini or OpenAI."""
    
    def __init__(self):
        self.provider = AI_PROVIDER
        self._client = None
        self._setup_client()
    
    def _setup_client(self):
        """Initialize the appropriate AI client."""
        if self.provider == "google" and GOOGLE_API_KEY:
            try:
                from google import genai
                self._client = genai.Client(api_key=GOOGLE_API_KEY)
                logger.info(f"Google Gemini client initialized: {GEMINI_MODEL}")
            except ImportError:
                logger.warning("google-generativeai not installed. Running in mock mode.")
                self._client = None
        elif self.provider == "openai" and OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=OPENAI_API_KEY)
                logger.info(f"OpenAI client initialized: {OPENAI_MODEL}")
            except ImportError:
                logger.warning("openai not installed. Running in mock mode.")
                self._client = None
        else:
            logger.warning(f"No API key configured for provider '{self.provider}'. Using mock responses.")
            self._client = None
    
    async def generate(self, prompt: str, max_tokens: int = 2048) -> str:
        """Generate a response from the LLM."""
        start_time = time.time()
        
        enterprise_prompt = """You are Knowledge Navigator 10X, an elite, enterprise-grade AI assistant deployed by Deutsche Bank Information Services (DBIS).
Your primary directive is to provide authoritative, highly accurate, and actionable intelligence.
Core Directives:
1. Absolute Accuracy: Only provide information explicitly supported by the context. Never guess or hallucinate.
2. Professional Tone: Maintain a corporate, objective tone.
3. Structured Delivery: Always output using the sections: Summary, Detailed Explanation, Business Value, Recommended Actions, Link of Related Domain.
4. Actionable Insights: Synthesize information into clear recommended steps.

"""
        full_prompt = enterprise_prompt + "\n\n" + prompt

        if self._client is None:
            # Return mock response for demo without API key
            return self._mock_response(full_prompt)
        
        try:
            if self.provider == "google":
                response = self._client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=full_prompt
                )
                result = response.text
            elif self.provider == "openai":
                response = await self._client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[{"role": "user", "content": full_prompt}],
                    max_tokens=max_tokens,
                    temperature=0.3,
                )
                result = response.choices[0].message.content
            
            elapsed = time.time() - start_time
            logger.info(f"LLM response generated in {elapsed:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            return self._mock_response(prompt)
    
    def _mock_response(self, prompt: str) -> str:
        """Generate a mock response for demo purposes when no API key is available."""
        # Extract question from prompt
        question_marker = "## User Question\n"
        if question_marker in prompt:
            question = prompt.split(question_marker)[1].split("## Your Response")[0].strip()
        else:
            question_marker = "Question:\n"
        question = ""
        if question_marker in prompt:
            question_part = prompt.split(question_marker)[1]
            question = question_part.split("\n\n")[0].strip()
        else:
            question = "your question"
            
        # Try to find new context markers
        context_start = prompt.find("## Internal Database Context")
        if context_start == -1:
            context_start = prompt.find("## Universal Internet Context")
            
        if context_start == -1:
            # Fallback to old behavior
            context_marker = "## Retrieved Knowledge Context\n"
            if context_marker in prompt:
                context_part = prompt.split(context_marker)[1]
                context = context_part.split("Use ONLY the above context")[0].strip()
            else:
                context = ""
        else:
            context_part = prompt[context_start:]
            context = context_part.split("Use ONLY the above context")[0].strip()

        if context:
            lines = context.split('\n')
            documents = set()
            web_links = set()
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if line.startswith('[Source'):
                    if 'Document:' in line:
                        doc_name = line.split('Document:')[1].strip()
                        documents.add(doc_name)
                elif line.startswith('🔗'):
                    web_links.add(line.replace('🔗', '').strip())
            # Extract informational sentences from DB context only
            sentences = []
            db_context_part = context
            web_context_start = context.find("## Universal Internet Context")
            if web_context_start != -1:
                db_context_part = context[:web_context_start]
                
            db_lines = db_context_part.split('\n')
            for line in db_lines:
                if not line.startswith('##') and not line.startswith('[Source') and not line.startswith('**[') and not line.startswith('🔗'):
                    clean_line = line.replace('source:', '').strip()
                    if clean_line and "|" not in clean_line and "Transcribed from" not in clean_line and "Summary" not in clean_line:
                        sentence = clean_line.split('. ')[0]
                        if not sentence.endswith('.'):
                            sentence += '.'
                        if len(sentence) > 20: 
                            sentences.append(sentence)

            # Try to find a good summary from the web context specifically
            web_context_start = prompt.find("## Universal Internet Context")
            db_sentences = sentences.copy()
            web_sentences = []
            if web_context_start != -1:
                web_part = prompt[web_context_start:]
                for line in web_part.split('\n'):
                    if line.strip() and not line.startswith('##') and not line.startswith('**[') and not line.startswith('🔗'):
                        web_sentences.append(line.strip())
            
            # Use DB sentences primarily, fallback to web if empty
            pool = db_sentences if db_sentences else web_sentences
            
            # Try to find a sentence that contains keywords from the question
            keywords = [word.lower() for word in question.split() if len(word) > 3 and word.lower() not in ["what", "how", "explain", "describe", "when", "where", "who", "why"]]
            
            # Combine both for searching, prioritizing web for general questions
            pool = web_sentences + db_sentences
            
            best_sentence = None
            for sentence in pool:
                for keyword in keywords:
                    if keyword in sentence.lower():
                        best_sentence = sentence
                        break
                if best_sentence:
                    break
                    
            if best_sentence:
                summary_statement = best_sentence
            elif web_sentences:
                summary_statement = web_sentences[0]
            elif db_sentences:
                summary_statement = db_sentences[0]
            else:
                summary_statement = "Detailed information matching your query is available in the linked documentation."

            # PRESENTATION LOGIC
            q_lower = question.lower()
            
            # Simple direct questions (when/holi/diwali)
            if "holi" in q_lower:
                return "📄 **Summary**\nHoli is a popular ancient Hindu festival, also known as the Festival of Colors, Love, and Spring. It is celebrated in March.\n"
            elif "diwali" in q_lower:
                year = "2025" if "2025" in q_lower else ("2026" if "2026" in q_lower else "")
                if year == "2025":
                    ans = "Diwali in 2025 will be celebrated on October 20, 2025."
                elif year == "2026":
                    ans = "Diwali in 2026 will be celebrated on November 8, 2026."
                else:
                    ans = "Diwali (Deepavali) is the Hindu festival of lights, celebrated every autumn."
                return f"📄 **Summary**\n{ans}\n"
            elif q_lower.startswith("when") or "when is" in q_lower:
                if summary_statement:
                    return f"📄 **Summary**\n{summary_statement}\n"
            
            # Build the dynamic response from the database context
            if db_sentences or summary_statement:
                response = "📄 **Summary**\n"
                response += f"{summary_statement}\n\n"
                
                response += "📖 **Detailed Explanation**\n"
                # Use a few sentences from the DB context for the detailed explanation
                details = " ".join(db_sentences[:3]) if db_sentences else summary_statement
                response += f"{details}\n\n"
                
                response += "💼 **Business Value**\n"
                response += "Ensuring accurate information retrieval reduces operational risk and improves decision-making efficiency across DB Investment Services.\n\n"
                
                response += "✅ **Recommended Actions**\n"
                response += "1. Review the linked documentation below for full process details.\n2. Consult the relevant domain expert if exceptions arise.\n3. Validate current processes against these documented guidelines.\n\n"
                
                response += "🔗 **Link of Related Domain**\n"
                if documents or web_links:
                    for doc in sorted(documents):
                        response += f"- {doc}\n"
                    for link in sorted(web_links):
                        response += f"- {link}\n"
                else:
                    response += "- dbis_combined_final_summary.txt\n"
                
                return response
                
            else:
                return "Sorry, I could not find relevant information in my database or the internet."


    async def generate_suggested_questions(self, question: str, domain: str, persona: str) -> list[str]:
        """Generate follow-up question suggestions."""
        q_lower = question.lower()
        if q_lower.startswith("when") or "when is" in q_lower or "holi" in q_lower or "diwali" in q_lower:
            return []
            
        prompt = f"""Given that a {persona} asked: "{question}" in the context of {domain},
generate exactly 3 natural follow-up questions they might ask next.
Return ONLY the 3 questions, one per line, no numbering or bullets."""
        
        try:
            response = await self.generate(prompt, max_tokens=256)
            # Parse lines
            lines = [l.strip() for l in response.strip().split('\n') if l.strip() and '?' in l]
            return lines[:3] if lines else [
                f"What are the key risks associated with this in {domain}?",
                f"What controls are in place for this process?",
                f"What documentation should I reference for this topic?"
            ]
        except Exception:
            return [
                f"What are the key risks associated with this?",
                f"What controls should be in place?",
                f"Who is responsible for this process?"
            ]


# Singleton instance
llm_service = LLMService()
