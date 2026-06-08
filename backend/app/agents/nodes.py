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
)
# from app.tools.web_search import search_interview_questions

def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.nvidia_model,
        base_url=settings.nvidia_base_url,
        api_key=settings.nvidia_api_key,
        temperature=0.7,
    )

def research_node(state: dict) -> dict:
    llm = get_llm()
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
        # results = search_interview_questions(query)
        # all_results.extend(results)
        pass

    research_context = "\n\n".join(
        f"Source: {r.get('url', 'unkown')}\n{r.get('content', '')}"
        for r in all_results
    )

    if len(research_context) > 8000:
        research_context = research_context[:8000] + "\n...[TRUNCATED]"

    return {"research_context": research_context}

def generate_question_node(state: dict) -> dict:
    llm = get_llm()

    prompt = QUESTION_GENERATION_PROMPT.format(
        topics=", ".join(state["topics"] + state.get("custom_topics", [])),
        question_number=state["current_question_number"],
        max_questions=state["max_questions"],
        research_context=state.get("research_context", "No research available"),
        resume_data=json.dumps(state.get("resume_data")) if state.get("resume_data") else "No provided",
        questions_asked=json.dumps([q.get("question", "") for q in state.get("questions_asked", [])]),
    )

    response = llm.invoke([
        SystemMessage(content="You are an expert interviewer. Always respond with valid JSON."),
        HumanMessage(content=prompt)
    ])

    try:
        question_data = json.loads(response.content)
    except json.JSONDecodeError:
        question_data = {
            "question": response.content,
            "expected_answer_points": [],
            "difficulty": "medium",
            "source": "llm",
            "topic": state["topics"][0] if state["topics"] else "general",
        }

    updated_questions = state.get("questions_asked", []) + [question_data]

    return {
        "current_question": question_data,
        "questions_asked": updated_questions,
        "messages": [AIMessage(content=question_data["question"])]
    }

def evaluate_answer_node(state: dict) -> dict:
    llm = get_llm()
    current_q = state.get("current_question", {})

    user_answer = ""
    for msg in reversed(state.get("messages", [])):
        if isinstance(msg, HumanMessage):
            user_answer = msg.content
            break
    
    if state["mode"] == "training":
        prompt = EVALUATE_ANSWER_TRAINING_PROMPT.format(
            question=current_q.get("question", ""),
            expected_points=json.dumps(current_q.get("expected_answer_points", [])),
            user_answer=user_answer,
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

    try:
        evaluation = json.loads(response.content)
    except json.JSONDecodeError:
        evaluation = {
            "score": 5,
            "feedback": response.content,
        }
    
    if state["mode"] == "training":
        ai_response = evaluation.get("feedback", "")
        if evaluation.get("ideal_answer"):
            ai_response += f"\n\n**Ideal Answer:** {evaluation['ideal_answer']}"
    else:
        ai_response = evaluation.get("response", "")
        if evaluation.get("follow_up"):
            ai_response += f"\n\n{evaluation['follow_up']}"
    
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

def summarize_node(state: dict) -> dict:
    llm = get_llm()

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

    try:
        summary = json.loads(response.content)
    except json.JSONDecodeError:
        summary = {
            "overall_score": 0,
            "grade": "N/A",
            "feedback": response.content
        }
    
    return {"current_summary": summary, "interview_complete": True}
