import json
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from app.config import settings
from app.agents.prompts import (
    RESEARCH_QUERY_PROMPT,
    QUESTION_GENERATION_PROMPT,
    EVALUATE_ANSWER_TRAINING_PROMPT,
    EVALUATE_ANSWER_REALISTIC_PROMPT,
    SUMMARY_PROMPT,
    HINT_GENERATION_PROMPT,
)
from app.tools.web_search import search_interview_questions

def get_fast_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.nvidia_fast_model,
        base_url=settings.nvidia_base_url,
        api_key=settings.nvidia_api_key,
        temperature=0.7,
    )

def get_smart_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.nvidia_smart_model,
        base_url=settings.nvidia_base_url,
        api_key=settings.nvidia_api_key,
        temperature=0.7,
    )

def research_node(state: dict) -> dict:
    llm = get_fast_llm()
    topics = state["topics"] + state.get("custom_topics", [])

    resume_context = ""
    if (state.get("resume_data")):
        skills = state["resume_data"].get("skills", [])
        resume_context = f"Candidate's skills: {', ' .join(skills)}"

    query_prompt = RESEARCH_QUERY_PROMPT.format(
        topics=", ".join(topics),
        custom_topics=", ".join(state.get("custom_topics", [])),
        resume_context=resume_context,
    )

    response = llm.invoke([HumanMessage(content=query_prompt)])
    seach_queries = [q.strip() for q in response.content.strip().split("\n") if q.strip()]

    all_results = []
    for query in seach_queries[:3]:
        results = search_interview_questions(query)
        all_results.extend(results)
        pass

    research_context = "\n\n".join(
        f"Source: {r.get('url', 'unkown')}\n{r.get('content', '')}"
        for r in all_results
    )

    if len(research_context) > 8000:
        research_context = research_context[:8000] + "\n...[TRUNCATED]"

    return {"research_context": research_context}

def compute_adaptive_difficulty(evaluation_history: list[dict]) -> tuple[str, str]:
    if not evaluation_history:
        return (
            "Target difficulty: MEDIUM. This is the first question — start at a moderate level.",
            "No answers yet — this is the beginning of the interview."
        )
    
    # use the last 3 scores for a rolling window
    recent_window = 3
    recent_evals = evaluation_history[-recent_window:]
    recent_scores = [e.get("score", 5) for e in recent_evals]
    avg_score = sum(recent_scores) / len(recent_scores)
    
    all_scores = [e.get("score", 5) for e in evaluation_history]
    overall_avg = sum(all_scores) / len(all_scores)
    
    # build performance context
    score_trend = ", ".join([f"Q{len(evaluation_history) - len(recent_scores) + i + 1}: {s}/10" for i, s in enumerate(recent_scores)])
    performance_context = (
        f"Recent scores (last {len(recent_scores)}): {score_trend}\n"
        f"Recent average: {avg_score:.1f}/10 | Overall average: {overall_avg:.1f}/10"
    )
    
    if avg_score >= 8.0:
        difficulty_directive = (
            "Target difficulty: HARD. The candidate is performing exceptionally well "
            f"(avg {avg_score:.1f}/10). Challenge them with advanced, nuanced questions "
            "that test deep understanding — edge cases, trade-offs, and system-level thinking."
        )
    elif avg_score >= 6.0:
        difficulty_directive = (
            "Target difficulty: MEDIUM. The candidate is performing solidly "
            f"(avg {avg_score:.1f}/10). Ask well-rounded questions that test core concepts "
            "with some depth. Gradually introduce more challenging aspects."
        )
    elif avg_score >= 4.0:
        difficulty_directive = (
            "Target difficulty: EASY-MEDIUM. The candidate is struggling somewhat "
            f"(avg {avg_score:.1f}/10). Ask clearer, more focused questions that build "
            "confidence while still testing important fundamentals."
        )
    else:
        difficulty_directive = (
            "Target difficulty: EASY. The candidate is having significant difficulty "
            f"(avg {avg_score:.1f}/10). Ask foundational questions with clear scope. "
            "Focus on core concepts to help them rebuild confidence."
        )
    
    return difficulty_directive, performance_context

