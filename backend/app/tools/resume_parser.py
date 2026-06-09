from langchain_core.messages import SystemMessage, HumanMessage
from app.config import settings
from langchain_openai import ChatOpenAI
import io
import json

from httpcore import stream
RESUME_PARSE_PROMPT = """Extract structured information from this resume text.
Return ONLY valid JSON in this exact format:
{{
    "name": "Candidate Name",
    "email": "email if found",
    "skills": ["skill1", "skill2", "skill3"],
    "experience_level": "junior" | "mid" | "senior",
    "experience": [
        {{
            "company": "Company Name",
            "role": "Job Title",
            "duration": "Jan 2023 - Present",
            "highlights": ["key responsibility or achievement"]
        }}
    ],
    "education": [
        {{
            "institution": "University Name",
            "degree": "Degree Name",
            "year": "2023"
        }}
    ],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Brief description",
            "technologies": ["tech1", "tech2"]
        }}
    ]
}}
RESUME TEXT:
{resume_text}"""

def extract_text_from_pdf(file_bytes: bytes) -> str:
    import fitz

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
    return text

def parse_resume(file_bytes: bytes, filename:str) -> dict:
    if filename.lower().endswith(".pdf"):
        resume_text = extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        resume_text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")
    
    if not resume_text.strip():
        raise ValueError("Could not extract text from file")

    llm = ChatOpenAI(
        model=settings.nvidia_fast_model,
        base_url=settings.nvidia_base_url,
        api_key=settings.nvidia_api_key,
        temperature=0.1
    )

    response = llm.invoke([
        SystemMessage(content="You are an expert resume parser. Extract information accurately. Respond ONLY with valid JSON."),
        HumanMessage(content=RESUME_PARSE_PROMPT.format(resume_text=resume_text)),
    ])

    try:
        parsed = json.loads(response.content)
    except json.JSONDecodeError:
        content = response.content
        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end > start:
            parsed = json.loads(content[start:end])
        else:
            raise ValueError("Invalid JSON response from model")

    return parsed
        
