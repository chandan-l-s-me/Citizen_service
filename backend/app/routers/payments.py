from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.payment import Payment as PaymentModel
from app.schemas.schemas import Payment, PaymentCreate

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/", response_model=List[Payment])
def get_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(PaymentModel).offset(skip).limit(limit).all()


@router.get("/{payment_id}", response_model=Payment)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(PaymentModel).filter(PaymentModel.Payment_ID == payment_id).first()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=Payment)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    max_id = db.query(func.max(PaymentModel.Payment_ID)).scalar()
    next_id = (max_id or 0) + 1

    db_payment = PaymentModel(Payment_ID=next_id, **payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment
