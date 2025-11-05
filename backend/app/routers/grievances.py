from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.grievance import Grievance as GrievanceModel
from app.schemas.schemas import Grievance, GrievanceCreate

router = APIRouter(prefix="/grievances", tags=["grievances"])

@router.get("/", response_model=List[Grievance])
def get_grievances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all grievances"""
    return db.query(GrievanceModel).offset(skip).limit(limit).all()

@router.get("/{grievance_id}", response_model=Grievance)
def get_grievance(grievance_id: int, db: Session = Depends(get_db)):
    """Get a specific grievance"""
    grievance = db.query(GrievanceModel).filter(GrievanceModel.Grievance_ID == grievance_id).first()
    if grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    return grievance

@router.post("/", response_model=Grievance)
def create_grievance(grievance: GrievanceCreate, db: Session = Depends(get_db)):
    """Create a new grievance"""
    max_id = db.query(func.max(GrievanceModel.Grievance_ID)).scalar()
    next_id = (max_id or 0) + 1
    
    db_grievance = GrievanceModel(Grievance_ID=next_id, **grievance.model_dump())
    db.add(db_grievance)
    db.commit()
    db.refresh(db_grievance)
    return db_grievance

@router.put("/{grievance_id}", response_model=Grievance)
def update_grievance(grievance_id: int, grievance: GrievanceCreate, db: Session = Depends(get_db)):
    """Update a grievance"""
    db_grievance = db.query(GrievanceModel).filter(GrievanceModel.Grievance_ID == grievance_id).first()
    if db_grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    for key, value in grievance.model_dump().items():
        setattr(db_grievance, key, value)
    
    db.commit()
    db.refresh(db_grievance)
    return db_grievance

@router.patch("/{grievance_id}/status")
def update_grievance_status(grievance_id: int, status: str, db: Session = Depends(get_db)):
    """Update only the status of a grievance"""
    db_grievance = db.query(GrievanceModel).filter(GrievanceModel.Grievance_ID == grievance_id).first()
    if db_grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    # Validate status
    valid_statuses = ['Submitted', 'Under Review', 'Resolved', 'Closed']
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    db_grievance.Status = status
    db.commit()
    db.refresh(db_grievance)
    return db_grievance

@router.delete("/{grievance_id}")
def delete_grievance(grievance_id: int, db: Session = Depends(get_db)):
    """Delete a grievance"""
    db_grievance = db.query(GrievanceModel).filter(GrievanceModel.Grievance_ID == grievance_id).first()
    if db_grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    db.delete(db_grievance)
    db.commit()
    return {"message": "Grievance deleted successfully"}
