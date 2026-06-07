from tavily import TavilyClient
from app.config import settings

def get_tavily_client() -> TavilyClient:
    return TavilyClient(api_key=settings.tavily_api_key)

def search_interview_questions(query: str, max_results: int = 5) -> list[dict]:
    """ Returns dict with keys: title, url, content """

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

        return results
    except Exception as e:
        print(f"Error searching for interview questions: {e}")
        return []

def search_topic_resources(topic: str) -> list[dict]:
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
        return results
    except Exception as e:
        print(f"Error searching for topic resources: {e}")
        return []