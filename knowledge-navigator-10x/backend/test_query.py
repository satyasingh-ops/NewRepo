import asyncio
from app.services.rag_service import rag_service

async def test():
    results = await rag_service.search("What is ISIN and WKN?", domain="dbis_business", score_threshold=2.0)
    print("Results count:", len(results))
    for r in results:
        print("Score:", r.get("score"), "Domain:", r.get("metadata", {}).get("domain"), "Filename:", r.get("metadata", {}).get("filename"))
        print("Content snippet:", r.get("content")[:100])

if __name__ == "__main__":
    asyncio.run(test())
