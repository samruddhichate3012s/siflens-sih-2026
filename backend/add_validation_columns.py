from sqlalchemy import text
from database.database import Base, engine
from database import models  # noqa: F401  (registers report_validations table)

# New columns on existing safety_reports table
columns = {
    "validation_status": "VARCHAR DEFAULT 'pending'",
    "hse_additional_info": "VARCHAR",
    "revision_count": "INTEGER DEFAULT 0",
}

with engine.begin() as conn:
    for col, col_type in columns.items():
        try:
            conn.execute(text(f"ALTER TABLE safety_reports ADD COLUMN {col} {col_type}"))
            print("added", col)
        except Exception as e:
            print("skipped", col, "-", str(e).splitlines()[0])
    conn.execute(text("UPDATE safety_reports SET validation_status = 'pending' WHERE validation_status IS NULL"))
    conn.execute(text("UPDATE safety_reports SET revision_count = 0 WHERE revision_count IS NULL"))

# New report_validations table (validation documentation)
Base.metadata.create_all(bind=engine)
print("report_validations table ready")
