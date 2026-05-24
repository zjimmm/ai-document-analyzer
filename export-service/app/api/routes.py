from fastapi import APIRouter
from fastapi.responses import Response

from app.models.schemas import ExportRequest
from app.services.pdf_builder import build_pdf

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/export")
def export(request: ExportRequest):
    if request.status != "COMPLETED":
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Document status must be COMPLETED to export")

    pdf_bytes = build_pdf(request)
    return Response(content=pdf_bytes, media_type="application/pdf")
