from typing import Dict, Optional

from pydantic import BaseModel


class ExportRequest(BaseModel):
    fileName: str
    status: str
    summary: Optional[str] = None
    extractedText: Optional[str] = None
    structuredData: Optional[Dict] = None
