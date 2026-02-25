from fastapi import APIRouter
from sqlalchemy import func, case, cast, Date
from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/analytics/summary")
def get_analytics_summary():
    """
    Return aggregated analytics data computed from detection_logs.
    """
    db = SessionLocal()

    try:
        # ─── Totals ───
        total_requests = db.query(func.count(DetectionLog.id)).scalar() or 0
        total_attacks = (
            db.query(func.count(DetectionLog.id))
            .filter(DetectionLog.result == "ATTACK")
            .scalar()
            or 0
        )
        total_normal = total_requests - total_attacks
        attack_rate = round((total_attacks / total_requests) * 100, 1) if total_requests > 0 else 0.0

        # ─── Top Attack Types ───
        top_attack_rows = (
            db.query(
                DetectionLog.attack_type,
                func.count(DetectionLog.id).label("count"),
            )
            .filter(DetectionLog.result == "ATTACK")
            .filter(DetectionLog.attack_type.isnot(None))
            .group_by(DetectionLog.attack_type)
            .order_by(func.count(DetectionLog.id).desc())
            .limit(10)
            .all()
        )
        top_attack_types = [{"type": row[0], "count": row[1]} for row in top_attack_rows]

        # ─── Severity Distribution ───
        severity_rows = (
            db.query(
                DetectionLog.severity,
                func.count(DetectionLog.id).label("count"),
            )
            .filter(DetectionLog.severity.isnot(None))
            .group_by(DetectionLog.severity)
            .all()
        )
        severity_distribution = {level: 0 for level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
        for row in severity_rows:
            if row[0] in severity_distribution:
                severity_distribution[row[0]] = row[1]

        # ─── Attacks Over Time (last 30 days) ───
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        time_rows = (
            db.query(
                func.date(DetectionLog.timestamp).label("date"),
                func.count(DetectionLog.id).label("attacks"),
            )
            .filter(DetectionLog.result == "ATTACK")
            .filter(DetectionLog.timestamp >= thirty_days_ago)
            .group_by(func.date(DetectionLog.timestamp))
            .order_by(func.date(DetectionLog.timestamp))
            .all()
        )
        attacks_over_time = [
            {"date": str(row[0]), "attacks": row[1]} for row in time_rows
        ]

        # ─── Traffic Over Time (for area chart) ───
        traffic_rows = (
            db.query(
                func.date(DetectionLog.timestamp).label("date"),
                func.count(DetectionLog.id).label("total"),
                func.sum(
                    case((DetectionLog.result == "ATTACK", 1), else_=0)
                ).label("attacks"),
            )
            .filter(DetectionLog.timestamp >= thirty_days_ago)
            .group_by(func.date(DetectionLog.timestamp))
            .order_by(func.date(DetectionLog.timestamp))
            .all()
        )
        traffic_over_time = [
            {"date": str(row[0]), "total": row[1], "attacks": row[2]}
            for row in traffic_rows
        ]

        return {
            "total_requests": total_requests,
            "total_attacks": total_attacks,
            "total_normal": total_normal,
            "attack_rate": attack_rate,
            "top_attack_types": top_attack_types,
            "severity_distribution": severity_distribution,
            "attacks_over_time": attacks_over_time,
            "traffic_over_time": traffic_over_time,
        }

    finally:
        db.close()
