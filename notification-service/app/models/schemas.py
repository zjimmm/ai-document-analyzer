from typing import Optional

from pydantic import BaseModel


class NotifyRequest(BaseModel):
    documentId: str
    fileName: str
    status: str  # "COMPLETED" or "FAILED"
    summary: Optional[str] = None
