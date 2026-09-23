from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from .database import Base


class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_text = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    analysis_status = Column(String, default="pending")