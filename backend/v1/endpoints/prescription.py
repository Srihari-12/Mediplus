import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from util.get_db import get_db
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from schemas.prescription_schema import PrescriptionResponse
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM

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
    token: str = Depends(oauth2_bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    # ✅ Doctor or Patient can access file (based on ownership)
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if user.role == RoleEnum.patient and prescription.patient_user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if user.role == RoleEnum.doctor and prescription.doctor_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = prescription.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type="application/pdf", filename=os.path.basename(file_path))
