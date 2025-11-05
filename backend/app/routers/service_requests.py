from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.service_request import ServiceRequest as ServiceRequestModel
from app.schemas.schemas import ServiceRequest, ServiceRequestCreate

router = APIRouter(prefix="/service-requests", tags=["service-requests"])

@router.get("/", response_model=List[ServiceRequest])
def get_service_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all service requests"""
    return db.query(ServiceRequestModel).offset(skip).limit(limit).all()

@router.get("/{request_id}", response_model=ServiceRequest)
def get_service_request(request_id: int, db: Session = Depends(get_db)):
    """Get a specific service request"""
    request = db.query(ServiceRequestModel).filter(ServiceRequestModel.Request_ID == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Service request not found")
    return request

@router.post("/", response_model=ServiceRequest)
def create_service_request(request: ServiceRequestCreate, db: Session = Depends(get_db)):
    """Create a new service request"""
    max_id = db.query(func.max(ServiceRequestModel.Request_ID)).scalar()
    next_id = (max_id or 0) + 1
    
    db_request = ServiceRequestModel(Request_ID=next_id, **request.model_dump())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.put("/{request_id}", response_model=ServiceRequest)
def update_service_request(request_id: int, request: ServiceRequestCreate, db: Session = Depends(get_db)):
    """Update a service request"""
    db_request = db.query(ServiceRequestModel).filter(ServiceRequestModel.Request_ID == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    for key, value in request.model_dump().items():
        setattr(db_request, key, value)
    
    db.commit()
    db.refresh(db_request)
    return db_request

@router.patch("/{request_id}/status")
def update_request_status(request_id: int, status: str, db: Session = Depends(get_db)):
    """Update only the status of a service request"""
    db_request = db.query(ServiceRequestModel).filter(ServiceRequestModel.Request_ID == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Validate status
    valid_statuses = ['Pending', 'Processing', 'Completed', 'Rejected']
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    db_request.Status = status
    db.commit()
    db.refresh(db_request)
    return db_request

@router.delete("/{request_id}")
def delete_service_request(request_id: int, db: Session = Depends(get_db)):
    """Delete a service request"""
    db_request = db.query(ServiceRequestModel).filter(ServiceRequestModel.Request_ID == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    db.delete(db_request)
    db.commit()
    return {"message": "Service request deleted successfully"}
