from fastapi import APIRouter
from typing import Optional
from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog

router = APIRouter()


@router.get("/logs")
def get_logs(
    limit: int = 100,
    offset: int = 0,
    result: Optional[str] = None
):
    """
    Fetch detection logs with optional filtering.
    
    Args:
        limit: Maximum number of logs to return (default: 100)
        offset: Number of logs to skip (default: 0)
        result: Filter by result type ("ATTACK" or "NORMAL")
    
    Returns:
        List of detection logs ordered by timestamp (newest first)
    """
    db = SessionLocal()
    
    try:
        query = db.query(DetectionLog)
        
        # Apply result filter if provided
        if result:
            query = query.filter(DetectionLog.result == result)
        
        # Order by timestamp descending and apply pagination
        logs = query.order_by(DetectionLog.timestamp.desc())\
                   .offset(offset)\
                   .limit(limit)\
                   .all()
        
        # Convert to dict for JSON serialization
        return [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "duration": log.duration,
                "protocol": log.protocol,
                "service": log.service,
                "flag": log.flag,
                "result": log.result,
                "attack_type": log.attack_type,
                "confidence": log.confidence,
                "severity": log.severity
            }
            for log in logs
        ]
    
    finally:
        db.close()
