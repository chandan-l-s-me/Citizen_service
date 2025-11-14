from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List
from app.database import get_db
from app.models.department import Department as DepartmentModel
from app.schemas.schemas import Department, DepartmentCreate

router = APIRouter(prefix="/departments", tags=["departments"])

@router.get("/", response_model=List[Department])
def get_departments(db: Session = Depends(get_db)):
    """Get all departments"""
    return db.query(DepartmentModel).all()

@router.get("/{department_id}")
def get_department(department_id: int, db: Session = Depends(get_db)):
    """Get a specific department and include aggregated stats via stored procedure.

    This endpoint calls `sp_get_department_stats` internally and returns the
    department record plus aggregated metrics so the backend demonstrates
    use of the project's stored procedures without exposing a separate API.
    """
    dept = db.query(DepartmentModel).filter(DepartmentModel.Department_ID == department_id).first()
    if dept is None:
        raise HTTPException(status_code=404, detail="Department not found")

    try:
        res = db.execute(text("CALL sp_get_department_stats(:id)"), {"id": department_id})
        stats = [dict(r._mapping) for r in res]
        stats = stats[0] if stats else None
    except Exception:
        stats = None

    data = {
        "department": {
            "Department_ID": dept.Department_ID,
            "Department_Name": dept.Department_Name,
            "Contact_Info": getattr(dept, 'Contact_Info', None),
        },
        "stats": stats
    }
    return data

@router.post("/", response_model=Department)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    """Create a new department"""
    max_id = db.query(func.max(DepartmentModel.Department_ID)).scalar()
    next_id = (max_id or 0) + 1
    
    db_dept = DepartmentModel(Department_ID=next_id, **department.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept
