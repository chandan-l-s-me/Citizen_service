from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import citizens, departments, services, dashboard, service_requests, grievances, custom_queries
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Citizen Service Management System",
    description="API for managing citizen services, requests, and grievances",
    version="1.0.0"
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(citizens.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(service_requests.router, prefix="/api")
app.include_router(grievances.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(custom_queries.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Citizen Service Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
