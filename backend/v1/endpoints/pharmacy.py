import random
import string
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi.responses import FileResponse

from util.get_db import get_db
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum
from model.inventory_model import Inventory
from util.pdf_parser import extract_text_from_pdf, extract_medicine_names

router = APIRouter(tags=["Pharmacy"], prefix="/pharmacy")

# ✅ Generate OTP
def generate_otp():
    return "".join(random.choices(string.digits, k=6))

# ✅ Role-Based Token Auth
def get_user_by_role(role: RoleEnum):
    def wrapper(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()
            if not user or user.role != role:
                raise HTTPException(status_code=403, detail=f"Only {role.value}s allowed")
            return user
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    return wrapper

get_current_patient = get_user_by_role(RoleEnum.patient)
get_current_pharmacist = get_user_by_role(RoleEnum.pharmacist)

# ✅ Send Prescription to Pharmacy (Patient)
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

    # Extract medicines from PDF
    extracted_text = extract_text_from_pdf(prescription.file_path)
    medicines = extract_medicine_names(extracted_text)

    # Subtract stock
    low_stock = []
    for med in medicines:
        stock = db.query(Inventory).filter(Inventory.medicine_name.ilike(f"%{med}%")).first()
        if stock:
            if stock.quantity < 1:
                low_stock.append({"medicine": stock.medicine_name, "available": stock.quantity})
            else:
                stock.quantity -= 1
        else:
            low_stock.append({"medicine": med, "available": 0})

    if low_stock:
        raise HTTPException(
            status_code=422,
            detail={"message": "Insufficient stock", "low_stock": low_stock}
        )

    # Save prescription to pharmacy records
    otp_code = generate_otp()
    record = PharmacyPrescription(
        id=str(uuid.uuid4()),
        prescription_id=prescription.id,
        patient_user_id=prescription.patient_user_id,
        otp_code=otp_code,
        status=OrderStatusEnum.pending,
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"message": "Prescription sent", "otp_code": otp_code}

# ✅ Confirm Pickup with OTP (Pharmacist)
@router.post("/confirm-pickup/{prescription_id}")
async def confirm_pickup(prescription_id: str, otp_code: str, db: Session = Depends(get_db)):
    record = db.query(PharmacyPrescription).filter(
        PharmacyPrescription.prescription_id == prescription_id,
        PharmacyPrescription.otp_code == otp_code
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Invalid OTP or record not found")

    record.status = OrderStatusEnum.picked_up
    db.commit()
    return {"message": "Prescription picked up"}

# ✅ Get All Prescriptions (Pharmacist)
@router.get("/list")
async def get_all_prescriptions(pharmacist: User = Depends(get_current_pharmacist), db: Session = Depends(get_db)):
    records = db.query(PharmacyPrescription).all()
    prescriptions = []

    for r in records:
        pres = db.query(Prescription).filter(Prescription.id == r.prescription_id).first()
        if not pres:
            continue
        prescriptions.append({
            "id": r.id,
            "prescription_id": r.prescription_id,
            "patient_user_id": r.patient_user_id,
            "otp_code": r.otp_code,
            "status": r.status.value,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "doctor_name": pres.doctor_name,
            "patient_name": pres.patient_name
        })

    return prescriptions


@router.post("/mark-preparing/{prescription_id}")
async def mark_as_preparing(
    prescription_id: str,
    pharmacist: User = Depends(get_current_pharmacist),
    db: Session = Depends(get_db)
):
    record = db.query(PharmacyPrescription).filter(
        PharmacyPrescription.prescription_id == prescription_id,
        PharmacyPrescription.status == OrderStatusEnum.pending
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Prescription not found or not in pending state")

    # ✅ Assign correct foreign key — pharmacist.id (not user_id)
    record.pharmacist_id = pharmacist.id
    record.status = OrderStatusEnum.preparing
    record.updated_at = datetime.utcnow()

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to mark preparing: {str(e)}")

    return {"message": "Prescription marked as preparing"}
