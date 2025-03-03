import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from util.get_db import get_db
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from datetime import datetime
import uuid
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum

router = APIRouter(tags=["Pharmacy"], prefix="/pharmacy")


# ✅ Generate a 6-digit OTP
def generate_otp():
    return "".join(random.choices(string.digits, k=6))


# ✅ Authenticate Patient
def get_current_patient(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user or user.role != RoleEnum.patient:
            raise HTTPException(status_code=403, detail="Only patients can send prescriptions to pharmacy")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ✅ Authenticate Pharmacist
def get_current_pharmacist(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        pharmacist = db.query(User).filter(User.email == email).first()

        if not pharmacist or pharmacist.role != RoleEnum.pharmacist:
            raise HTTPException(status_code=403, detail="Only pharmacists can view prescriptions")
        return pharmacist
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ✅ Patient Sends Prescription to Pharmacy
@router.post("/send/{prescription_id}")
async def send_prescription_to_pharmacy(
    prescription_id: str, 
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.patient_user_id == patient.user_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    otp_code = generate_otp()  # ✅ Generate a new OTP

    new_pharmacy_prescription = PharmacyPrescription(
        id=str(uuid.uuid4()),
        prescription_id=prescription.id,
        patient_user_id=prescription.patient_user_id, 
        pharmacist_id=None,
        status=OrderStatusEnum.pending,
        otp_code=otp_code,  # ✅ Store OTP here
        created_at=datetime.utcnow()
    )
    
    db.add(new_pharmacy_prescription)
    db.commit()
    db.refresh(new_pharmacy_prescription)

    return {
        "message": "Prescription sent to pharmacy successfully",
        "otp_code": otp_code  # ✅ Ensure OTP is returned in response
    }


# ✅ Pharmacist Views Pending Prescriptions
@router.get("/pending", response_model=list)
async def get_pending_prescriptions(pharmacist: User = Depends(get_current_pharmacist), db: Session = Depends(get_db)):
    prescriptions = db.query(PharmacyPrescription).filter(
        PharmacyPrescription.status == OrderStatusEnum.pending
    ).all()

    if not prescriptions:
        raise HTTPException(status_code=404, detail="No pending prescriptions")

    return [
        {
            "id": p.id,
            "prescription_id": p.prescription_id,
            "patient_user_id": p.patient_user_id,
            "otp_code": p.otp_code,
            "status": p.status.value,  # Convert Enum to string
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for p in prescriptions
    ]


@router.post("/confirm-pickup/{prescription_id}")
async def confirm_pickup(
    prescription_id: str, otp_code: str,
    db: Session = Depends(get_db)
):
    # Find prescription in the pharmacy records
    pharmacy_prescription = db.query(PharmacyPrescription).filter(
        PharmacyPrescription.prescription_id == prescription_id,
        PharmacyPrescription.otp_code == otp_code
    ).first()

    if not pharmacy_prescription:
        raise HTTPException(status_code=404, detail="Invalid OTP or prescription not found")


    pharmacy_prescription.status = OrderStatusEnum.picked_up  
    db.commit()
    db.refresh(pharmacy_prescription)

    return {"message": "Prescription picked up successfully"}
