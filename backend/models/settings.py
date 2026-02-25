from sqlalchemy import Column, Integer, String, Float, Boolean
from backend.database.db import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    test_mode = Column(Boolean, default=True)
    confidence_threshold = Column(Float, default=0.7)
    alert_sound = Column(Boolean, default=True)
    email_alerts = Column(Boolean, default=False)
    auto_generate_daily_report = Column(Boolean, default=True)
