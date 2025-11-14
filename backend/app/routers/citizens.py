from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List
from app.database import get_db
from app.models.citizen import Citizen as CitizenModel
from app.schemas.schemas import Citizen, CitizenCreate

router = APIRouter(prefix="/citizens", tags=["citizens"])

@router.get("/", response_model=List[Citizen])
def get_citizens(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all citizens"""
    # Return newest-first so newly created citizens appear on the first page
    citizens = (
        db.query(CitizenModel)
        .order_by(CitizenModel.Citizen_ID.desc())
        .offset(skip)
        .all()
    )
    return citizens

@router.get("/{citizen_id}")
def get_citizen(citizen_id: int, db: Session = Depends(get_db)):
    """Get a specific citizen by ID and include stored-procedure summary (if available).

    This endpoint now uses the stored procedure `sp_get_citizen_summary` to fetch
    aggregated information about the citizen (total requests, grievances, total paid)
    and returns a combined JSON with the citizen record + summary. This keeps the
    functionality inside the backend and demonstrates use of the project's procedures.
    """
    citizen = db.query(CitizenModel).filter(CitizenModel.Citizen_ID == citizen_id).first()
    if citizen is None:
        raise HTTPException(status_code=404, detail="Citizen not found")

    # Try to call stored procedure for summary; if it fails, return citizen alone
    try:
        res = db.execute(text("CALL sp_get_citizen_summary(:id)"), {"id": citizen_id})
        rows = [dict(r._mapping) for r in res]
        summary = rows[0] if rows else None
    except Exception:
        summary = None

    data = {
        "citizen": {
            "Citizen_ID": citizen.Citizen_ID,
            "Name": citizen.Name,
            "Email": citizen.Email,
            "Phone": getattr(citizen, 'Phone', None),
            "Address": getattr(citizen, 'Address', None),
        },
        "summary": summary
    }
    return data

@router.post("/", response_model=Citizen)
def create_citizen(citizen: CitizenCreate, db: Session = Depends(get_db)):
    """Create a new citizen"""
    # Get the next ID
    max_id = db.query(func.max(CitizenModel.Citizen_ID)).scalar()
    next_id = (max_id or 0) + 1
    
    db_citizen = CitizenModel(Citizen_ID=next_id, **citizen.model_dump())
    db.add(db_citizen)
    db.commit()
    db.refresh(db_citizen)
    return db_citizen

@router.put("/{citizen_id}", response_model=Citizen)
def update_citizen(citizen_id: int, citizen: CitizenCreate, db: Session = Depends(get_db)):
    """Update a citizen"""
    db_citizen = db.query(CitizenModel).filter(CitizenModel.Citizen_ID == citizen_id).first()
    if db_citizen is None:
        raise HTTPException(status_code=404, detail="Citizen not found")
    
    for key, value in citizen.model_dump().items():
        setattr(db_citizen, key, value)
    
    db.commit()
    db.refresh(db_citizen)
    return db_citizen

@router.delete("/{citizen_id}")
def delete_citizen(citizen_id: int, db: Session = Depends(get_db)):
    """Delete a citizen"""
    db_citizen = db.query(CitizenModel).filter(CitizenModel.Citizen_ID == citizen_id).first()
    if db_citizen is None:
        raise HTTPException(status_code=404, detail="Citizen not found")
    # Delete the citizen (database triggers will cascade to related tables)
    db.delete(db_citizen)
    db.commit()
    return {"message": "Citizen deleted successfully (related records handled by DB triggers)"}
