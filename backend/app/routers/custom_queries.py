from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Dict, Any
from app.database import get_db

router = APIRouter(prefix="/custom-queries", tags=["custom-queries"])

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    success: bool
    message: str
    columns: List[str] = []
    data: List[Dict[str, Any]] = []
    rows_affected: int = 0

@router.post("/execute", response_model=QueryResponse)
def execute_custom_query(query_request: QueryRequest, db: Session = Depends(get_db)):
    """Execute a custom SQL query"""
    try:
        query = query_request.query.strip()
        
        # Security check - prevent multiple statements
        if ';' in query[:-1]:  # Allow semicolon only at the end
            raise HTTPException(
                status_code=400, 
                detail="Multiple statements not allowed. Execute one query at a time."
            )
        
        # Check if it's a SELECT query
        is_select = query.upper().startswith('SELECT')
        
        # Execute the query
        result = db.execute(text(query))
        
        if is_select:
            # For SELECT queries, fetch all results
            rows = result.fetchall()
            columns = list(result.keys()) if rows else []
            
            # Convert rows to list of dictionaries
            data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert non-serializable types
                    if hasattr(value, 'isoformat'):  # datetime/date objects
                        value = value.isoformat()
                    elif isinstance(value, bytes):
                        value = value.decode('utf-8', errors='ignore')
                    row_dict[col] = value
                data.append(row_dict)
            
            db.commit()
            
            return QueryResponse(
                success=True,
                message=f"Query executed successfully. {len(rows)} rows returned.",
                columns=columns,
                data=data,
                rows_affected=len(rows)
            )
        else:
            # For INSERT, UPDATE, DELETE queries
            db.commit()
            rows_affected = result.rowcount
            
            return QueryResponse(
                success=True,
                message=f"Query executed successfully. {rows_affected} rows affected.",
                columns=[],
                data=[],
                rows_affected=rows_affected
            )
            
    except Exception as e:
        db.rollback()
        error_message = str(e)
        
        # Clean up SQLAlchemy error messages
        if "'" in error_message:
            error_message = error_message.split("'")[1] if len(error_message.split("'")) > 1 else error_message
        
        return QueryResponse(
            success=False,
            message=f"Query execution failed: {error_message}",
            columns=[],
            data=[],
            rows_affected=0
        )

@router.get("/sample-queries")
def get_sample_queries():
    """Get sample SQL queries for reference"""
    return {
        "queries": [
            {
                "name": "View All Citizens",
                "query": "SELECT * FROM Citizen LIMIT 10;"
            },
            {
                "name": "Count Services by Department",
                "query": "SELECT d.Department_Name, COUNT(s.Service_ID) as Total_Services\nFROM Department d\nLEFT JOIN Service s ON d.Department_ID = s.Department_ID\nGROUP BY d.Department_Name;"
            },
            {
                "name": "Pending Service Requests",
                "query": "SELECT sr.Request_ID, c.Name as Citizen_Name, s.Service_Name, sr.Request_Date\nFROM Service_Request sr\nJOIN Citizen c ON sr.Citizen_ID = c.Citizen_ID\nJOIN Service s ON sr.Service_ID = s.Service_ID\nWHERE sr.Status = 'Pending';"
            },
            {
                "name": "Grievances by Status",
                "query": "SELECT Status, COUNT(*) as Count\nFROM Grievance\nGROUP BY Status;"
            },
            {
                "name": "Recent Payments",
                "query": "SELECT Payment_ID, Amount, Payment_Date, Method\nFROM Payment\nORDER BY Payment_Date DESC\nLIMIT 10;"
            }
        ]
    }
