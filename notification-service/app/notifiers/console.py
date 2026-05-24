import logging

from app.models.schemas import NotifyRequest
from app.notifiers.base import BaseNotifier

logger = logging.getLogger(__name__)


class ConsoleNotifier(BaseNotifier):
    def send(self, request: NotifyRequest) -> None:
        logger.info("[NOTIFY] %s → %s: %s", request.fileName, request.status, request.summary)
