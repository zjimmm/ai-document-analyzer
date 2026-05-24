from abc import ABC, abstractmethod

from app.models.schemas import NotifyRequest


class BaseNotifier(ABC):
    @abstractmethod
    def send(self, request: NotifyRequest) -> None: ...
