from app.agents.nodes import generate_question_node
from app.agents.nodes import research_node
from app.agents.nodes import summarize_node
from app.agents.nodes import evaluate_answer_node
from app.agents.nodes import generate_hint_node
from app.memory.question_memory import store_question, get_mastered_questions
from langchain_core.messages import HumanMessage
from fastapi import HTTPException
from pydantic import BaseModel
from fastapi import APIRouter
from app.agents.graph import interview_graph
from app.utils.state_utils import _serialize_state, _deserialize_state
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

interview_router = APIRouter()

class StartInterviewRequest(BaseModel):
    topics: list[str]
    custom_topics: list[str] = []
    mode: str
    interaction_type: str
    max_questions: int
    difficulty_mode: str = "ADAPTIVE"
    manual_difficulty: int | None = None
    role: str | None = None
    resume_data: dict | None = None
    bookmarked_questions: list[str] = []
    user_id: str = ""

class AnswerRequest(BaseModel):
    user_answer: str
    interview_state: dict
    hints_used: int = 0
    user_id: str = ""

class HintRequest(BaseModel):
    interview_state: dict
    hints_used: int

@interview_router.post("/start")
async def start_interview(req: StartInterviewRequest):
    # retrieve mastered questions from vector memory
    mastered = []
    if req.user_id:
        try:
            all_topics = req.topics + req.custom_topics
            mastered = get_mastered_questions(req.user_id, all_topics)
            logger.info(f"Found {len(mastered)} mastered questions for user {req.user_id}")
        except Exception as e:
            logger.warning(f"Failed to retrieve mastered questions: {e}")

    initial_state = {
        "messages": [],
        "topics": req.topics,
        "custom_topics": req.custom_topics,
        "mode": req.mode,
        "interaction_type": req.interaction_type,
        "max_questions": req.max_questions,
        "difficulty_mode": req.difficulty_mode,
        "manual_difficulty": req.manual_difficulty,
        "role": req.role,
        "resume_data": req.resume_data,
        "bookmarked_questions": req.bookmarked_questions,
        "research_context": "",
        "questions_asked": [],
        "current_question_number": 1,
        "evaluation_history": [],
        "interview_complete": False,
        "current_question": None,
        "current_evaluation": None,
        "current_summary": None,
        "mastered_questions": mastered,
    }

    try:
        result = interview_graph.invoke(initial_state)

        return {
            "question": result.get("current_question", {}),
            "question_number": 1,
            "interview_state": _serialize_state(result),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@interview_router.post("/respond")
async def respond_to_answer(req: AnswerRequest):
    state = _deserialize_state(req.interview_state)
    state["messages"].append(HumanMessage(content=req.user_answer))
    state["current_hints_used"] = req.hints_used

    try:
        with ThreadPoolExecutor() as executor:
            eval_future = executor.submit(evaluate_answer_node, state)

            question_future = None
            if state["current_question_number"] <= state["max_questions"]:
                question_future = executor.submit(generate_question_node, state)
            
            research_future = None
            if state["current_question_number"] % 5 == 0:
                research_future = executor.submit(research_node, state)

            eval_result = eval_future.result()
            question_result = question_future.result() if question_future else None
            research_result = research_future.result() if research_future else None
        
        for key, value in eval_result.items():
            if key == "messages":
                state["messages"].extend(value)
            else:
                state[key] = value

        # store mastered question in vector memory
        if req.user_id and state.get("current_evaluation"):
            try:
                eval_data = state["current_evaluation"]
                score = eval_data.get("score", 0)
                question_text = state.get("current_question", {}).get("question", "")
                topic = state.get("current_question", {}).get("topic", state.get("topics", [""])[0])
                store_question(req.user_id, question_text, topic, score)
            except Exception as e:
                logger.warning(f"Failed to store question in memory: {e}")

        if state.get("interview_complete", False):
            summary_result = summarize_node(state)
            for key, value in summary_result.items():
                state[key] = value
            return {
                "evaluation": state.get("current_evaluation"),
                "interview_complete": True,
                "summary": state.get("current_summary"),
                "interview_state": _serialize_state(state)
            }
        
        if research_result:
            state["research_context"] = research_result["research_context"]
        if question_result:
            for key, value in question_result.items():
                if key == "messages":
                    state["messages"].extend(value)
                else:
                    state[key] = value
 
        return {
            "evaluation": state.get("current_evaluation"),
            "question": state.get("current_question", {}),
            "question_number": state.get("current_question_number"),
            "interview_complete": False,
            "interview_state": _serialize_state(state),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to respond: {str(e)}")

@interview_router.post("/hint")
async def get_hint(req: HintRequest):
    state = _deserialize_state(req.interview_state)
    try:
        hint_result = generate_hint_node(state, req.hints_used)
        return {"hint": hint_result.get("current_hint")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate hint: {str(e)}")

@interview_router.post("/summarize")
async def summarize_interview(req: AnswerRequest):
    state = _deserialize_state(req.interview_state)
    try:
        summary_result = summarize_node(state)
        return {"summary": summary_result.get("current_summary")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to summarize: {str(e)}")
            