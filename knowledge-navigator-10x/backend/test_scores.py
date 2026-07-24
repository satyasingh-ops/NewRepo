import asyncio
from app.services.rag_service import rag_service

async def test():
    results = await rag_service.search("when is my birthday", top_k=5, score_threshold=2.0)
    for r in results:
        print(f"Score: {r['score']}, Title: {r['metadata'].get('filename')}")

asyncio.run(test())
