from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from database.database import Base, engine, get_db
from database.models import SafetyReport

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIFLens API")


@app.get("/")
def read_root():
    return {"message": "SIFLens API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    count = db.query(SafetyReport).count()
    return {"database": "connected", "safety_reports_count": count}