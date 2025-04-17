import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from util.get_db import get_db
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from model.pharmacy_model import PharmacyPrescription
from schemas.prescription_schema import PrescriptionResponse
from model.inventory_model import Inventory
from util.pdf_parser import extract_text_from_pdf, extract_medicine_names
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from fastapi import Request

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
    doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    # ✅ Validate patient
    patient = db.query(User).filter(User.name == patient_name, User.user_id == patient_user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # ✅ Validate file
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_FOLDER}/{file_id}_{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # ✅ Extract medicines from PDF
    extracted_text = extract_text_from_pdf(file_path)
    medicines = extract_medicine_names(extracted_text)

    # ✅ Check stock levels using Inventory model
    low_stock = []
    for med in medicines:
        stock_item = db.query(Inventory).filter(Inventory.medicine_name.ilike(f"%{med}%")).first()
        if stock_item and stock_item.quantity < 10:  # Default threshold can be adjusted or made dynamic
            low_stock.append({
                "medicine": stock_item.medicine_name,
                "available": stock_item.quantity,
                "threshold": 10
            })

    if low_stock:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some medicines are below the stock threshold",
                "low_stock": low_stock
            }
        )

    # ✅ Save to DB
    new_prescription = Prescription(
        doctor_id=doctor.id,
        doctor_name=doctor.name,
        patient_name=patient.name,
        patient_user_id=patient.user_id,
        file_path=file_path
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)
    print("Parsed Medicines:", medicines)


    return new_prescription

@router.get("/", response_model=list[PrescriptionResponse])
async def get_prescriptions(
    name: str = Query(None),
    user_id: int = Query(None),
    token: str = Depends(oauth2_bearer),
    db: Session = Depends(get_db)
):
    # ✅ Decode user
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # ✅ Doctor fetching by name & ID
    if user and user.role == RoleEnum.doctor:
        if not name or not user_id:
            raise HTTPException(status_code=400, detail="Patient name and user ID required")
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_name == name,
            Prescription.patient_user_id == user_id
        ).all()
        return prescriptions

    # ✅ Patient fetching their own
    if user and user.role == RoleEnum.patient:
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_user_id == user.user_id
        ).all()
        return prescriptions

    raise HTTPException(status_code=403, detail="Unauthorized access")




@router.get("/view/{prescription_id}")
async def view_prescription(
    prescription_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    # ✅ Read token from either header or query param
    token = request.headers.get("authorization")
    if token and token.lower().startswith("bearer "):
        token = token.split(" ")[1]
    else:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="Authorization token missing")

    # ✅ Decode token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # ✅ Role-based access
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    from model.pharmacy_model import PharmacyPrescription

    if user.role == RoleEnum.patient and prescription.patient_user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if user.role == RoleEnum.doctor and prescription.doctor_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if user.role == RoleEnum.pharmacist:
        pharmacy_linked = db.query(PharmacyPrescription).filter(
            PharmacyPrescription.prescription_id == prescription_id
        ).first()
        if not pharmacy_linked:
            raise HTTPException(status_code=403, detail="Pharmacist not authorized for this prescription")

    return FileResponse(prescription.file_path, media_type="application/pdf", filename="prescription.pdf")
