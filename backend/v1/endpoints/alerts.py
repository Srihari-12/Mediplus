from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from util.get_db import get_db
from util.admin_only import admin_only
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum
from model.out_of_stock_model import OutOfStockEvent
from pydantic import BaseModel

router = APIRouter(tags=["Admin Alerts"])


# 📦 RESPONSE SCHEMAS
class OutOfStockEventResponse(BaseModel):
    medicine_name: str
    prescription_id: str
    timestamp: str


class ExpiredPrescriptionResponse(BaseModel):
    prescription_id: str
    status: str
    created_at: str


class HighVolumeAlertResponse(BaseModel):
    prescriptions_last_5_min: int
    threshold_exceeded: bool


# 🚨 1. Out-of-Stock Requests
@router.get(
    "/alerts/out-of-stock",
    response_model=list[OutOfStockEventResponse],
    dependencies=[Depends(admin_only)],
)
def get_out_of_stock_alerts(db: Session = Depends(get_db)):
    """
    Fetches the latest out-of-stock events logged during prescription processing.
    """
    recent_events = (
        db.query(OutOfStockEvent)
        .order_by(OutOfStockEvent.timestamp.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "medicine_name": e.medicine_name,
            "prescription_id": e.prescription_id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else "",
        }
        for e in recent_events
    ]


# ⚠️ 2. Expired Prescriptions (> 48 hrs old and not picked up)
@router.get(
    "/alerts/expired-prescriptions",
    response_model=list[ExpiredPrescriptionResponse],
    dependencies=[Depends(admin_only)],
)
def get_expired_prescriptions(db: Session = Depends(get_db)):
    """
    Returns prescriptions that were created over 48 hours ago and are still not picked up.
    """
    expiry_threshold = datetime.utcnow() - timedelta(hours=48)

    expired = (
        db.query(PharmacyPrescription)
        .filter(
            PharmacyPrescription.created_at < expiry_threshold,
            PharmacyPrescription.status != OrderStatusEnum.picked_up,
        )
        .all()
    )

    return [
        {
            "prescription_id": p.prescription_id,
            "status": p.status.value,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        }
        for p in expired
    ]


# 📈 3. High Volume Prescriptions (> 10 in 5 mins)
@router.get(
    "/alerts/high-volume",
    response_model=HighVolumeAlertResponse,
    dependencies=[Depends(admin_only)],
)
def high_volume_alert(db: Session = Depends(get_db)):
    """
    Checks if the number of new prescriptions in the past 5 minutes exceeds the alert threshold.
    """
    recent_window = datetime.utcnow() - timedelta(minutes=5)

    count = (
        db.query(PharmacyPrescription)
        .filter(PharmacyPrescription.created_at >= recent_window)
        .count()
    )

    return {
        "prescriptions_last_5_min": count,
        "threshold_exceeded": count >= 10,
    }
