import csv

RAW_FILE = "raw/osha_severe_injury_raw.csv"

with open(RAW_FILE, newline="", encoding="utf-8", errors="replace") as f:
    reader = csv.reader(f)
    header = next(reader)
    first_row = next(reader)

print("Number of columns:", len(header))
print("\nColumn names:")
for col in header:
    print(" -", col)

print("\nFirst row as example:")
for col_name, value in zip(header, first_row):
    print(f" - {col_name}: {value}")