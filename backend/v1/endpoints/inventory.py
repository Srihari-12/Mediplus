import csv
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from util.get_db import get_db
from model.inventory_model import Inventory
from schemas.inventory_schemas import InventoryCreate, InventoryUpdate, InventoryResponse
from model.user_model import User, RoleEnum
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(tags=["Inventory"], prefix="/admin/inventory")


def get_current_admin(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        admin = db.query(User).filter(User.email == email).first()

        if not admin or admin.role != RoleEnum.admin:
            raise HTTPException(status_code=403, detail="Only admins can access inventory")
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/", response_model=list[InventoryResponse])
def get_inventory(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Inventory).all()


@router.post("/add", response_model=InventoryResponse)
def add_medicine(item: InventoryCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_item = Inventory(**item.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/update/{medicine_id}", response_model=InventoryResponse)
def update_quantity(medicine_id: int, item: InventoryUpdate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    medicine = db.query(Inventory).filter(Inventory.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    medicine.quantity = item.quantity
    db.commit()
    db.refresh(medicine)
    return medicine


@router.delete("/delete/{medicine_id}")
def delete_medicine(medicine_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    medicine = db.query(Inventory).filter(Inventory.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    db.delete(medicine)
    db.commit()
    return {"detail": "Medicine deleted successfully"}

@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    decoded = contents.decode("utf-8").splitlines()
    reader = csv.DictReader(decoded)

    added = 0
    for row in reader:
        medicine_name = row.get("medicine_name")
        quantity = int(row.get("quantity", 0))
        unit = row.get("unit", "units")

        if not medicine_name:
            continue

        existing = db.query(Inventory).filter(Inventory.medicine_name == medicine_name).first()
        if existing:
            existing.quantity += quantity  # Update quantity
        else:
            db.add(Inventory(medicine_name=medicine_name, quantity=quantity, unit=unit))
        added += 1

    db.commit()
    return {"message": f"{added} stock items processed successfully."}