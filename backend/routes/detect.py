from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.schemas.ids_schema import IDSInput
import pandas as pd
import joblib
import os
import random
from datetime import datetime

from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog
from backend.models.settings import SystemSettings


router = APIRouter()


# =====================================================
# 🔧 TEST_MODE Toggle - Dynamic from Database
# =====================================================
# When test_mode=True  → use random attack simulation (for demo/testing)
# When test_mode=False → use real ML model predictions


# =====================================================
# 1️⃣ Attack Simulation Config
# =====================================================

ATTACK_TYPES = [
    "SQL Injection",
    "Cross-Site Scripting (XSS)",
    "DDoS",
    "Brute Force",
    "Port Scan",
    "Ransomware",
    "Botnet Activity",
    "Phishing Attempt",
    "Privilege Escalation",
]


def get_severity(confidence: float) -> str:
    """Calculate severity level based on confidence score."""
    if confidence >= 0.9:
        return "CRITICAL"
    elif confidence >= 0.75:
        return "HIGH"
    elif confidence >= 0.5:
        return "MEDIUM"
    else:
        return "LOW"


def simulate_detection() -> dict:
    """Generate a random detection result for testing purposes."""
    is_attack = random.random() < 0.60  # 60% attack, 40% normal

    if is_attack:
        confidence = round(random.uniform(0.75, 0.99), 2)
        attack_type = random.choice(ATTACK_TYPES)
        result = "ATTACK"
        prediction = 1
    else:
        confidence = round(random.uniform(0.10, 0.40), 2)
        attack_type = None
        result = "NORMAL"
        prediction = 0

    severity = get_severity(confidence)

    return {
        "prediction": prediction,
        "result": result,
        "attack_type": attack_type,
        "confidence": confidence,
        "severity": severity,
    }


def get_test_mode_from_db() -> bool:
    """Get the current test_mode setting from database."""
    db = SessionLocal()
    try:
        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        if settings:
            return settings.test_mode
        return True  # Default to test mode if no settings exist
    finally:
        db.close()


def get_model():
    """Load ML model if not in test mode."""
    MODEL_PATH = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../model/ids_model.pkl")
    )
    
    try:
        model = joblib.load(MODEL_PATH)
        return model
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return None


# =====================================================
# Detection Endpoint
# =====================================================

@router.post("/detect")
def detect(data: IDSInput):
    db = SessionLocal()

    try:
        # ─── Get test mode from database ───
        test_mode = get_test_mode_from_db()

        # ─── TEST MODE: Random Simulation ───
        if test_mode:
            sim = simulate_detection()
            prediction = sim["prediction"]
            result = sim["result"]
            attack_type = sim["attack_type"]
            confidence = sim["confidence"]
            severity = sim["severity"]

        # ─── PRODUCTION MODE: Real ML Model ───
        else:
            model = get_model()
            if model is None:
                raise HTTPException(
                    status_code=500,
                    detail="ML Model not loaded. Please ensure the model file exists."
                )

            # 🔹 Convert input to DataFrame
            input_dict = data.model_dump()
            df = pd.DataFrame([input_dict])

            # 🔹 One-hot encoding
            df = pd.get_dummies(df)

            # 🔹 Align with trained model features
            model_features = model.feature_names_in_
            df = df.reindex(columns=model_features, fill_value=0)

            # 🔹 Prediction
            prediction = int(model.predict(df)[0])
            probabilities = model.predict_proba(df)[0]
            confidence = round(float(max(probabilities)), 2)

            # 🔹 Labels
            result = "ATTACK" if prediction == 1 else "NORMAL"
            attack_type = str(model.classes_[prediction]) if prediction == 1 else None
            severity = get_severity(confidence)

        # ─── Save to Database ───
        log_entry = DetectionLog(
            duration=data.duration,
            protocol=data.protocol_type,
            service=data.service,
            flag=data.flag,
            result=result,
            attack_type=attack_type,
            confidence=confidence,
            severity=severity,
        )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        # ─── Create Notification for Attacks ───
        if result == "ATTACK":
            from backend.models.notification import Notification

            # Check for duplicate recent notification (anti-spam)
            from datetime import timedelta
            recent_similar = db.query(Notification).filter(
                Notification.type == "ATTACK",
                Notification.related_id == log_entry.id,
                Notification.timestamp >= datetime.utcnow() - timedelta(minutes=1)
            ).first()

            if not recent_similar:
                # Determine priority prefix based on severity
                priority_prefix = {
                    "CRITICAL": "🔴 CRITICAL",
                    "HIGH": "🟠 HIGH",
                    "MEDIUM": "🟡 MEDIUM",
                    "LOW": "🔵 LOW",
                }.get(severity, "⚪")

                notification = Notification(
                    type="ATTACK",
                    title=f"{priority_prefix}: {attack_type or 'Attack'} Detected",
                    message=f"Attack detected with {confidence*100:.0f}% confidence. Severity: {severity}",
                    severity=severity,
                    related_id=log_entry.id,
                )
                db.add(notification)
                db.commit()

        # 🔹 Return response
        return {
            "prediction": prediction,
            "result": result,
            "attack_type": attack_type,
            "confidence": confidence,
            "severity": severity,
            "timestamp": log_entry.timestamp.isoformat() if log_entry.timestamp else None,
            "protocol_type": data.protocol_type,
            "service": data.service,
            "flag": data.flag,
            "duration": data.duration,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        db.close()
