from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from .database import Base


class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_text = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    analysis_status = Column(String, default="pending")

    activity = Column(String, nullable=True)
    hazard = Column(String, nullable=True)
    energy = Column(String, nullable=True)
    exposure = Column(String, nullable=True)
    critical_control = Column(String, nullable=True)
    barrier_failure = Column(String, nullable=True)
    potential_consequence = Column(String, nullable=True)
    sif_potential = Column(String, nullable=True)
    lifesaving_rule = Column(String, nullable=True)
    evidence = Column(String, nullable=True)