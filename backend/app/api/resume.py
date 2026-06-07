from fastapi import APIRouter, UploadFile, File, HTTPException
from app.tools.resume_parser import parse_resume

resume_router = APIRouter()

MAX_FILE_SIZE = 5*1024*1024

@resume_router.post("/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    if not file.filename.lower().endswith(".pdf", ".docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    try:
        parsed_data = parse_resume(file_bytes, file.filename)
        return {"success": True, "data": parsed_data}
    except ValueError as e:
        raise HTTPException(status_code=422, detail={str(e)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

        
