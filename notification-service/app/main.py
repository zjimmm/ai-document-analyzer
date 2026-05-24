from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(title="AI Document Analyzer - Notification Service")
app.include_router(router)
