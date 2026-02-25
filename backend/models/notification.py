from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from backend.database.db import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Notification type: ATTACK, REPORT, SYSTEM, ANALYTICS
    type = Column(String, nullable=False)
    
    # Title of the notification
    title = Column(String, nullable=False)
    
    # Detailed message
    message = Column(Text)
    
    # Severity: LOW, MEDIUM, HIGH, CRITICAL
    severity = Column(String, default="LOW")
    
    # Read status
    is_read = Column(Boolean, default=False)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Optional: related entity ID (e.g., detection_log id)
    related_id = Column(Integer, nullable=True)
