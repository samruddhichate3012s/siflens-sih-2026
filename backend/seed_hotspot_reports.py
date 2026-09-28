import requests
import time

BASE_URL = "http://127.0.0.1:8000"

# Reports from sites that repeat, so the dashboard's SIF Hotspots panel can rank
# sites and activities by SIF-precursor density. Sent through the real
# /reports/analyze pipeline (translation + Llama extraction), like the other seed scripts.
# Location format "Site - Spot": the dashboard groups by the part before " - ".
HOTSPOT_REPORTS = [
    {
        "report_type": "Near Miss",
        "location": "Drilling Rig OIL-12 - Rig Floor",
        "report_text": "During tripping, the derrickman worked on the monkey board with his lanyard unclipped. A pipe stand swung and he held the handrail to avoid falling.",
    },
    {
        "report_type": "Unsafe Act",
        "location": "Drilling Rig OIL-12 - Pipe Deck",
        "report_text": "A roustabout stood under a drill collar being lifted by the rig crane. The tag line was not used and the load swung over his head.",
    },
    {
        "report_type": "Unsafe Condition",
        "location": "Drilling Rig OIL-12 - Mud Pump Area",
        "report_text": "मड पंप की मरम्मत से पहले उसका पावर आइसोलेशन और लॉक नहीं किया गया था। फिटर ने कवर खोल दिया था।",
    },
    {
        "report_type": "Near Miss",
        "location": "Tank Farm - Tank T-110",
        "report_text": "A helper opened the manhole of tank T-110 and leaned inside to look for sludge without a gas test. He felt dizzy and stepped back.",
    },
    {
        "report_type": "Unsafe Act",
        "location": "Tank Farm - Dyke Area",
        "report_text": "टँक फार्मच्या डाइकजवळ हॉट वर्क परमिटशिवाय ग्राइंडिंग सुरू होते. जवळच तेलाची गळती होती.",
    },
    {
        "report_type": "Unsafe Condition",
        "location": "Gas Compressor Station 2 - Compressor K-202",
        "report_text": "The high-pressure trip on compressor K-202 was found in bypass mode with no permit or management approval recorded.",
    },
    {
        "report_type": "Near Miss",
        "location": "Gas Compressor Station 2 - Suction Header",
        "report_text": "A technician loosened a flange on the suction header while standing in front of it. The line still had pressure and gas escaped towards his face.",
    },
    {
        "report_type": "Unsafe Condition",
        "location": "Admin Block - Canteen",
        "report_text": "The canteen floor was wet after mopping and no warning sign was placed. Nobody slipped.",
    },
    {
        "report_type": "Unsafe Condition",
        "location": "Admin Block - Store Room",
        "report_text": "Cartons were stacked in front of the store room fire extinguisher, blocking access to it.",
    },
]


def seed_reports():
    existing = requests.get(f"{BASE_URL}/reports", timeout=30).json()
    existing_texts = {r.get("report_text") for r in existing}
    print(f"Reports in database before seeding: {len(existing)}")

    to_add = [r for r in HOTSPOT_REPORTS if r["report_text"] not in existing_texts]
    skipped = len(HOTSPOT_REPORTS) - len(to_add)
    if skipped:
        print(f"Skipping {skipped} report(s) already in the database.")

    print(f"Analyzing {len(to_add)} reports. Each Llama call takes about 30-90s.\n")
    created_ids = []

    for i, report in enumerate(to_add, start=1):
        print(f"[{i}/{len(to_add)}] {report['report_type']} @ {report['location']}")
        start = time.time()
        try:
            response = requests.post(f"{BASE_URL}/reports/analyze", json=report, timeout=600)
            response.raise_for_status()
            data = response.json()
            print(f"    -> id={data.get('id')}, language={data.get('detected_language')}, "
                  f"lifesaving_rule={data.get('lifesaving_rule')}, "
                  f"sif_potential={data.get('sif_potential')} ({time.time() - start:.1f}s)")
            created_ids.append(data.get("id"))
        except requests.exceptions.RequestException as e:
            print(f"    -> FAILED: {e}")

    print(f"\nAdded {len(created_ids)} reports: {created_ids}")

    print("\nRunning precursor discovery...")
    try:
        result = requests.post(f"{BASE_URL}/precursors/discover", timeout=60).json()
        print(f"Patterns found/updated: {result.get('patterns_found_or_updated')}")
    except requests.exceptions.RequestException as e:
        print(f"Discovery failed: {e}")


if __name__ == "__main__":
    seed_reports()
