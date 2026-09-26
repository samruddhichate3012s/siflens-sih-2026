import requests
import time

BASE_URL = "http://127.0.0.1:8000"

# Field reports with report type and location, sent through the real
# /reports/analyze pipeline (translation + Llama extraction).
FIELD_REPORTS = [
    {
        "report_type": "Unsafe Act",
        "location": "Unit 4 - Crude Distillation",
        "report_text": "A maintenance fitter removed the lock and tag from a pump motor breaker to test rotation while another technician was still working on the coupling guard. No one confirmed with the permit issuer before re-energising.",
    },
    {
        "report_type": "Near Miss",
        "location": "Tank Farm - Tank T-108 Roof",
        "report_text": "A contractor walked on the floating roof of tank T-108 to check a gauge hatch. He was wearing a harness but it was not clipped to anything, and the handrail on one side was missing.",
    },
    {
        "report_type": "Unsafe Condition",
        "location": "Gas Compressor Station 2",
        "report_text": "The fixed H2S detector near compressor K-201 had shown a fault alarm for three days. Operators kept entering the compressor shed without portable gas monitors.",
    },
    {
        "report_type": "Incident",
        "location": "Warehouse Yard - Bay 3",
        "report_text": "A forklift reversing with a load of drill pipe brushed against a stack of pallets. A helper standing behind the stack was not injured. The forklift's reverse alarm was not working.",
    },
    {
        "report_type": "Unsafe Act",
        "location": "Drilling Rig OIL-12",
        "report_text": "वेल्डर ने ड्रिलिंग रिग के पास हॉट वर्क परमिट के बिना वेल्डिंग शुरू कर दी। पास में डीज़ल ड्रम रखे थे और कोई फायर वॉच मौजूद नहीं था।",
    },
    {
        "report_type": "Near Miss",
        "location": "Pipeline Pigging Station",
        "report_text": "पिगिंग स्टेशनवर लाँचर उघडण्यापूर्वी दाब शून्य झाला आहे की नाही हे तपासले नाही. झाकण उघडताना थोडा गॅस बाहेर आला.",
    },
]


def seed_reports():
    existing = requests.get(f"{BASE_URL}/reports", timeout=30).json()
    existing_texts = {r.get("report_text") for r in existing}
    print(f"Reports in database before seeding: {len(existing)}")

    to_add = [r for r in FIELD_REPORTS if r["report_text"] not in existing_texts]
    skipped = len(FIELD_REPORTS) - len(to_add)
    if skipped:
        print(f"Skipping {skipped} report(s) already in the database.")

    print(f"Analyzing {len(to_add)} field reports. Each Llama call takes about 30-90s.\n")
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
    total = len(requests.get(f"{BASE_URL}/reports", timeout=30).json())
    print(f"Reports in database now: {total}")

    print("\nRunning precursor discovery...")
    try:
        result = requests.post(f"{BASE_URL}/precursors/discover", timeout=60).json()
        print(f"Patterns found/updated: {result.get('patterns_found_or_updated')}")
        for p in result.get("patterns", []):
            print(f"  - {p['name']}: {p['occurrence_count']} occurrences, "
                  f"{p['sif_related_count']} high-SIF")
    except requests.exceptions.RequestException as e:
        print(f"Discovery failed: {e}")


if __name__ == "__main__":
    seed_reports()
