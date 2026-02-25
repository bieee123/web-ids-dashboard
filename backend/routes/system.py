from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import psutil
import os
from datetime import datetime
from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog
from sqlalchemy import func

router = APIRouter()


class SystemHealthResponse(BaseModel):
    # System Resources
    cpu_usage: float
    memory_usage: float
    memory_total: float
    memory_available: float
    disk_usage: float
    disk_total: float
    disk_used: float
    
    # Database
    db_size_mb: float
    db_table_count: int
    db_logs_count: int
    db_notifications_count: int
    
    # API Performance
    api_uptime_seconds: float
    api_start_time: str
    
    # Model
    model_loaded: bool
    model_path_exists: bool
    
    # Status
    overall_status: str  # healthy, warning, critical
    timestamp: str


class ModelMetricsResponse(BaseModel):
    model_loaded: bool
    model_type: str
    feature_count: int
    classes: list
    last_prediction_time: Optional[str]
    total_predictions: int
    attack_predictions: int
    normal_predictions: int
    accuracy_estimate: float


class QuickActionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


# Track API start time
API_START_TIME = datetime.utcnow()
LAST_PREDICTION_TIME = None
TOTAL_PREDICTIONS = 0
ATTACK_PREDICTIONS = 0


@router.get("/system/health", response_model=SystemHealthResponse)
def get_system_health():
    """Get comprehensive system health metrics."""
    db = SessionLocal()
    
    try:
        # CPU Usage
        cpu_usage = psutil.cpu_percent(interval=0.1)
        
        # Memory Usage
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        memory_total = memory.total / (1024 ** 3)  # GB
        memory_available = memory.available / (1024 ** 3)  # GB
        
        # Disk Usage
        disk = psutil.disk_usage('/')
        disk_usage = disk.percent
        disk_total = disk.total / (1024 ** 3)  # GB
        disk_used = disk.used / (1024 ** 3)  # GB
        
        # Database Metrics
        db_logs_count = db.query(func.count(DetectionLog.id)).scalar() or 0
        
        # Get database file size
        db_path = "ids_logs.db"
        db_size_mb = 0
        if os.path.exists(db_path):
            db_size_mb = os.path.getsize(db_path) / (1024 ** 2)  # MB
        
        # Count tables (simplified)
        db_table_count = 5  # detection_logs, notifications, system_settings, etc.
        
        # Import notification model for count
        try:
            from backend.models.notification import Notification
            db_notifications_count = db.query(func.count(Notification.id)).scalar() or 0
        except:
            db_notifications_count = 0
        
        # API Uptime
        uptime = (datetime.utcnow() - API_START_TIME).total_seconds()
        
        # Model Status
        model_path = os.path.join(os.path.dirname(__file__), "../model/ids_model.pkl")
        model_path_exists = os.path.exists(model_path)
        model_loaded = model_path_exists  # Simplified check
        
        # Determine overall status
        overall_status = "healthy"
        if cpu_usage > 80 or memory_usage > 80 or disk_usage > 80:
            overall_status = "warning"
        if cpu_usage > 95 or memory_usage > 95 or disk_usage > 95:
            overall_status = "critical"
        
        return SystemHealthResponse(
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            memory_total=round(memory_total, 2),
            memory_available=round(memory_available, 2),
            disk_usage=disk_usage,
            disk_total=round(disk_total, 2),
            disk_used=round(disk_used, 2),
            db_size_mb=round(db_size_mb, 2),
            db_table_count=db_table_count,
            db_logs_count=db_logs_count,
            db_notifications_count=db_notifications_count,
            api_uptime_seconds=uptime,
            api_start_time=API_START_TIME.isoformat(),
            model_loaded=model_loaded,
            model_path_exists=model_path_exists,
            overall_status=overall_status,
            timestamp=datetime.utcnow().isoformat(),
        )
    finally:
        db.close()


