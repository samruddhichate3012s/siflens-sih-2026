from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, engine, get_db
from database.models import SafetyReport
from ai.extractor import extract_safety_fields
from ai.retrieval import find_similar
from database.models import PrecursorPattern
from ai.precursor import discover_precursors
from database.models import Validation, ReportValidation
from ai.translate import detect_and_translate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIFLens API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReportAnalyzeRequest(BaseModel):
    report_text: str
    report_type: Optional[str] = None
    location: Optional[str] = None

class ReportValidationRequest(BaseModel):
    action: str  # validate / modify / reject
    validator: str
    comment: str = ""
    additional_info: str = ""


class ValidationRequest(BaseModel):
    status: str
    comment: str = ""
    validator: str    


def serialize_report(r):
    return {
        "id": r.id,
        "report_text": r.report_text,
        "translated_text": r.translated_text,
        "detected_language": r.detected_language,
        "detection_method": r.detection_method,
        "report_type": r.report_type,
        "location": r.location,
        "activity": r.activity,
        "hazard": r.hazard,
        "energy": r.energy,
        "exposure": r.exposure,
        "critical_control": r.critical_control,
        "barrier_failure": r.barrier_failure,
        "potential_consequence": r.potential_consequence,
        "sif_potential": r.sif_potential,
        "lifesaving_rule": r.lifesaving_rule,
        "evidence": r.evidence,
        "analysis_status": r.analysis_status,
        "validation_status": r.validation_status or "pending",
        "hse_additional_info": r.hse_additional_info,
        "revision_count": r.revision_count or 0,
        "timestamp": r.timestamp,
    }


def apply_extraction(report, result):
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


def analysis_text(report):
    """English text for Llama, plus any extra facts HSE supplied during review."""
    text = report.translated_text or report.report_text
    if report.hse_additional_info:
        text += "\n\nAdditional information from HSE review:\n" + report.hse_additional_info
    return text


def serialize_report_validation(v):
    return {
        "id": v.id,
        "report_id": v.report_id,
        "action": v.action,
        "validator": v.validator,
        "comment": v.comment,
        "additional_info": v.additional_info,
        "sif_potential": v.sif_potential,
        "lifesaving_rule": v.lifesaving_rule,
        "barrier_failure": v.barrier_failure,
        "revision": v.revision,
        "timestamp": v.timestamp,
    }


def distance_to_similarity(distance):
    # MiniLM vectors are unit length and IndexFlatL2 returns squared L2
    # distance, so cosine similarity = 1 - distance / 2.
    return max(0, min(100, round((1 - distance / 2) * 100)))


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
        report_type=payload.report_type,
        location=payload.location,

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

    return serialize_report(report)
@app.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(SafetyReport).order_by(SafetyReport.id.desc()).all()
    return [serialize_report(r) for r in reports]


@app.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if report is None:
        return {"error": f"No report found with id {report_id}"}

    return serialize_report(report)
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

    # The FAISS index holds English OSHA narratives, so search with the English text.
    query_text = report.translated_text or report.report_text
    matches = find_similar(query_text, keyword_source_text=keyword_source_text, top_k=top_k)
    for m in matches:
        m["similarity"] = distance_to_similarity(m["distance"])
    return {
        "report_id": report.id,
        "report_text": report.report_text,
        "query_text": query_text,
        "keywords_from": keyword_source_text,
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
    patterns = (
        db.query(PrecursorPattern)
        .filter(PrecursorPattern.occurrence_count >= 2)
        .order_by(PrecursorPattern.occurrence_count.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "lifesaving_rule": p.lifesaving_rule,
            "occurrence_count": p.occurrence_count,
            "sif_related_count": p.sif_related_count,
            "evidence_report_ids": p.evidence_report_ids,
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

    result = extract_safety_fields(analysis_text(report))
    apply_extraction(report, result)

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


REPORT_ACTIONS = {"validate": "validated", "modify": "modified", "reject": "rejected"}


@app.post("/reports/{report_id}/validate")
def validate_report(report_id: int, payload: ReportValidationRequest, db: Session = Depends(get_db)):
    """HSE decision on one report.

    validate -> report is stored as validated.
    modify   -> HSE adds information, the report is re-analysed with it and
                goes back to pending so HSE reviews the new result.
    reject   -> report is kept but excluded from evaluation (counts, precursors).
    Every decision is written to report_validations (validation documentation).
    """
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail=f"No report found with id {report_id}")

    action = REPORT_ACTIONS.get(payload.action.strip().lower())
    if action is None:
        raise HTTPException(status_code=400, detail="action must be one of: validate, modify, reject")
    if not payload.validator.strip():
        raise HTTPException(status_code=400, detail="validator name is required")
    if action == "modified" and not payload.additional_info.strip():
        raise HTTPException(status_code=400, detail="additional_info is required when modifying")

    # Record what the AI said at the time of this decision
    record = ReportValidation(
        report_id=report.id,
        action=action,
        validator=payload.validator.strip(),
        comment=payload.comment,
        additional_info=payload.additional_info or None,
        sif_potential=report.sif_potential,
        lifesaving_rule=report.lifesaving_rule,
        barrier_failure=report.barrier_failure,
        revision=report.revision_count or 0,
    )
    db.add(record)

    if action == "validated":
        report.validation_status = "validated"
    elif action == "rejected":
        report.validation_status = "rejected"
    else:
        info = payload.additional_info.strip()
        report.hse_additional_info = (
            f"{report.hse_additional_info}\n{info}" if report.hse_additional_info else info
        )
        result = extract_safety_fields(analysis_text(report))
        if "error" in result:
            print("REANALYSIS ERROR:", result["error"])
        apply_extraction(report, result)
        report.revision_count = (report.revision_count or 0) + 1
        report.validation_status = "pending"

    db.commit()
    db.refresh(report)
    db.refresh(record)

    return {"report": serialize_report(report), "validation": serialize_report_validation(record)}


@app.get("/reports/{report_id}/validations")
def get_report_validations(report_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(ReportValidation)
        .filter(ReportValidation.report_id == report_id)
        .order_by(ReportValidation.timestamp.desc())
        .all()
    )
    return [serialize_report_validation(v) for v in rows]


@app.get("/validations")
def list_report_validations(db: Session = Depends(get_db)):
    """Validation documentation across all reports, newest first."""
    rows = db.query(ReportValidation).order_by(ReportValidation.timestamp.desc()).all()
    return [serialize_report_validation(v) for v in rows]
