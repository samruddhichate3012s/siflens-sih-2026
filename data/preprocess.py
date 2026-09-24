import pandas as pd

RAW_FILE = "raw/osha_severe_injury_raw.csv"
OUTPUT_FILE = "processed/osha_reports_clean.csv"

COLUMNS_TO_KEEP = [
    "ID",
    "EventDate",
    "Employer",
    "City",
    "State",
    "Primary NAICS",
    "Hospitalized",
    "Amputation",
    "Loss of Eye",
    "Final Narrative",
    "NatureTitle",
    "Part of Body Title",
    "EventTitle",
    "SourceTitle",
]

RENAME_MAP = {
    "ID": "report_id",
    "EventDate": "event_date",
    "Employer": "employer",
    "City": "city",
    "State": "state",
    "Primary NAICS": "naics_code",
    "Hospitalized": "hospitalized",
    "Amputation": "amputation",
    "Loss of Eye": "loss_of_eye",
    "Final Narrative": "narrative",
    "NatureTitle": "nature",
    "Part of Body Title": "body_part",
    "EventTitle": "event_type",
    "SourceTitle": "source_type",
}

CHUNK_SIZE = 20000

first_chunk = True
total_rows_in = 0
total_rows_kept = 0

reader = pd.read_csv(
    RAW_FILE,
    usecols=COLUMNS_TO_KEEP,
    chunksize=CHUNK_SIZE,
    low_memory=False,
)

for chunk in reader:
    total_rows_in += len(chunk)

    chunk = chunk.rename(columns=RENAME_MAP)

    chunk["narrative"] = chunk["narrative"].astype(str).str.strip()
    chunk = chunk[chunk["narrative"].notna()]
    chunk = chunk[chunk["narrative"] != ""]
    chunk = chunk[chunk["narrative"].str.lower() != "nan"]

    chunk["data_source"] = "OSHA_SIR_public"

    total_rows_kept += len(chunk)

    chunk.to_csv(
        OUTPUT_FILE,
        mode="w" if first_chunk else "a",
        header=first_chunk,
        index=False,
    )
    first_chunk = False

print("Done.")
print("Total rows read:", total_rows_in)
print("Total rows kept (with narrative text):", total_rows_kept)
print("Saved to:", OUTPUT_FILE)