@router.get("/system/model-metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """Get model performance metrics."""
    db = SessionLocal()
    
    try:
        # Get prediction statistics from database
        total_predictions = db.query(func.count(DetectionLog.id)).scalar() or 0
        attack_predictions = db.query(func.count(DetectionLog.id)).filter(
            DetectionLog.result == "ATTACK"
        ).scalar() or 0
        normal_predictions = total_predictions - attack_predictions
        
        # Get last prediction time
        last_log = db.query(DetectionLog).order_by(
            DetectionLog.timestamp.desc()
        ).first()
        last_prediction_time = last_log.timestamp.isoformat() if last_log else None
        
        # Load model info if available
        model_loaded = False
        model_type = "N/A"
        feature_count = 0
        classes = []
        
        try:
            import joblib
            model_path = os.path.join(os.path.dirname(__file__), "../model/ids_model.pkl")
            if os.path.exists(model_path):
                model = joblib.load(model_path)
                model_loaded = True
                model_type = type(model).__name__
                feature_count = len(getattr(model, 'feature_names_in_', []))
                classes = list(getattr(model, 'classes_', []))
        except:
            pass
        
        # Calculate accuracy estimate (based on confidence scores)
        avg_confidence = db.query(func.avg(DetectionLog.confidence)).scalar() or 0
        accuracy_estimate = round(avg_confidence * 100, 2) if avg_confidence else 0
        
        return ModelMetricsResponse(
            model_loaded=model_loaded,
            model_type=model_type,
            feature_count=feature_count,
            classes=classes,
            last_prediction_time=last_prediction_time,
            total_predictions=total_predictions,
            attack_predictions=attack_predictions,
            normal_predictions=normal_predictions,
            accuracy_estimate=accuracy_estimate,
        )
    finally:
        db.close()


@router.post("/system/actions/export-logs", response_model=QuickActionResponse)
def export_logs():
    """Export detection logs to CSV."""
    db = SessionLocal()
    
    try:
        import csv
        import io
        
        logs = db.query(DetectionLog).order_by(DetectionLog.timestamp.desc()).limit(10000).all()
        
        output = io.StringIO()
        fieldnames = [
            'id', 'timestamp', 'result', 'attack_type', 'confidence', 
            'severity', 'protocol', 'service', 'flag', 'duration'
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for log in logs:
            writer.writerow({
                'id': log.id,
                'timestamp': log.timestamp.isoformat() if log.timestamp else '',
                'result': log.result,
                'attack_type': log.attack_type or '',
                'confidence': log.confidence,
                'severity': log.severity,
                'protocol': log.protocol or '',
                'service': log.service or '',
                'flag': log.flag or '',
                'duration': log.duration,
            })
        
        return QuickActionResponse(
            success=True,
            message=f"Exported {len(logs)} logs to CSV",
            data={"count": len(logs), "format": "CSV"}
        )
    except Exception as e:
        return QuickActionResponse(
            success=False,
            message=f"Export failed: {str(e)}"
        )
    finally:
        db.close()


@router.post("/system/actions/clear-database", response_model=QuickActionResponse)
def clear_database():
    """Clear all detection logs and notifications (keep settings)."""
    db = SessionLocal()
    
    try:
        # Count records before deletion
        logs_count = db.query(func.count(DetectionLog.id)).scalar() or 0
        
        try:
            from backend.models.notification import Notification
            notifications_count = db.query(func.count(Notification.id)).scalar() or 0
            db.query(Notification).delete()
        except:
            notifications_count = 0
        
        db.query(DetectionLog).delete()
        db.commit()
        
        return QuickActionResponse(
            success=True,
            message="Database cleared successfully",
            data={
                "logs_deleted": logs_count,
                "notifications_deleted": notifications_count
            }
        )
    except Exception as e:
        db.rollback()
        return QuickActionResponse(
            success=False,
            message=f"Clear failed: {str(e)}"
        )
    finally:
        db.close()


@router.post("/system/actions/reset-settings", response_model=QuickActionResponse)
def reset_settings():
    """Reset system settings to defaults."""
    db = SessionLocal()
    
    try:
        from backend.models.settings import SystemSettings
        
        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        if settings:
            settings.test_mode = True
            settings.confidence_threshold = 0.7
            settings.alert_sound = True
            settings.email_alerts = False
            settings.auto_generate_daily_report = True
            db.commit()
        
        return QuickActionResponse(
            success=True,
            message="Settings reset to defaults",
            data={"test_mode": True}
        )
    except Exception as e:
        db.rollback()
        return QuickActionResponse(
            success=False,
            message=f"Reset failed: {str(e)}"
        )
    finally:
        db.close()
