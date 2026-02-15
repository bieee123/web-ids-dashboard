from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.schemas.ids_schema import IDSInput
import pandas as pd
import joblib
import os

from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog


router = APIRouter()


# =====================================================
# 1️⃣ Using Imported Schema with Defaults
# =====================================================
# IDSInput is imported from backend.schemas.ids_schema


# =====================================================
# 2️⃣ Load Model (Once at Startup)
# =====================================================

MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../model/ids_model.pkl")
)

try:
    model = joblib.load(MODEL_PATH)
    print("✅ IDS Model Loaded Successfully")
except Exception as e:
    print("❌ Failed to load model:", e)
    model = None


# =====================================================
# 3️⃣ Detection Endpoint
# =====================================================

@router.post("/detect")
def detect(data: IDSInput):

    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    db = SessionLocal()

    try:
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
        confidence = float(max(probabilities))

        # 🔹 Labels
        result = "ATTACK" if prediction == 1 else "NORMAL"
        attack_type = str(model.classes_[prediction])

        # Save to database
        log_entry = DetectionLog(
            duration=data.duration,
            protocol=data.protocol_type,
            service=data.service,
            flag=data.flag,
            result=result,
            attack_type=attack_type,
            confidence=confidence
        )

        db.add(log_entry)
        db.commit()
        db.close()

        # 🔹 Return response
        return {
            "prediction": prediction,
            "result": result,
            "attack_type": attack_type,
            "confidence": round(confidence, 4)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        db.close()
