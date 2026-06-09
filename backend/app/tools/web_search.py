from tavily import TavilyClient
from app.config import settings
import time

class Cache:
    def __init__(self, ttl_seconds: int = 3600*24):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key: str):
        if key in self.cache:
            val, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return val
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: any):
        self.cache[key] = (value, time.time())

interview_cache = Cache()
topic_cache = Cache()

def get_tavily_client() -> TavilyClient:
    return TavilyClient(api_key=settings.tavily_api_key)

def search_interview_questions(query: str, max_results: int = 5) -> list[dict]:
    """ Returns dict with keys: title, url, content """

    cache_key = f"{query}_{max_results}"
    cached_result = interview_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
    try:
        client = get_tavily_client()
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=max_results,
            include_answer=False,
            include_domains=[
                "leetcode.com",
                "geeksforgeeks.org",
                "medium.com",
                "dev.to",
                "github.com",
                "stackoverflow.com",
                "interviewbit.com",
                "neetcode.io",
            ],
        )

        results = []
        for i in response.get("results", []):
            results.append({
                "title": i.get("title", ""),
                "url": i.get("url", ""),
                "content": i.get("content", "")
            })

        interview_cache.set(cache_key, results)
        return results
    except Exception as e:
        print(f"Error searching for interview questions: {e}")
        return []

def search_topic_resources(topic: str) -> list[dict]:

    cached_result = topic_cache.get(topic)
    if cached_result is not None:
        return cached_result

    try:
        client = get_tavily_client()
        response = client.search(
            query=f"{topic} interview preparation guide best resources 2025 2026",
            max_results=3,
            search_depth="basic",
        )
        results = []
        for i in response.get("results", []):
            results.append({
                "title": i.get("title", ""),
                "url": i.get("url", ""),
            })

        topic_cache.set(topic, results)
        return results
    except Exception as e:
        print(f"Error searching for topic resources: {e}")
        return []