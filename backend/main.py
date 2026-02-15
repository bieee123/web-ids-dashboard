from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.detect import router as detect_router
from backend.database.db import engine, Base
import backend.models.detection_log

# =====================================================
# Create FastAPI App
# =====================================================

app = FastAPI(
    title="Web IDS API",
    description="Machine Learning Powered Intrusion Detection System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # untuk development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Startup Event (Create Tables)
# =====================================================

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


# =====================================================
# Include Routers
# =====================================================

from backend.routes.logs import router as logs_router

app.include_router(detect_router)
app.include_router(logs_router)


# =====================================================
# Root Endpoint
# =====================================================

@app.get("/")
def root():
    return {"message": "IDS API is running 🚀"}
