from typing import Any
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    fileContent: str  # base64-encoded file bytes
    fileName: str
    fileType: str


class AnalyzeResponse(BaseModel):
    summary: str
    extractedText: str
    structuredData: dict[str, Any]
