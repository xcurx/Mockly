import json
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from app.config import settings
from app.agents.prompts import (
    RESEARCH_QUERY_PROMPT,
    QUESTION_GENERATION_PROMPT,
    REVIEW_QUESTION_PROMPT,
    BEHAVIORAL_QUESTION_PROMPT,
    EVALUATE_ANSWER_TRAINING_PROMPT,
    EVALUATE_ANSWER_REALISTIC_PROMPT,
    EVALUATE_ANSWER_BEHAVIORAL_PROMPT,
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

ROLE_DIFFICULTY_BOUNDS = {
    "INTERN":  (1, 2),
    "JUNIOR":  (1, 3),
    "MID":     (2, 4),
    "SENIOR":  (3, 5),
    "STAFF":   (4, 5),
}

DIFFICULTY_LEVEL_LABELS = {
    1: "Foundational",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
    5: "Staff+",
}

DIFFICULTY_LEVEL_DESCRIPTIONS = {
    1: "Core definitions, basic syntax, and 'what is X?' questions.",
    2: "Apply concepts, compare trade-offs, and 'how does X work?' questions.",
    3: "Edge cases, design decisions, and deeper 'why' reasoning.",
    4: "System-level thinking, performance implications, and production gotchas.",
    5: "Architecture-level, cross-system trade-offs, and 'design a system that...' questions.",
}

def get_role_context(role: str | None) -> str:
    if not role or role not in ROLE_DIFFICULTY_BOUNDS:
        return "No specific role was provided. Use your judgment to calibrate difficulty."
    
    min_lvl, max_lvl = ROLE_DIFFICULTY_BOUNDS[role]
    min_label = DIFFICULTY_LEVEL_LABELS[min_lvl]
    max_label = DIFFICULTY_LEVEL_LABELS[max_lvl]
    
    role_descriptions = {
        "INTERN": "The candidate is at the INTERN level. Questions should test understanding of core concepts and basic application. Do NOT ask about system design, production-level trade-offs, or architectural decisions.",
        "JUNIOR": "The candidate is at the JUNIOR level. Questions should test solid fundamentals with some depth. Expect working knowledge but not deep system expertise or production experience.",
        "MID": "The candidate is at the MID-LEVEL. Questions should test deeper understanding, real-world trade-offs, and practical problem solving. They should have solid fundamentals and some production experience.",
        "SENIOR": "The candidate is at the SENIOR level. Questions should test architecture, system design, performance optimization, and technical leadership. They should demonstrate deep expertise.",
        "STAFF": "The candidate is at the STAFF+ level. Questions should test cross-system thinking, organizational impact, and deep domain expertise. Expect architectural vision and broad technical judgment.",
    }
    
    return (
        f"{role_descriptions.get(role, '')}"
        f" Difficulty range: {min_lvl} ({min_label}) to {max_lvl} ({max_label}) on a 5-point scale."
    )

def get_role_evaluation_context(role: str | None) -> str:
    if not role or role not in ROLE_DIFFICULTY_BOUNDS:
        return "No specific role provided. Score based on absolute quality of the answer."
    
    eval_descriptions = {
        "INTERN": "The candidate is at the INTERN level. Calibrate your scoring expectations accordingly — an intern is not expected to have production experience or deep system-level depth. Focus on whether they demonstrate understanding of core concepts. A correct but surface-level answer is acceptable.",
        "JUNIOR": "The candidate is at the JUNIOR level. They should demonstrate solid fundamentals and basic practical knowledge. Don't penalize for lack of system design depth, but do expect correct core concepts and reasonable explanations.",
        "MID": "The candidate is at the MID-LEVEL. Expect well-structured answers with practical depth. They should demonstrate real-world understanding, trade-off awareness, and the ability to reason about 'why' not just 'what'.",
        "SENIOR": "The candidate is at the SENIOR level. Expect comprehensive, well-structured answers demonstrating deep expertise. They should show system-level thinking, performance awareness, and the ability to discuss architecture and trade-offs at scale.",
        "STAFF": "The candidate is at the STAFF+ level. Expect expert-level answers with cross-system perspective. They should demonstrate broad technical judgment, architectural vision, and awareness of organizational and engineering culture implications.",
    }
    
    return eval_descriptions.get(role, "Score based on absolute quality of the answer.")

def compute_manual_difficulty(level: int, role: str | None = None) -> tuple[str, str]:
    level = max(1, min(5, level))  # clamp to 1-5
    label = DIFFICULTY_LEVEL_LABELS[level]
    description = DIFFICULTY_LEVEL_DESCRIPTIONS[level]
    
    difficulty_directive = (
        f"Target difficulty: Level {level}/5 ({label}). {description} "
        f"Keep ALL questions at this difficulty level — do NOT vary."
    )
    performance_context = f"Manual difficulty mode — fixed at Level {level} ({label})."
    
    return difficulty_directive, performance_context

def compute_adaptive_difficulty(evaluation_history: list[dict], role: str | None = None) -> tuple[str, str]:
    if not evaluation_history:
        # determine starting level based on role
        if role and role in ROLE_DIFFICULTY_BOUNDS:
            min_lvl, max_lvl = ROLE_DIFFICULTY_BOUNDS[role]
            start_level = min(min_lvl + 1, max_lvl)  # start one above minimum, clamped
            label = DIFFICULTY_LEVEL_LABELS[start_level]
            return (
                f"Target difficulty: Level {start_level}/5 ({label}). This is the first question — start at a moderate level for the candidate's experience.",
                "No answers yet — this is the beginning of the interview."
            )
        return (
            "Target difficulty: Level 2/5 (Intermediate). This is the first question — start at a moderate level.",
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
    
    # map score to difficulty level (1-5)
    if avg_score >= 8.5:
        target_level = 5
    elif avg_score >= 7.0:
        target_level = 4
    elif avg_score >= 5.5:
        target_level = 3
    elif avg_score >= 4.0:
        target_level = 2
    else:
        target_level = 1
    
    # clamp to role bounds if a role is set
    if role and role in ROLE_DIFFICULTY_BOUNDS:
        min_lvl, max_lvl = ROLE_DIFFICULTY_BOUNDS[role]
        target_level = max(min_lvl, min(max_lvl, target_level))
    
    label = DIFFICULTY_LEVEL_LABELS[target_level]
    description = DIFFICULTY_LEVEL_DESCRIPTIONS[target_level]
    
    difficulty_directive = (
        f"Target difficulty: Level {target_level}/5 ({label}). "
        f"The candidate's recent average is {avg_score:.1f}/10. "
        f"{description}"
    )
    
    return difficulty_directive, performance_context

def generate_question_node(state: dict) -> dict:
    llm = get_smart_llm()

    mode = state.get("mode", "TRAINING")
    
    if mode == "REVIEW":
        bookmarked_questions = state.get("bookmarked_questions", [])
        current_idx = state["current_question_number"] - 1
        
        if current_idx < len(bookmarked_questions):
            bookmarked_q = bookmarked_questions[current_idx]
        else:
            bookmarked_q = "Please generate a general technical question as fallback."
            
        prompt = REVIEW_QUESTION_PROMPT.format(bookmarked_question=bookmarked_q)
    elif mode == "BEHAVIORAL":
        role = state.get("role")
        role_context = get_role_context(role)
        mastered = state.get("mastered_questions", []) or []
        prompt = BEHAVIORAL_QUESTION_PROMPT.format(
            topics=", ".join(state["topics"] + state.get("custom_topics", [])),
            question_number=state["current_question_number"],
            max_questions=state["max_questions"],
            role_context=role_context,
            resume_data=json.dumps(state.get("resume_data")) if state.get("resume_data") else "Not provided",
            questions_asked=json.dumps([q.get("question", "") for q in state.get("questions_asked", [])]),
            mastered_questions=json.dumps(mastered) if mastered else "None yet.",
        )
    else:
        role = state.get("role")
        difficulty_mode = state.get("difficulty_mode", "ADAPTIVE")
        
        if difficulty_mode == "MANUAL":
            manual_level = state.get("manual_difficulty", 3)
            difficulty_directive, performance_context = compute_manual_difficulty(manual_level, role)
        else:
            difficulty_directive, performance_context = compute_adaptive_difficulty(
                state.get("evaluation_history", []), role
            )
        
        role_context = get_role_context(role)
        mastered = state.get("mastered_questions", []) or []

        prompt = QUESTION_GENERATION_PROMPT.format(
            topics=", ".join(state["topics"] + state.get("custom_topics", [])),
            question_number=state["current_question_number"],
            max_questions=state["max_questions"],
            difficulty_directive=difficulty_directive,
            performance_context=performance_context,
            role_context=role_context,
            research_context=state.get("research_context", "No research available"),
            resume_data=json.dumps(state.get("resume_data")) if state.get("resume_data") else "No provided",
            questions_asked=json.dumps([q.get("question", "") for q in state.get("questions_asked", [])]),
            mastered_questions=json.dumps(mastered) if mastered else "None yet.",
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
    
    role = state.get("role")
    role_evaluation_context = get_role_evaluation_context(role)
    
    if state["mode"] == "BEHAVIORAL":
        hints_used = state.get("current_hints_used", 0)
        hints_note = "Note: No hints were used, score normally." if hints_used == 0 else f"Note: {hints_used} hint(s) were used. The maximum score for this question is {10 - hints_used}."
        prompt = EVALUATE_ANSWER_BEHAVIORAL_PROMPT.format(
            question=current_q.get("question", ""),
            expected_points=json.dumps(current_q.get("expected_answer_points", [])),
            user_answer=user_answer,
            hints_used=hints_used,
            hints_note=hints_note,
            role_evaluation_context=role_evaluation_context,
        )
    elif state["mode"] == "TRAINING":
        hints_used = state.get("current_hints_used", 0)
        hints_note = "Note: No hints were used, score normally." if hints_used == 0 else f"Note: {hints_used} hint(s) were used. The maximum score for this question is {10 - hints_used}."
        prompt = EVALUATE_ANSWER_TRAINING_PROMPT.format(
            question=current_q.get("question", ""),
            expected_points=json.dumps(current_q.get("expected_answer_points", [])),
            user_answer=user_answer,
            hints_used=hints_used,
            hints_note=hints_note,
            role_evaluation_context=role_evaluation_context,
        )
    else:
        prompt = EVALUATE_ANSWER_REALISTIC_PROMPT.format(
            question=current_q.get("question", ""),
            expected_points=json.dumps(current_q.get("expected_answer_points", [])),
            user_answer=user_answer,
            role_evaluation_context=role_evaluation_context,
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
    
    if state["mode"] in ("TRAINING", "BEHAVIORAL"):
        ai_response = evaluation.get("feedback", "")
        if not isinstance(ai_response, str):
            ai_response = json.dumps(ai_response, indent=2)

        # show STAR breakdown for behavioral mode
        if state["mode"] == "BEHAVIORAL" and evaluation.get("star_breakdown"):
            star = evaluation["star_breakdown"]
            star_text = "\n\n**STAR Breakdown:**"
            for element in ["situation", "task", "action", "result"]:
                if element in star:
                    s = star[element]
                    score = s.get("score", "?") if isinstance(s, dict) else "?"
                    comment = s.get("comment", "") if isinstance(s, dict) else str(s)
                    star_text += f"\n- **{element.capitalize()}** ({score}/2.5): {comment}"
            ai_response += star_text
            
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
            
    valid_scores = [e.get("score") for e in evaluations if isinstance(e.get("score"), (int, float))]
    if valid_scores:
        avg = sum(valid_scores) / len(valid_scores)
        score_percent = int(avg * 10)
        summary["overall_score"] = score_percent
        if score_percent >= 90:
            summary["grade"] = "A"
        elif score_percent >= 80:
            summary["grade"] = "B"
        elif score_percent >= 70:
            summary["grade"] = "C"
        elif score_percent >= 60:
            summary["grade"] = "D"
        else:
            summary["grade"] = "F"
    else:
        summary["overall_score"] = 0
        summary["grade"] = "N/A"
    
    return {"current_summary": summary, "interview_complete": True}
