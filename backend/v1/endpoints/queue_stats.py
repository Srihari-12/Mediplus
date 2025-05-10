from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum
from util.get_db import get_db
from util.admin_only import admin_only

router = APIRouter(tags=["Admin Dashboard"])

@router.get("/dashboard/queue_stats", dependencies=[Depends(admin_only)])
def get_queue_stats(
    db: Session = Depends(get_db),
    start_date: datetime = Query(default=None),
    end_date: datetime = Query(default=None)
):
    if not start_date:
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.utcnow()

    prescriptions = db.query(PharmacyPrescription).filter(
        PharmacyPrescription.created_at >= start_date,
        PharmacyPrescription.created_at <= end_date
    ).all()

    pending = sum(1 for p in prescriptions if p.status == OrderStatusEnum.pending)
    preparing = sum(1 for p in prescriptions if p.status == OrderStatusEnum.preparing)
    picked_up = sum(1 for p in prescriptions if p.status == OrderStatusEnum.picked_up)

    wait_times = [
        (p.updated_at - p.created_at).total_seconds()
        for p in prescriptions
        if p.status == OrderStatusEnum.picked_up and p.updated_at
    ]
    avg_wait_time = round(sum(wait_times) / len(wait_times), 2) if wait_times else 0

    return {
        "from": start_date.isoformat(),
        "to": end_date.isoformat(),
        "total_pharmacy_prescriptions": len(prescriptions),
        "status_counts": {
            "pending": pending,
            "preparing": preparing,
            "picked_up": picked_up,
        },
        "current_queue_length": pending + preparing,
        "avg_wait_time_sec": avg_wait_time
    }
