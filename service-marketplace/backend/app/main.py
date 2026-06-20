"""
FastAPI entrypoint.

    uvicorn app.main:app --reload
Interactive API docs at /docs.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import admin, auth, categories, orders, services, vendor

# For a take-home we create tables on boot. A production app would use Alembic
# migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, categories.router, services.router,
          orders.router, vendor.router, admin.router):
    app.include_router(r)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": settings.app_name}
