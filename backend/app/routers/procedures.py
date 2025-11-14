from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/procedures", tags=["procedures"])


@router.get("/citizen-summary/{citizen_id}")
def citizen_summary(citizen_id: int, db: Session = Depends(get_db)):
    """Call stored procedure sp_get_citizen_summary and return single row"""
    try:
        result = db.execute(text("CALL sp_get_citizen_summary(:id)"), {"id": citizen_id})
        rows = [dict(r._mapping) for r in result]
        if not rows:
            raise HTTPException(status_code=404, detail="Citizen summary not found")
        return rows[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/department-stats/{department_id}")
def department_stats(department_id: int, db: Session = Depends(get_db)):
    """Call stored procedure sp_get_department_stats and return result set"""
    try:
        result = db.execute(text("CALL sp_get_department_stats(:id)"), {"id": department_id})
        rows = [dict(r._mapping) for r in result]
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
