import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from util.get_db import get_db
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from schemas.prescription_schema import PrescriptionResponse
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM

router = APIRouter(tags=["Prescriptions"], prefix="/prescriptions")

# Ensure upload directory exists
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)



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


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    patient_name: str, patient_user_id: int, file: UploadFile = File(...), 
    doctor: User = Depends(get_current_doctor), db: Session = Depends(get_db)
):
    # Check if patient exists
    patient = db.query(User).filter(User.name == patient_name, User.user_id == patient_user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Generate unique file path
    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_FOLDER}/{file_id}_{file.filename}"

    # Save file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # ✅ Check if doctor's name is fetched correctly
    print(f"Uploading Prescription - Doctor Name: {doctor.name}, Doctor ID: {doctor.id}")

    # Save prescription details to database
    new_prescription = Prescription(
        doctor_id=doctor.id,  # Extracted from JWT
        doctor_name=doctor.name,  # ✅ Save the doctor's name permanently
        patient_name=patient.name,
        patient_user_id=patient.user_id,
        file_path=file_path
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription


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



@router.get("/", response_model=list[PrescriptionResponse])
async def get_prescriptions(patient: User = Depends(get_current_patient), db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).filter(Prescription.patient_user_id == patient.user_id).all()

    if not prescriptions:
        raise HTTPException(status_code=404, detail="No prescriptions found for this patient")

    return prescriptions



@router.get("/view/{prescription_id}")
async def view_prescription(
    prescription_id: str,
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    # Fetch the prescription from the database
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.patient_user_id == patient.user_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Validate if the file exists
    file_path = prescription.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Return the file as a response
    return FileResponse(file_path, media_type="application/pdf", filename=os.path.basename(file_path))
