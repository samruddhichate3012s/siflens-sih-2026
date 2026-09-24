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

class PrecursorPattern(Base):
    __tablename__ = "precursor_patterns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lifesaving_rule = Column(String, nullable=False)
    occurrence_count = Column(Integer, default=0)
    sif_related_count = Column(Integer, default=0)
    evidence_report_ids = Column(String, default="")
    validation_status = Column(String, default="pending")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Validation(Base):
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True, index=True)
    precursor_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    comment = Column(String, nullable=True)
    validator = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)