from langgraph.graph import StateGraph, START, END
from app.agents.state import InterviewState
from app.agents.nodes import (
    research_node,
    generate_question_node,
    evaluate_answer_node,
    summarize_node,
)

def should_continue_or_summarize(state: dict) -> str:
    if state.get("interview_complete", False):
        return "summarize"
    if state["current_question_number"] % 5 == 0 and state["current_question_number"] > 0:
        return "research"
    return "generate_question"

workflow = StateGraph(InterviewState)

workflow.add_node("research", research_node)
workflow.add_node("generate_question", generate_question_node)
workflow.add_node("evaluate_answer", evaluate_answer_node)
workflow.add_node("summarize", summarize_node)

workflow.add_edge(START, "research")
workflow.add_edge("research", "generate_question")
workflow.add_edge("generate_question", END)

workflow.add_conditional_edges(
    "evaluate_answer",
    should_continue_or_summarize,
    {
        "research": "research",
        "generate_question": "generate_question",
        "summarize": "summarize",
    }
)

workflow.add_edge("summarize", END)

interview_graph = workflow.compile()