from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Grievance(Base):
    __tablename__ = "Grievance"

    Grievance_ID = Column(Integer, primary_key=True, index=True)
    Citizen_ID = Column(Integer, ForeignKey("Citizen.Citizen_ID"))
    Department_ID = Column(Integer, ForeignKey("Department.Department_ID"))
    Description = Column(Text)
    Status = Column(String(50))
    Date = Column(Date)

    # Relationships
    citizen = relationship("Citizen", back_populates="grievances")
    department = relationship("Department", back_populates="grievances")
