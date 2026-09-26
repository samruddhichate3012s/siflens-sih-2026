import requests
import time

BASE_URL = "http://127.0.0.1:8000"

# Reports designed to test SIF levels and the HSE Validate / Modify / Reject flow.
# "test" says what to do with each one on the HSE Validation page.
TEST_REPORTS = [
    {
        "test": "A - expect Low, then VALIDATE",
        "report_type": "Unsafe Condition",
        "location": "Workshop - Bay 1",
        "report_text": "A small patch of hydraulic oil was found on the workshop floor next to the bench drill. The area was wiped clean and a drip tray was placed under the machine. No one slipped.",
    },
    {
        "test": "B - expect Medium, then VALIDATE",
        "report_type": "Unsafe Act",
        "location": "Fabrication Yard",
        "report_text": "A helper was using an angle grinder with safety glasses but without a face shield. The grinder guard was fitted and correctly positioned. A small spark hit his sleeve but caused no burn.",
    },
    {
        "test": "C - expect High, then VALIDATE",
        "report_type": "Unsafe Act",
        "location": "Effluent Treatment Plant - Sump Pit",
        "report_text": "A contractor climbed down into the effluent sump pit to remove a blockage. No gas test was done before entry, no entry permit was issued and there was no standby person at the manhole.",
    },
    {
        "test": "D - likely rated too HIGH, then MODIFY with facts that lower it",
        "report_type": "Near Miss",
        "location": "Unit 2 - Line 12 Isolation Valve",
        "report_text": "During valve maintenance on line 12, the lockout tag was found missing from the isolation valve.",
    },
    {
        "test": "E - likely rated too LOW, then MODIFY with facts that raise it",
        "report_type": "Unsafe Condition",
        "location": "Pipe Rack PR-3 Work Platform",
        "report_text": "A loose scaffold board was noticed on a work platform.",
    },
    {
        "test": "F - not a safety report, then REJECT",
        "report_type": "Near Miss",
        "location": "Admin Block - Canteen",
        "report_text": "Lunch in the canteen was served 30 minutes late today and the tea was cold. Please improve the service.",
    },
]


def main():
    existing = requests.get(f"{BASE_URL}/reports", timeout=30).json()
    by_text = {r.get("report_text"): r for r in existing}
    print(f"Reports in database before seeding: {len(existing)}\n")

    results = []
    for i, report in enumerate(TEST_REPORTS, start=1):
        label = report["test"]
        if report["report_text"] in by_text:
            data = by_text[report["report_text"]]
            print(f"[{i}/{len(TEST_REPORTS)}] already exists as #{data['id']}")
        else:
            print(f"[{i}/{len(TEST_REPORTS)}] analysing ({report['report_type']} @ {report['location']})...")
            start = time.time()
            payload = {k: report[k] for k in ("report_text", "report_type", "location")}
            try:
                resp = requests.post(f"{BASE_URL}/reports/analyze", json=payload, timeout=600)
                resp.raise_for_status()
                data = resp.json()
            except requests.exceptions.RequestException as e:
                print(f"    -> FAILED: {e}")
                continue
            print(f"    -> done in {time.time() - start:.0f}s")
        results.append((label, data))

    print("\n=========== TEST PLAN ===========")
    for label, data in results:
        print(f"Report #{data['id']}: AI said {data.get('sif_potential')} / {data.get('lifesaving_rule')}")
        print(f"    {label}")
    total = len(requests.get(f"{BASE_URL}/reports", timeout=30).json())
    print(f"\nReports in database now: {total}")


if __name__ == "__main__":
    main()
