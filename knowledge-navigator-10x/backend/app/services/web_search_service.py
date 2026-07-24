"""Web search service for Knowledge Navigator 10X.

Used as a fallback when the local knowledge base has no relevant results.
Uses DuckDuckGo — no API key required.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class WebSearchService:
    """Performs web searches via DuckDuckGo (no API key required)."""

    def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search the web and return a list of result dicts.

        Each result contains: title, url, snippet.
        Returns an empty list on any error so the caller can handle gracefully.
        """
        try:
            from duckduckgo_search import DDGS
            results = []
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                    })
            if not results:
                raise Exception("Duckduckgo returned 0 results")
            logger.info(f"Web search returned {len(results)} results for: '{query[:80]}'")
            return results
        except Exception as e:
            logger.error(f"Web search failed with duckduckgo: {e}, falling back to wikipedia")
            try:
                import urllib.request
                import urllib.parse
                import json
                
                safe_query = urllib.parse.quote(query)
                url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={safe_query}&utf8=&format=json"
                req = urllib.request.Request(url, headers={'User-Agent': 'KnowledgeNavigator/1.0'})
                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read())
                    
                results = []
                for r in data['query']['search'][:max_results]:
                    # Remove HTML tags from snippet
                    import re
                    clean_snippet = re.sub('<[^<]+>', '', r.get('snippet', ''))
                    results.append({
                        "title": r.get("title", ""),
                        "url": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(r.get('title', ''))}",
                        "snippet": clean_snippet,
                    })
                logger.info(f"Wikipedia fallback returned {len(results)} results")
                return results
            except Exception as wiki_err:
                logger.error(f"Wikipedia fallback also failed: {wiki_err}")
                return []

    def format_web_results(self, results: List[Dict[str, Any]]) -> str:
        """Format web results into a readable markdown string."""
        if not results:
            return ""
        lines = []
        for i, r in enumerate(results, 1):
            lines.append(
                f"**[{i}] {r['title']}**\n"
                f"{r['snippet']}\n"
                f"🔗 Source: {r['url']}"
            )
        return "\n\n---\n\n".join(lines)


# Singleton instance
web_search_service = WebSearchService()
