from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.database.db import SessionLocal
from backend.models.settings import SystemSettings

router = APIRouter()


class SettingsUpdate(BaseModel):
    test_mode: Optional[bool] = None
    confidence_threshold: Optional[float] = None
    alert_sound: Optional[bool] = None
    email_alerts: Optional[bool] = None
    auto_generate_daily_report: Optional[bool] = None


def get_or_create_settings(db):
    """Get existing settings or create defaults."""
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/settings")
def get_settings():
    db = SessionLocal()
    try:
        settings = get_or_create_settings(db)
        return {
            "test_mode": settings.test_mode,
            "confidence_threshold": settings.confidence_threshold,
            "alert_sound": settings.alert_sound,
            "email_alerts": settings.email_alerts,
            "auto_generate_daily_report": settings.auto_generate_daily_report,
        }
    finally:
        db.close()


@router.post("/settings")
def update_settings(data: SettingsUpdate):
    db = SessionLocal()
    try:
        settings = get_or_create_settings(db)

        if data.test_mode is not None:
            settings.test_mode = data.test_mode
        if data.confidence_threshold is not None:
            settings.confidence_threshold = data.confidence_threshold
        if data.alert_sound is not None:
            settings.alert_sound = data.alert_sound
        if data.email_alerts is not None:
            settings.email_alerts = data.email_alerts
        if data.auto_generate_daily_report is not None:
            settings.auto_generate_daily_report = data.auto_generate_daily_report

        db.commit()
        db.refresh(settings)

        return {
            "message": "Settings updated successfully",
            "settings": {
                "test_mode": settings.test_mode,
                "confidence_threshold": settings.confidence_threshold,
                "alert_sound": settings.alert_sound,
                "email_alerts": settings.email_alerts,
                "auto_generate_daily_report": settings.auto_generate_daily_report,
            },
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
