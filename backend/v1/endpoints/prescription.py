import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from util.get_db import get_db
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from util.pdf_parser import extract_text_from_pdf, clean_extracted_text, extract_medicine_and_qty

from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from model.inventory_model import Inventory
from model.pharmacy_model import PharmacyPrescription

from schemas.prescription_schema import PrescriptionResponse

router = APIRouter(tags=["Prescriptions"], prefix="/prescriptions")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ========== AUTH HELPERS ==========

def get_current_doctor(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        doctor = db.query(User).filter(User.email == email).first()
        if not doctor or doctor.role != RoleEnum.doctor:
            raise HTTPException(status_code=403, detail="Only doctors can upload prescriptions")
        return doctor
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_patient(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        patient = db.query(User).filter(User.email == email).first()
        if not patient or patient.role != RoleEnum.patient:
            raise HTTPException(status_code=403, detail="Only patients can view prescriptions")
        return patient
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ========== ROUTES ==========


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    patient_name: str = Form(...),
    patient_user_id: int = Form(...),
    file: UploadFile = File(...),
    remarks: str = Form(None),
    doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    # ✅ Validate patient
    patient = db.query(User).filter(User.name == patient_name, User.user_id == patient_user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_FOLDER}/{file_id}_{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    extracted_text = extract_text_from_pdf(file_path)
    cleaned = clean_extracted_text(extracted_text)
    medicine_data = extract_medicine_and_qty(cleaned)

    if not medicine_data:
        raise HTTPException(status_code=400, detail="No valid medicines found in the prescription.")

    low_stock_alerts = []
    for med in medicine_data:
        name = med["medicine"]
        qty_str = med.get("quantity", "1")
        qty = int("".join(filter(str.isdigit, qty_str))) if any(char.isdigit() for char in qty_str) else 1

        item = db.query(Inventory).filter(Inventory.medicine_name.ilike(f"%{name}%")).first()
        if item:
            print(f"🧪 Checking: {item.medicine_name} | Qty: {item.quantity} | Threshold: {item.threshold}")
            threshold = item.threshold if item.threshold is not None else 10
            if item.quantity < threshold:
                print("⚠️ Low stock triggered for:", item.medicine_name)
                low_stock_alerts.append({
                    "medicine": item.medicine_name,
                    "available_quantity": item.quantity,
                    "threshold": threshold
                })

    if low_stock_alerts:
        print("🚨 Raising low stock alert")
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some medicines are below the stock threshold.",
                "low_stock": low_stock_alerts
            }
        )

    new_prescription = Prescription(
        doctor_id=doctor.id,
        doctor_name=doctor.name,
        patient_name=patient.name,
        patient_user_id=patient.user_id,
        file_path=file_path,
        remarks=remarks
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return PrescriptionResponse(
        id=new_prescription.id,
        doctor_name=new_prescription.doctor_name,
        patient_name=new_prescription.patient_name,
        patient_user_id=new_prescription.patient_user_id,
        file_path=new_prescription.file_path,
        created_at=new_prescription.created_at,
        estimated_pickup_time_min=0,
        message="Prescription uploaded successfully.",
        remarks=new_prescription.remarks
    )


@router.get("/", response_model=list[PrescriptionResponse])
async def get_prescriptions(
    name: str = Query(None),
    user_id: int = Query(None),
    token: str = Depends(oauth2_bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if user.role == RoleEnum.doctor:
        if not name or not user_id:
            raise HTTPException(status_code=400, detail="Patient name and user ID required")
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_name == name,
            Prescription.patient_user_id == user_id
        ).all()
    elif user.role == RoleEnum.patient:
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_user_id == user.user_id
        ).all()
    else:
        raise HTTPException(status_code=403, detail="Unauthorized access")

    return [
    PrescriptionResponse(
        id=p.id,
        doctor_name=p.doctor_name,
        patient_name=p.patient_name,
        patient_user_id=p.patient_user_id,
        file_path=p.file_path,
        created_at=p.created_at,
        estimated_pickup_time_min=0,
        message="Loaded",
        remarks=p.remarks  # ✅ Include this always
    ) for p in prescriptions
    ]
@router.post("/override", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def override_upload_prescription(
    patient_name: str = Form(...),
    patient_user_id: int = Form(...),
    file: UploadFile = File(...),
    remarks: str = Form(None),
    doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    patient = db.query(User).filter(User.name == patient_name, User.user_id == patient_user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_FOLDER}/{file_id}_{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    extracted_text = extract_text_from_pdf(file_path)
    cleaned = clean_extracted_text(extracted_text)
    medicine_data = extract_medicine_and_qty(cleaned)

    if not medicine_data:
        raise HTTPException(status_code=400, detail="No valid medicines found in the prescription.")

    new_prescription = Prescription(
        doctor_id=doctor.id,
        doctor_name=doctor.name,
        patient_name=patient.name,
        patient_user_id=patient.user_id,
        file_path=file_path,
        remarks=remarks
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return PrescriptionResponse(
        id=new_prescription.id,
        doctor_name=new_prescription.doctor_name,
        patient_name=new_prescription.patient_name,
        patient_user_id=new_prescription.patient_user_id,
        file_path=new_prescription.file_path,
        created_at=new_prescription.created_at,
        estimated_pickup_time_min=0,
        message="Prescription uploaded with override.",
        remarks=new_prescription.remarks
    )

@router.get("/view/{prescription_id}")
async def view_prescription(
    prescription_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.headers.get("authorization")
    if token and token.lower().startswith("bearer "):
        token = token.split(" ")[1]
    else:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="Authorization token missing")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if user.role == RoleEnum.patient and prescription.patient_user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if user.role == RoleEnum.doctor and prescription.doctor_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if user.role == RoleEnum.pharmacist:
        linked = db.query(PharmacyPrescription).filter(
            PharmacyPrescription.prescription_id == prescription_id
        ).first()
        if not linked:
            raise HTTPException(status_code=403, detail="Pharmacist not authorized")

    return FileResponse(prescription.file_path, media_type="application/pdf", filename="prescription.pdf")
