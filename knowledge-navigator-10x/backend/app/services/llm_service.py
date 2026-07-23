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
                import google.generativeai as genai
                genai.configure(api_key=GOOGLE_API_KEY)
                self._client = genai.GenerativeModel(GEMINI_MODEL)
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
        
        if self._client is None:
            # Return mock response for demo without API key
            return self._mock_response(prompt)
        
        try:
            if self.provider == "google":
                response = self._client.generate_content(prompt)
                result = response.text
            elif self.provider == "openai":
                response = await self._client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
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
        question_marker = "## User Question"
        if question_marker in prompt:
            question = prompt.split(question_marker)[1].split("## Your Response")[0].strip()
        else:
            question = "your question"
        
        return f"""**📋 Summary**
This is a demonstration response for Knowledge Navigator 10X. To enable real AI responses, please configure your Google API key in the `.env` file.

**📖 Detailed Explanation**
You asked: *"{question}"*

Knowledge Navigator 10X is designed to provide intelligent, context-aware answers by retrieving relevant information from the enterprise knowledge base and generating personalized responses using Google Gemini or OpenAI GPT.

To activate full AI functionality:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com)
2. Add `GOOGLE_API_KEY=your_key_here` to `backend/.env`
3. Restart the backend server

**💼 Business Value**
With a configured AI model, this system can reduce knowledge search time by up to 10X by providing instant, accurate, role-specific answers from enterprise documentation.

**✅ Recommended Actions**
1. Configure the Google API key in backend/.env
2. Run `python seed_knowledge.py` to populate the vector database
3. Upload your organization's documents via the Knowledge Repository
4. Select your persona and start asking questions

**🌟 Best Practices**
- Always select the appropriate persona before asking questions for role-specific responses
- Use specific, detailed questions for more accurate answers
- Review source citations to verify information accuracy
- Bookmark frequently needed answers for quick access

**🔗 Related Domains**
All 10 knowledge domains are available: Operations, Automation, Risk, Controls, Audit, Compliance, Governance, EUDA, Learning & Onboarding, HR Management."""

    async def generate_suggested_questions(self, question: str, domain: str, persona: str) -> list[str]:
        """Generate follow-up question suggestions."""
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
