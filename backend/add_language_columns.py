from sqlalchemy import text
from database.database import engine

with engine.begin() as conn:
    for col in ["translated_text", "detected_language", "detection_method"]:
        try:
            conn.execute(text(f"ALTER TABLE safety_reports ADD COLUMN {col} VARCHAR"))
            print("added", col)
        except Exception as e:
            print("skipped", col, "-", e)