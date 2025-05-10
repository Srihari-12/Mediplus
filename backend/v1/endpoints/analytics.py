from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func
from datetime import datetime, timedelta
from util.get_db import get_db
from model.prescription_model import Prescription
from model.pharmacy_model import PharmacyPrescription
from model.user_model import User
from pydantic import BaseModel
from typing import List
import json
from collections import Counter

router = APIRouter(tags=["Admin Analytics"])


# 📊 Response Schemas
class TopMedicineStat(BaseModel):
    medicine_name: str
    total_prescribed: int

class DayOfWeekStat(BaseModel):
    day: str
    count: int

class DoctorPrescriptionStat(BaseModel):
    doctor_name: str
    total_uploaded: int



# 2️⃣ Peak Day-Wise Prescription Volume
@router.get("/analytics/peak-day", response_model=List[DayOfWeekStat])
def prescriptions_by_day(db: Session = Depends(get_db)):
    from sqlalchemy.sql import func
    
    past_month = datetime.utcnow() - timedelta(days=30)
    
    prescriptions = db.query(
        func.dayname(PharmacyPrescription.created_at).label("day"),
        func.count().label("count")
    ).filter(
        PharmacyPrescription.created_at >= past_month
    ).group_by(
        func.dayname(PharmacyPrescription.created_at)
    ).all()

    return [{"day": row.day, "count": row.count} for row in prescriptions]


@router.get("/analytics/prescriptions-by-doctor", response_model=List[DoctorPrescriptionStat])
def prescriptions_by_doctor(db: Session = Depends(get_db)):
    one_month_ago = datetime.utcnow() - timedelta(days=30)

    results = (
        db.query(
            User.name.label("doctor_name"),
            func.count(Prescription.id).label("total_uploaded")
        )
        .join(Prescription, User.id == Prescription.doctor_id)
        .filter(Prescription.created_at >= one_month_ago)
        .group_by(User.name)
        .order_by(func.count(Prescription.id).desc())
        .all()
    )

    return [{"doctor_name": row.doctor_name, "total_uploaded": row.total_uploaded} for row in results]
