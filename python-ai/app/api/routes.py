from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.analyzer import analyze_document

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    try:
        result = analyze_document(request.fileContent, request.fileType)
        return AnalyzeResponse(
            summary=result.get("summary", ""),
            extractedText=result.get("extractedText", ""),
            structuredData=result.get("structuredData", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