def generate_question_node(state: dict) -> dict:
    llm = get_smart_llm()

    difficulty_directive, performance_context = compute_adaptive_difficulty(
        state.get("evaluation_history", [])
    )

    prompt = QUESTION_GENERATION_PROMPT.format(
        topics=", ".join(state["topics"] + state.get("custom_topics", [])),
        question_number=state["current_question_number"],
        max_questions=state["max_questions"],
        difficulty_directive=difficulty_directive,
        performance_context=performance_context,
        research_context=state.get("research_context", "No research available"),
        resume_data=json.dumps(state.get("resume_data")) if state.get("resume_data") else "No provided",
        questions_asked=json.dumps([q.get("question", "") for q in state.get("questions_asked", [])]),
    )

    response = llm.invoke([
        SystemMessage(content="You are an expert interviewer. Always respond with valid JSON."),
        HumanMessage(content=prompt)
    ])

    from langchain_core.utils.json import parse_json_markdown
    try:
        question_data = parse_json_markdown(response.content)
    except Exception:
        import json_repair
        try:
            repaired = json_repair.repair_json(response.content, return_objects=True)
            if isinstance(repaired, dict):
                question_data = repaired
            else:
                raise ValueError("Repaired JSON is not a dict")
        except Exception:
            question_data = {
                "question": "⚠️ The LLM generated a cut-off question. Please end the interview.",
                "expected_answer_points": [],
                "difficulty": "medium",
                "source": "llm",
                "topic": state["topics"][0] if state["topics"] else "General"
            }

    updated_questions = state.get("questions_asked", []) + [question_data]

    return {
        "current_question": question_data,
        "questions_asked": updated_questions,
        "messages": [AIMessage(content=question_data["question"])]
    }

def evaluate_answer_node(state: dict) -> dict:
    llm = get_smart_llm()
    current_q = state.get("current_question", {})

    user_answer = ""
    for msg in reversed(state.get("messages", [])):
        if isinstance(msg, HumanMessage):
            user_answer = msg.content
            break
    
    if state["mode"] == "training":
        hints_used = state.get("current_hints_used", 0)
        hints_note = "Note: No hints were used, score normally." if hints_used == 0 else f"Note: {hints_used} hint(s) were used. The maximum score for this question is {10 - hints_used}."
        prompt = EVALUATE_ANSWER_TRAINING_PROMPT.format(
            question=current_q.get("question", ""),
            expected_points=json.dumps(current_q.get("expected_answer_points", [])),
            user_answer=user_answer,
            hints_used=hints_used,
            hints_note=hints_note
        )
    else:
        prompt = EVALUATE_ANSWER_REALISTIC_PROMPT.format(
            question=current_q.get("question", ""),
            expected_points=json.dumps(current_q.get("expected_answer_points", [])),
            user_answer=user_answer,
        )

    response = llm.invoke([
        SystemMessage(content="You are an expert interviewer. Always respond with valid JSON"),
        HumanMessage(content=prompt)
    ])

    from langchain_core.utils.json import parse_json_markdown
    try:
        evaluation = parse_json_markdown(response.content)
    except Exception:
        import json_repair
        try:
            repaired = json_repair.repair_json(response.content, return_objects=True)
            if isinstance(repaired, dict):
                evaluation = repaired
            else:
                raise ValueError("Repaired JSON is not a dictionary")
        except Exception:
            evaluation = {
                "score": 5,
                "feedback": "⚠️ The AI generated an extremely long response that was cut off. Please continue to the next question.",
            }
    
    if state["mode"] == "training":
        ai_response = evaluation.get("feedback", "")
        if not isinstance(ai_response, str):
            ai_response = json.dumps(ai_response, indent=2)
            
        if evaluation.get("ideal_answer"):
            ideal = evaluation['ideal_answer']
            if not isinstance(ideal, str):
                ideal = json.dumps(ideal, indent=2)
            ai_response += f"\n\n**Ideal Answer:**\n{ideal}"
    else:
        ai_response = evaluation.get("response", "")
        if not isinstance(ai_response, str):
            ai_response = json.dumps(ai_response, indent=2)
            
        if evaluation.get("follow_up"):
            follow = evaluation['follow_up']
            if not isinstance(follow, str):
                follow = json.dumps(follow, indent=2)
            ai_response += f"\n\n{follow}"
    
    updated_evals = state.get("evaluation_history", []) + [evaluation]
    next_q_num = state["current_question_number"] + 1
    is_complete = next_q_num > state["max_questions"]

    return {
        "current_evaluation": evaluation,
        "evaluation_history": updated_evals,
        "current_question_number": next_q_num,
        "interview_complete": is_complete,
        "messages": [AIMessage(content=ai_response)]
    }

