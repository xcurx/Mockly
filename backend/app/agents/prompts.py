RESEARCH_QUERY_PROMPT = """Given these interview topics: {topics}
And custom topics: {custom_topics}
{resume_context}

Generate 3-5 targeted web search queries to find high-quality interview questions.
Focus on:
- Common interview questions for these topics
- Tricky/advanced questions frequently asked
- Real-world scenario-based questions

Return ONLY the search queries, one per line. No numbering or explanation."""


QUESTION_GENERATION_PROMPT = """You are an expert technical interviewer.

INTERVIEW CONTEXT:
- Topics: {topics}
- Difficulty: Adjust based on performance so far
- Question number: {question_number} of {max_questions}

RESEARCH MATERIAL (questions sourced from the web):
{research_context}

RESUME DATA (if available):
{resume_data}

PREVIOUSLY ASKED QUESTIONS:
{questions_asked}

INSTRUCTIONS:
- Generate ONE interview question
- Draw from the research material when possible, but also use your own knowledge
- Do NOT repeat any previously asked question
- Mix question types: conceptual, coding, scenario-based, system design
- If resume data is available, tailor some questions to the candidate's experience
- VERY IMPORTANT: Do NOT wrap the "question" text in markdown code blocks (e.g. ```text or ```markdown). Provide it as raw markdown text.

Respond in this exact JSON format:
{{
    "question": "Your interview question here",
    "expected_answer_points": ["key point 1", "key point 2", "key point 3"],
    "difficulty": "easy" | "medium" | "hard",
    "source": "web" | "llm",
    "topic": "which topic this relates to"
}}"""


EVALUATE_ANSWER_TRAINING_PROMPT = """You are an expert technical interviewer in TRAINING mode.

QUESTION ASKED: {question}
EXPECTED KEY POINTS: {expected_points}
CANDIDATE'S ANSWER: {user_answer}

Evaluate the answer thoroughly:
1. Score from 0-10
2. What the candidate got RIGHT
3. What was MISSED or WRONG
4. The IDEAL answer
5. TIPS for improvement

Be encouraging but honest. This is a learning experience.

Respond in this exact JSON format:
{{
    "score": 8,
    "feedback": "Your overall feedback here",
    "correct_points": ["what they got right"],
    "missed_points": ["what they missed"],
    "ideal_answer": "The complete ideal answer",
    "tips": ["specific improvement tips"]
}}"""


EVALUATE_ANSWER_REALISTIC_PROMPT = """You are a senior engineer conducting a REAL technical interview at a top tech company.

QUESTION ASKED: {question}
EXPECTED KEY POINTS: {expected_points}
CANDIDATE'S ANSWER: {user_answer}

Behave like a REAL interviewer:
- Give brief, natural acknowledgments ("Okay", "Interesting", "I see")
- If the answer is incomplete, ask a FOLLOW-UP question to probe deeper
- Do NOT reveal the correct answer
- Do NOT give detailed feedback
- Keep responses short and professional

Respond in this exact JSON format:
{{
    "score": 7,
    "response": "Your natural interviewer response",
    "follow_up": "Optional follow-up question or null",
    "internal_notes": "Private evaluation notes (not shown to candidate)"
}}"""


SUMMARY_PROMPT = """You are an expert interview coach reviewing a completed mock interview.

INTERVIEW DATA:
- Topics: {topics}
- Mode: {mode}
- Total Questions: {total_questions}

ALL EXCHANGES:
{exchanges}

Generate a comprehensive interview review:

Respond in this exact JSON format:
{{
    "overall_score": 75,
    "grade": "B+",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "per_question_summary": [
        {{
            "question_number": 1,
            "topic": "topic",
            "score": 8,
            "brief_feedback": "one line summary"
        }}
    ],
    "recommendations": ["what to study", "what to practice"],
    "encouragement": "A motivating closing message"
}}"""
