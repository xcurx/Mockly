from typing import Annotated, Literal, Optional, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class InterviewState(TypedDict):
    """Persists across entire interview graph execution"""

    messages: Annotated[list[BaseMessage], add_messages]

    topics: list[str]
    custom_topics: list[str]
    mode: Literal["TRAINING", "REALISTIC", "REVIEW", "BEHAVIORAL"]
    interaction_type: str
    max_questions: int
    difficulty_mode: str  # "ADAPTIVE" | "MANUAL"
    manual_difficulty: Optional[int]  # 1-5 only used when mode is MANUAL
    role: Optional[str]  # "INTERN" | "JUNIOR" | "MID" | "SENIOR" | "STAFF"
    bookmarked_questions: Optional[list[str]]

    questions_asked: list[dict]
    current_question_number: int
    evaluation_history: list[dict]
    interview_complete: bool

    current_question: Optional[dict]
    current_evaluation: Optional[dict]
    current_summary: Optional[dict]
    mastered_questions: Optional[list[str]]