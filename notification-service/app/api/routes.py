from fastapi import APIRouter

from app.models.schemas import NotifyRequest
from app.notifiers.console import ConsoleNotifier

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/notify")
def notify(request: NotifyRequest):
    ConsoleNotifier().send(request)
    return {"status": "ok"}
