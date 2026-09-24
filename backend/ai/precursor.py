from collections import defaultdict

from database.models import SafetyReport, PrecursorPattern

MIN_OCCURRENCES_FOR_PATTERN = 2


def discover_precursors(db):
    reports = (
        db.query(SafetyReport)
        .filter(SafetyReport.analysis_status == "analyzed")
        .filter(SafetyReport.lifesaving_rule.isnot(None))
        .all()
    )

    groups = defaultdict(list)
    for report in reports:
        rule = report.lifesaving_rule
        if not rule or rule == "Unknown":
            continue
        groups[rule].append(report)

    patterns_updated = []

    for rule, group_reports in groups.items():
        occurrence_count = len(group_reports)

        if occurrence_count < MIN_OCCURRENCES_FOR_PATTERN:
            continue

        sif_related_count = sum(
            1 for r in group_reports if r.sif_potential == "High"
        )
        evidence_ids = ",".join(str(r.id) for r in group_reports)

        existing = (
            db.query(PrecursorPattern)
            .filter(PrecursorPattern.lifesaving_rule == rule)
            .first()
        )

        if existing:
            existing.occurrence_count = occurrence_count
            existing.sif_related_count = sif_related_count
            existing.evidence_report_ids = evidence_ids
            pattern = existing
        else:
            pattern = PrecursorPattern(
                name=f"Recurring {rule} Failures",
                lifesaving_rule=rule,
                occurrence_count=occurrence_count,
                sif_related_count=sif_related_count,
                evidence_report_ids=evidence_ids,
                validation_status="pending",
            )
            db.add(pattern)

        patterns_updated.append(pattern)

    db.commit()

    for p in patterns_updated:
        db.refresh(p)

    return patterns_updated