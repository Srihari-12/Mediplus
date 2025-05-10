import random
import string
import uuid
import re
from datetime import datetime
from difflib import get_close_matches

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from util.get_db import get_db
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum
from model.inventory_model import Inventory
from util.pdf_parser import extract_text_from_pdf, clean_extracted_text, extract_medicine_and_qty
from util.queue_manager import add_to_queue, remove_from_queue  # Updated imports

router = APIRouter(tags=["Pharmacy"], prefix="/pharmacy")


def generate_otp():
    return "".join(random.choices(string.digits, k=6))


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

    extracted_text = extract_text_from_pdf(prescription.file_path)
    cleaned_text = clean_extracted_text(extracted_text)
    medicines = extract_medicine_and_qty(cleaned_text)

    if not medicines:
        raise HTTPException(status_code=400, detail="No valid medicines found in prescription.")

    inventory_items = db.query(Inventory).all()
    inventory_names = [item.medicine_name.lower() for item in inventory_items]

    low_stock = []
    matched_names = []
    inventory_updates = []

    for med in medicines:
        input_name = med["medicine"].strip().lower()
        qty_str = med.get("quantity", "1")
        qty = int(re.findall(r"\d+", qty_str)[0]) if re.findall(r"\d+", qty_str) else 1

        stock = db.query(Inventory).filter(Inventory.medicine_name.ilike(f"%{input_name}%")).first()

        if not stock:
            match = get_close_matches(input_name, inventory_names, n=1, cutoff=0.75)
            if match:
                stock = next((i for i in inventory_items if i.medicine_name.lower() == match[0]), None)

        if stock:
            if stock.quantity < qty:
                low_stock.append({"medicine": stock.medicine_name, "available": stock.quantity, "required": qty})
            else:
                matched_names.append(stock.medicine_name)
                inventory_updates.append((stock, qty))
        else:
            low_stock.append({"medicine": med["medicine"], "available": 0, "required": qty})

    if low_stock:
        raise HTTPException(
            status_code=422,
            detail={"message": "Insufficient stock or unrecognized medicines", "low_stock": low_stock}
        )

    for stock, qty in inventory_updates:
        stock.quantity -= qty

    # Assign type to each matched medicine and queue it
    medicines_payload = [
        {
            "name": name,
            "type": "edge" if "syrup" in name.lower() or "injection" in name.lower() else "regular"
        }
        for name in matched_names
    ]
    queue_id, estimated_time = add_to_queue(prescription.id, medicines_payload)

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

    return {
        "message": "Prescription sent to pharmacy",
        "otp_code": record.otp_code,
        "estimated_wait_time_seconds": estimated_time,
        "queue_id": queue_id
    }


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
        raise HTTPException(status_code=404, detail="Prescription not found or already in progress")

    record.pharmacist_id = pharmacist.id
    record.status = OrderStatusEnum.preparing
    record.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Prescription marked as preparing"}


@router.post("/confirm-pickup/{prescription_id}")
async def confirm_pickup(
    prescription_id: str,
    otp_code: str,
    db: Session = Depends(get_db)
):
    record = db.query(PharmacyPrescription).filter(
        PharmacyPrescription.prescription_id == prescription_id,
        PharmacyPrescription.otp_code == otp_code
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Invalid OTP or record not found")

    record.status = OrderStatusEnum.picked_up
    record.updated_at = datetime.utcnow()
    db.commit()

    # Remove from Redis queue
    remove_from_queue(prescription_id)

    return {"message": "Prescription successfully picked up"}


@router.get("/list")
async def get_all_prescriptions(
    pharmacist: User = Depends(get_current_pharmacist),
    db: Session = Depends(get_db)
):
    records = db.query(PharmacyPrescription).order_by(PharmacyPrescription.created_at.desc()).all()
    prescriptions = []

    for r in records:
        pres = db.query(Prescription).filter(Prescription.id == r.prescription_id).first()
        if pres:
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
