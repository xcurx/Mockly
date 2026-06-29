import chromadb
import os
import logging

logger = logging.getLogger(__name__)

CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")
COLLECTION_NAME = "question_memory"
SCORE_THRESHOLD = 7

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def store_question(user_id: str, question: str, topic: str, score: float) -> None:
    if score < SCORE_THRESHOLD:
        return
    
    collection = _get_collection()
    
    # create a unique and deterministic ID based on user + question content
    doc_id = f"{user_id}_{hash(question) & 0xFFFFFFFF:08x}"
    
    try:
        collection.upsert(
            ids=[doc_id],
            documents=[question],
            metadatas=[{
                "user_id": user_id,
                "topic": topic,
                "score": score,
            }],
        )
    except Exception as e:
        logger.warning(f"Failed to store question in memory: {e}")


def get_mastered_questions(
    user_id: str,
    topics: list[str],
    limit: int = 20,
) -> list[str]:
    collection = _get_collection()
    
    if collection.count() == 0:
        return []
    
    try:
        # build the where filter: user_id match + topic in topics list
        if len(topics) == 1:
            where_filter = {
                "$and": [
                    {"user_id": {"$eq": user_id}},
                    {"topic": {"$eq": topics[0]}},
                ]
            }
        else:
            where_filter = {
                "$and": [
                    {"user_id": {"$eq": user_id}},
                    {"topic": {"$in": topics}},
                ]
            }
        
        results = collection.get(
            where=where_filter,
            limit=limit,
        )
        
        return results.get("documents", []) or []
    except Exception as e:
        logger.warning(f"Failed to retrieve mastered questions: {e}")
        return []
