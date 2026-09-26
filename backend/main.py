from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, engine, get_db
from database.models import SafetyReport
from ai.extractor import extract_safety_fields
from ai.retrieval import find_similar
from database.models import PrecursorPattern
from ai.precursor import discover_precursors
from database.models import Validation
from ai.translate import detect_and_translate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIFLens API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReportAnalyzeRequest(BaseModel):
    report_text: str

class ValidationRequest(BaseModel):
    status: str
    comment: str = ""
    validator: str    


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
    translation = detect_and_translate(payload.report_text)
    english_text = translation.get("english_translation") or payload.report_text
    result = extract_safety_fields(english_text)
    if "error" in result:
        print("EXTRACTION ERROR:", 
    result["error"], 
    str(result.get("raw_output", ""))[:300])
    report = SafetyReport(
        report_text=payload.report_text,
        translated_text=english_text,
        detected_language=translation.get("detected_language"),
        detection_method=translation.get("detection_method"),

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
        "translated_text": report.translated_text,
        "detected_language": report.detected_language,
        "detection_method": report.detection_method,
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
@app.post("/precursors/discover")
def run_precursor_discovery(db: Session = Depends(get_db)):
    patterns = discover_precursors(db)
    return {
        "patterns_found_or_updated": len(patterns),
        "patterns": [
            {
                "id": p.id,
                "name": p.name,
                "lifesaving_rule": p.lifesaving_rule,
                "occurrence_count": p.occurrence_count,
                "sif_related_count": p.sif_related_count,
                "validation_status": p.validation_status,
            }
            for p in patterns
        ],
    }


@app.get("/precursors")
def list_precursors(db: Session = Depends(get_db)):
    patterns = db.query(PrecursorPattern).order_by(PrecursorPattern.occurrence_count.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "lifesaving_rule": p.lifesaving_rule,
            "occurrence_count": p.occurrence_count,
            "sif_related_count": p.sif_related_count,
            "validation_status": p.validation_status,
            "last_updated": p.last_updated,
        }
        for p in patterns
    ]


@app.get("/precursors/{precursor_id}")
def get_precursor(precursor_id: int, db: Session = Depends(get_db)):
    p = db.query(PrecursorPattern).filter(PrecursorPattern.id == precursor_id).first()
    if p is None:
        return {"error": f"No precursor pattern found with id {precursor_id}"}

    return {
        "id": p.id,
        "name": p.name,
        "lifesaving_rule": p.lifesaving_rule,
        "occurrence_count": p.occurrence_count,
        "sif_related_count": p.sif_related_count,
        "evidence_report_ids": p.evidence_report_ids,
        "validation_status": p.validation_status,
        "last_updated": p.last_updated,
    }
@app.post("/reports/{report_id}/reanalyze")
def reanalyze_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if report is None:
        return {"error": f"No report found with id {report_id}"}

    result = extract_safety_fields(report.translated_text or report.report_text)

    report.activity = result.get("activity")
    report.hazard = result.get("hazard")
    report.energy = result.get("energy")
    report.exposure = result.get("exposure")
    report.critical_control = result.get("critical_control")
    report.barrier_failure = result.get("barrier_failure")
    report.potential_consequence = result.get("potential_consequence")
    report.sif_potential = result.get("sif_potential")
    report.lifesaving_rule = result.get("lifesaving_rule")
    report.evidence = result.get("evidence")
    report.analysis_status = "analyzed"

    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "lifesaving_rule": report.lifesaving_rule,
        "sif_potential": report.sif_potential,
        "analysis_status": report.analysis_status,
    }
VALID_STATUSES = {"confirmed", "modified", "rejected"}


@app.post("/precursors/{precursor_id}/validate")
def validate_precursor(precursor_id: int, payload: ValidationRequest, db: Session = Depends(get_db)):
    pattern = db.query(PrecursorPattern).filter(PrecursorPattern.id == precursor_id).first()
    if pattern is None:
        return {"error": f"No precursor pattern found with id {precursor_id}"}

    status = payload.status.strip().lower()
    if status not in VALID_STATUSES:
        return {"error": f"Invalid status '{payload.status}'. Must be one of: {', '.join(VALID_STATUSES)}"}

    validation = Validation(
        precursor_id=precursor_id,
        status=status,
        comment=payload.comment,
        validator=payload.validator,
    )
    db.add(validation)

    pattern.validation_status = status

    db.commit()
    db.refresh(validation)
    db.refresh(pattern)

    return {
        "validation_id": validation.id,
        "precursor_id": pattern.id,
        "new_validation_status": pattern.validation_status,
        "comment": validation.comment,
        "validator": validation.validator,
        "timestamp": validation.timestamp,
    }


@app.get("/precursors/{precursor_id}/validations")
def get_precursor_validations(precursor_id: int, db: Session = Depends(get_db)):
    validations = (
        db.query(Validation)
        .filter(Validation.precursor_id == precursor_id)
        .order_by(Validation.timestamp.desc())
        .all()
    )
    return [
        {
            "validation_id": v.id,
            "status": v.status,
            "comment": v.comment,
            "validator": v.validator,
            "timestamp": v.timestamp,
        }
        for v in validations
    ]