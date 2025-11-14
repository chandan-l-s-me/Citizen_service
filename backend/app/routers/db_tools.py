from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db

router = APIRouter(prefix="/db", tags=["db-tools"])


@router.get("/procedures/citizen_summary")
def call_sp_get_citizen_summary(citizen_id: int, db: Session = Depends(get_db)):
    """Call stored procedure sp_get_citizen_summary(IN p_citizen_id INT)"""
    try:
        res = db.execute(text("CALL sp_get_citizen_summary(:id)"), {"id": citizen_id})
        rows = res.mappings().all()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/procedures/department_stats")
def call_sp_get_department_stats(department_id: int, db: Session = Depends(get_db)):
    try:
        res = db.execute(text("CALL sp_get_department_stats(:id)"), {"id": department_id})
        return res.mappings().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/procedures/mark_grievance_resolved")
def call_sp_mark_grievance_resolved(grievance_id: int, resolved_by: str, db: Session = Depends(get_db)):
    try:
        db.execute(text("CALL sp_mark_grievance_resolved(:gid, :by)"), {"gid": grievance_id, "by": resolved_by})
        db.commit()
        return {"message": "Grievance marked resolved"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Functions
@router.get("/functions/total_paid")
def fn_total_paid_by_citizen(citizen_id: int, db: Session = Depends(get_db)):
    try:
        res = db.execute(text("SELECT fn_total_paid_by_citizen(:id) AS total"), {"id": citizen_id})
        row = res.mappings().first()
        return row or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/functions/count_requests")
def fn_count_requests_by_citizen(citizen_id: int, db: Session = Depends(get_db)):
    try:
        res = db.execute(text("SELECT fn_count_requests_by_citizen(:id) AS cnt"), {"id": citizen_id})
        return res.mappings().first() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/functions/avg_payment")
def fn_avg_payment_by_service(service_id: int, db: Session = Depends(get_db)):
    try:
        res = db.execute(text("SELECT fn_avg_payment_by_service(:id) AS avg_amt"), {"id": service_id})
        return res.mappings().first() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/functions/open_grievances")
def fn_open_grievances_by_department(department_id: int, db: Session = Depends(get_db)):
    try:
        res = db.execute(text("SELECT fn_open_grievances_by_department(:id) AS open_cnt"), {"id": department_id})
        return res.mappings().first() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/functions/is_citizen_active")
def fn_is_citizen_active(citizen_id: int, db: Session = Depends(get_db)):
    try:
        res = db.execute(text("SELECT fn_is_citizen_active(:id) AS active"), {"id": citizen_id})
        return res.mappings().first() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Views: allow selecting from predefined views only
ALLOWED_VIEWS = {
    "view_total_paid_per_citizen": "SELECT * FROM view_total_paid_per_citizen",
    "view_request_counts_per_service": "SELECT * FROM view_request_counts_per_service",
    "view_open_grievances_per_department": "SELECT * FROM view_open_grievances_per_department",
}


@router.get("/views/{view_name}")
def select_view(view_name: str, db: Session = Depends(get_db)):
    stmt = ALLOWED_VIEWS.get(view_name)
    if not stmt:
        raise HTTPException(status_code=404, detail="View not allowed")
    try:
        res = db.execute(text(stmt))
        return res.mappings().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
