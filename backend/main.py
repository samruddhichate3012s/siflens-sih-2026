from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.database import Base, engine, get_db
from database.models import SafetyReport
from ai.extractor import extract_safety_fields
from ai.retrieval import find_similar

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIFLens API")


class ReportAnalyzeRequest(BaseModel):
    report_text: str


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


@app.post("/reports/analyze")
def analyze_report(payload: ReportAnalyzeRequest, db: Session = Depends(get_db)):
    result = extract_safety_fields(payload.report_text)

    report = SafetyReport(
        report_text=payload.report_text,
        activity=result.get("activity"),
        hazard=result.get("hazard"),
        energy=result.get("energy"),
        exposure=result.get("exposure"),
        critical_control=result.get("critical_control"),
        barrier_failure=result.get("barrier_failure"),
        potential_consequence=result.get("potential_consequence"),
        sif_potential=result.get("sif_potential"),
        lifesaving_rule=result.get("lifesaving_rule"),
        evidence=result.get("evidence"),
        analysis_status="analyzed",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "report_text": report.report_text,
        "activity": report.activity,
        "hazard": report.hazard,
        "energy": report.energy,
        "exposure": report.exposure,
        "critical_control": report.critical_control,
        "barrier_failure": report.barrier_failure,
        "potential_consequence": report.potential_consequence,
        "sif_potential": report.sif_potential,
        "lifesaving_rule": report.lifesaving_rule,
        "evidence": report.evidence,
        "analysis_status": report.analysis_status,
    }
@app.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(SafetyReport).order_by(SafetyReport.id.desc()).all()
    return [
        {
            "id": r.id,
            "report_text": r.report_text,
            "activity": r.activity,
            "hazard": r.hazard,
            "sif_potential": r.sif_potential,
            "lifesaving_rule": r.lifesaving_rule,
            "analysis_status": r.analysis_status,
            "timestamp": r.timestamp,
        }
        for r in reports
    ]


@app.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if report is None:
        return {"error": f"No report found with id {report_id}"}

    return {
        "id": report.id,
        "report_text": report.report_text,
        "activity": report.activity,
        "hazard": report.hazard,
        "energy": report.energy,
        "exposure": report.exposure,
        "critical_control": report.critical_control,
        "barrier_failure": report.barrier_failure,
        "potential_consequence": report.potential_consequence,
        "sif_potential": report.sif_potential,
        "lifesaving_rule": report.lifesaving_rule,
        "evidence": report.evidence,
        "analysis_status": report.analysis_status,
        "timestamp": report.timestamp,
    }
@app.get("/reports/{report_id}/similar")
def get_similar_reports(report_id: int, top_k: int = 5, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if report is None:
        return {"error": f"No report found with id {report_id}"}

    keyword_source_text = " ".join(
        str(field) for field in [
            report.hazard,
            report.energy,
            report.critical_control,
            report.barrier_failure,
        ]
        if field
    )

    matches = find_similar(report.report_text, keyword_source_text=keyword_source_text, top_k=top_k)
    return {
        "report_id": report.id,
        "report_text": report.report_text,
        "similar_reports": matches,
    }