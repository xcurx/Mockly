from typing import Annotated, Literal, Optional, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class InterviewState(TypedDict):
    """Persists across entire interview graph execution"""

    messages: Annotated[list[BaseMessage], add_messages]

    topics: list[str]
    custom_topic: list[str]
    mode: Literal["TRAINING", "REALISTIC", "REVIEW", "BEHAVIORAL"]
    interaction_type: str
    max_questions: int
    bookmarked_questions: Optional[list[str]]

    questions_asked: list[dict]
    current_question_number: int
    evaluation_history: list[dict]
    interview_complete: bool

    current_question: Optional[dict]
    current_evaluation: Optional[dict]
    current_summary: Optional[dict]