def generate_hint_node(state: dict, hints_used: int) -> dict:
    llm = get_smart_llm()
    current_q = state.get("current_question", {})
    
    max_hints = 3
    if hints_used >= max_hints:
        return {"current_hint": {"hint": "No more hints available.", "hint_level": "max"}}

    previous_hints_text = "None yet." if hints_used == 0 else f"{hints_used} hint(s) already given."

    prompt = HINT_GENERATION_PROMPT.format(
        question=current_q.get("question", ""),
        expected_points=json.dumps(current_q.get("expected_answer_points", [])),
        hint_number=hints_used + 1,
        max_hints=max_hints,
        previous_hints=previous_hints_text
    )

    response = llm.invoke([
        SystemMessage(content="You are an expert interviewer. Always respond with valid JSON."),
        HumanMessage(content=prompt)
    ])

    from langchain_core.utils.json import parse_json_markdown
    try:
        hint_data = parse_json_markdown(response.content)
    except Exception:
        import json_repair
        try:
            repaired = json_repair.repair_json(response.content, return_objects=True)
            if isinstance(repaired, dict):
                hint_data = repaired
            else:
                raise ValueError("Repaired JSON is not a dict")
        except Exception:
            hint_data = {
                "hint": "Try to think about the core concepts related to this topic.",
                "hint_level": "nudge"
            }
            
    return {"current_hint": hint_data}


def summarize_node(state: dict) -> dict:
    llm = get_fast_llm()

    exchanges = []
    questions = state.get("questions_asked", [])
    evaluations = state.get("evaluation_history", [])

    for i, (q, e) in enumerate(zip(questions, evaluations)):
        exchanges.append(f"Q{i+1}: {q.get('question', '')}\nScore: {e.get('score', 'N/A')}")

    prompt = SUMMARY_PROMPT.format(
        topics=", ".join(state["topics"] + state.get("custom_topics", [])),
        mode=state["mode"],
        total_questions=len(questions),
        exchanges="\n\n".join(exchanges)
    )

    response = llm.invoke([
        SystemMessage(content="You are an expert interviewer. Always respond with valid JSON."),
        HumanMessage(content=prompt),
    ])

    from langchain_core.utils.json import parse_json_markdown
    try:
        summary = parse_json_markdown(response.content)
    except Exception:
        import json_repair
        try:
            repaired = json_repair.repair_json(response.content, return_objects=True)
            if isinstance(repaired, dict):
                summary = repaired
            else:
                raise ValueError("Repaired JSON is not a dict")
        except Exception:
            summary = {
                "overall_score": 0,
                "grade": "N/A",
                "strengths": [],
                "weaknesses": [],
                "per_question_summary": [],
                "recommendations": [],
                "encouragement": "We couldn't generate a summary due to an error.",
            }
    
    return {"current_summary": summary, "interview_complete": True}
