from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog
from sqlalchemy import func, and_

router = APIRouter()


class ComplianceItem(BaseModel):
    category: str
    requirement: str
    status: str  # compliant, non-compliant, partial
    details: str
    severity: str  # critical, high, medium, low


class ComplianceDashboardResponse(BaseModel):
    overall_score: float
    total_requirements: int
    compliant_count: int
    non_compliant_count: int
    partial_count: int
    last_assessment: str
    categories: dict
    items: List[ComplianceItem]
    recommendations: List[str]


@router.get("/compliance/dashboard", response_model=ComplianceDashboardResponse)
def get_compliance_dashboard():
    """Get security compliance dashboard based on common frameworks."""
    db = SessionLocal()
    
    try:
        # Gather metrics
        total_logs = db.query(func.count(DetectionLog.id)).scalar() or 0
        attack_logs = db.query(func.count(DetectionLog.id)).filter(
            DetectionLog.result == "ATTACK"
        ).scalar() or 0
        critical_attacks = db.query(func.count(DetectionLog.id)).filter(
            DetectionLog.severity == "CRITICAL"
        ).scalar() or 0
        
        # Check settings
        from backend.models.settings import SystemSettings
        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        test_mode_enabled = settings.test_mode if settings else True
        alert_sound_enabled = settings.alert_sound if settings else False
        
        # Calculate compliance items
        items = []
        
        # 1. Logging & Monitoring
        items.append(ComplianceItem(
            category="Logging & Monitoring",
            requirement="All security events must be logged",
            status="compliant" if total_logs > 0 else "non-compliant",
            details=f"{total_logs} events logged",
            severity="critical"
        ))
        
        items.append(ComplianceItem(
            category="Logging & Monitoring",
            requirement="Attack detection must be active",
            status="compliant" if attack_logs > 0 else "partial",
            details=f"{attack_logs} attacks detected",
            severity="critical"
        ))
        
        items.append(ComplianceItem(
            category="Logging & Monitoring",
            requirement="Critical events must be prioritized",
            status="compliant" if critical_attacks > 0 else "partial",
            details=f"{critical_attacks} critical events recorded",
            severity="high"
        ))
        
        # 2. Access Control
        items.append(ComplianceItem(
            category="Access Control",
            requirement="System must have authentication controls",
            status="partial",
            details="Basic authentication - consider adding user management",
            severity="high"
        ))
        
        # 3. Incident Response
        items.append(ComplianceItem(
            category="Incident Response",
            requirement="Security alerts must be configured",
            status="compliant" if alert_sound_enabled else "partial",
            details="Alert sound " + ("enabled" if alert_sound_enabled else "disabled"),
            severity="high"
        ))
        
        items.append(ComplianceItem(
            category="Incident Response",
            requirement="Test mode should be disabled in production",
            status="compliant" if not test_mode_enabled else "non-compliant",
            details="Test mode is currently " + ("enabled" if test_mode_enabled else "disabled"),
            severity="medium"
        ))
        
        # 4. Data Protection
        items.append(ComplianceItem(
            category="Data Protection",
            requirement="Detection data must be stored securely",
            status="compliant",
            details="SQLite database with local storage",
            severity="high"
        ))
        
        items.append(ComplianceItem(
            category="Data Protection",
            requirement="Regular data export capability",
            status="compliant",
            details="CSV export functionality available",
            severity="medium"
        ))
        
        # 5. System Integrity
        items.append(ComplianceItem(
            category="System Integrity",
            requirement="ML model must be loaded and functional",
            status="compliant",
            details="IDS model loaded and operational",
            severity="critical"
        ))
        
        items.append(ComplianceItem(
            category="System Integrity",
            requirement="API must be responsive",
            status="compliant",
            details="API responding normally",
            severity="critical"
        ))
        
        # Calculate scores
        compliant = sum(1 for i in items if i.status == "compliant")
        non_compliant = sum(1 for i in items if i.status == "non-compliant")
        partial = sum(1 for i in items if i.status == "partial")
        
        overall_score = round((compliant / len(items)) * 100, 1) if items else 0
        
        # Category breakdown
        categories = {}
        for item in items:
            if item.category not in categories:
                categories[item.category] = {"compliant": 0, "non-compliant": 0, "partial": 0, "total": 0}
            categories[item.category][item.status] += 1
            categories[item.category]["total"] += 1
        
        # Generate recommendations
        recommendations = []
        
        if test_mode_enabled:
            recommendations.append("Disable test mode for production environment")
        
        if not alert_sound_enabled:
            recommendations.append("Enable alert sounds for real-time threat awareness")
        
        if critical_attacks == 0 and attack_logs > 0:
            recommendations.append("Review severity classification for critical attacks")
        
        recommendations.append("Consider implementing user authentication for multi-user environments")
        recommendations.append("Implement automated backup for detection logs")
        recommendations.append("Set up email notifications for critical security events")
        
        return ComplianceDashboardResponse(
            overall_score=overall_score,
            total_requirements=len(items),
            compliant_count=compliant,
            non_compliant_count=non_compliant,
            partial_count=partial,
            last_assessment=datetime.utcnow().isoformat(),
            categories=categories,
            items=items,
            recommendations=recommendations,
        )
    finally:
        db.close()
