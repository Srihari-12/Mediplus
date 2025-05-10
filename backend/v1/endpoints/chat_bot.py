from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
import requests

from util.get_db import get_db
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from model.user_model import User, RoleEnum
from model.prescription_model import Prescription
from schemas.common_schemas import PromptRequest
from util.pdf_parser import extract_text_from_pdf, clean_extracted_text, extract_medicine_and_qty

load_dotenv()

router = APIRouter(tags=["ChatBot"])

# ✅ Load securely from environment
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct")

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY is not set in .env")

def call_openrouter_model(prompt: str) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 150,
        "temperature": 0.7
    }

    response = requests.post(url, headers=headers, json=payload)

    print("🤖 OR Status:", response.status_code)
    print("🤖 OR Raw:", response.text)

    if response.status_code != 200:
        raise Exception(f"OpenRouter API error: {response.text}")

    result = response.json()
    return result["choices"][0]["message"]["content"].strip()


def get_current_patient(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        patient = db.query(User).filter(User.email == email).first()
        if not patient or patient.role != RoleEnum.patient:
            raise HTTPException(status_code=403, detail="Only patients can access this feature")
        return patient
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/chatbot/suggest_questions")
async def suggest_questions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_patient),
):
    prescription = db.query(Prescription)\
        .filter(Prescription.patient_user_id == user.user_id)\
        .order_by(Prescription.created_at.desc())\
        .first()

    if not prescription:
        raise HTTPException(status_code=404, detail="No prescriptions found.")

    try:
        raw_text = extract_text_from_pdf(prescription.file_path)
        cleaned = clean_extracted_text(raw_text)
        meds = extract_medicine_and_qty(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR parsing failed: {e}")

    if not meds:
        raise HTTPException(status_code=400, detail="No medicines extracted from the prescription.")

    med_list = ", ".join(f"{m['medicine']} {m['quantity']}" for m in meds)

    prompt = (
        f"The patient is visiting a doctor next week. They were prescribed the following medicines: {med_list}. "
        "Suggest 3 meaningful follow-up questions they should ask the doctor during their visit."
    )

    try:
        reply = call_openrouter_model(prompt)
        return {"questions": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chatbot/ask")
async def ask_question(
    request: PromptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_patient),
):
    try:
        reply = call_openrouter_model(request.prompt)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
