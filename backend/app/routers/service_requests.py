from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app.models.service_request import ServiceRequest as ServiceRequestModel
from app.models.payment import Payment as PaymentModel
from app.models.citizen import Citizen as CitizenModel
from app.models.service import Service as ServiceModel
from app.schemas.schemas import ServiceRequest, ServiceRequestCreate

router = APIRouter(prefix="/service-requests", tags=["service-requests"])

@router.get("/", response_model=List[ServiceRequest])
def get_service_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all service requests"""
    # Return newest-first so recent requests appear on first page
    return (
        db.query(ServiceRequestModel)
        .order_by(ServiceRequestModel.Request_ID.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

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
    # Validate foreign keys before insert to provide clearer errors
    payload = request.model_dump()

    # Citizen_ID may be provided or None
    citizen_id = payload.get("Citizen_ID")
    if citizen_id is not None:
        citizen = db.query(CitizenModel).filter(CitizenModel.Citizen_ID == citizen_id).first()
        if citizen is None:
            raise HTTPException(status_code=400, detail=f"Citizen with ID {citizen_id} does not exist")

    # Service must exist
    service_id = payload.get("Service_ID")
    service = db.query(ServiceModel).filter(ServiceModel.Service_ID == service_id).first()
    if service is None:
        raise HTTPException(status_code=400, detail=f"Service with ID {service_id} does not exist")

    # If Payment_ID provided, ensure it exists
    payment_id = payload.get("Payment_ID")
    if payment_id is not None:
        payment = db.query(PaymentModel).filter(PaymentModel.Payment_ID == payment_id).first()
        if payment is None:
            raise HTTPException(status_code=400, detail=f"Payment with ID {payment_id} does not exist")

    db_request = ServiceRequestModel(Request_ID=next_id, **payload)
    db.add(db_request)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        # Convert DB integrity error to a 400 with helpful message
        raise HTTPException(status_code=400, detail=str(e.orig))
    db.refresh(db_request)
    return db_request

@router.put("/{request_id}", response_model=ServiceRequest)
def update_service_request(request_id: int, request: ServiceRequestCreate, db: Session = Depends(get_db)):
    """Update a service request"""
    db_request = db.query(ServiceRequestModel).filter(ServiceRequestModel.Request_ID == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    payload = request.model_dump()

    # Validate foreign keys similar to create
    citizen_id = payload.get("Citizen_ID")
    if citizen_id is not None:
        citizen = db.query(CitizenModel).filter(CitizenModel.Citizen_ID == citizen_id).first()
        if citizen is None:
            raise HTTPException(status_code=400, detail=f"Citizen with ID {citizen_id} does not exist")

    service_id = payload.get("Service_ID")
    service = db.query(ServiceModel).filter(ServiceModel.Service_ID == service_id).first()
    if service is None:
        raise HTTPException(status_code=400, detail=f"Service with ID {service_id} does not exist")

    payment_id = payload.get("Payment_ID")
    if payment_id is not None:
        payment = db.query(PaymentModel).filter(PaymentModel.Payment_ID == payment_id).first()
        if payment is None:
            raise HTTPException(status_code=400, detail=f"Payment with ID {payment_id} does not exist")

    for key, value in payload.items():
        setattr(db_request, key, value)

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e.orig))
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

    # Delete the service request (DB trigger will archive/delete payment)
    db.delete(db_request)
    db.commit()
    return {"message": "Service request deleted successfully (related records handled by DB triggers)"}
