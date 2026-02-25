from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.detect import router as detect_router
from backend.database.db import engine, Base
import backend.models.detection_log
import backend.models.settings
import backend.models.notification

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
    
    # Create system startup notification
    from backend.models.notification import Notification
    from backend.database.db import SessionLocal
    db = SessionLocal()
    try:
        # Check if we already have a startup notification
        existing = db.query(Notification).filter(
            Notification.type == "SYSTEM",
            Notification.title == "System Startup"
        ).first()
        if not existing:
            startup_notification = Notification(
                type="SYSTEM",
                title="System Startup",
                message="Web IDS system has started successfully",
                severity="LOW"
            )
            db.add(startup_notification)
            db.commit()
            print("📬 System startup notification created")
    finally:
        db.close()


# =====================================================
# Include Routers
# =====================================================

from backend.routes.logs import router as logs_router
from backend.routes.analytics import router as analytics_router
from backend.routes.reports import router as reports_router
from backend.routes.settings import router as settings_router
from backend.routes.notifications import router as notifications_router
from backend.routes.system import router as system_router
from backend.routes.compliance import router as compliance_router

app.include_router(detect_router)
app.include_router(logs_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(settings_router)
app.include_router(notifications_router)
app.include_router(system_router)
app.include_router(compliance_router)


# =====================================================
# Root Endpoint
# =====================================================

@app.get("/")
def root():
    return {"message": "IDS API is running 🚀"}

