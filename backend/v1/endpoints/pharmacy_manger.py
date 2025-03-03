from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from util.get_db import get_db
from model.prescription_model import Prescription
from model.pharmacy_model import PharmacyPrescription, OrderStatusEnum
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from datetime import datetime