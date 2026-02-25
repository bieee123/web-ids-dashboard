from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from backend.database.db import Base


class DetectionLog(Base):
    __tablename__ = "detection_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Auto timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Network features (important ones)
    duration = Column(Integer)
    protocol = Column(String)
    service = Column(String)
    flag = Column(String)

    # Prediction results
    result = Column(String)
    attack_type = Column(String, nullable=True)
    confidence = Column(Float)
    severity = Column(String)
