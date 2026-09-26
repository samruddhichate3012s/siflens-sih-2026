import requests
import time

BASE_URL = "http://127.0.0.1:8000"

DEMO_REPORTS = [
    "A scaffolder was working at 6 meters height during insulation removal. His safety harness lanyard was clipped to a handrail that was not load-rated, rather than the designated anchor point.",
    "During pipe grinding work near a flammable storage area, the hot work permit had expired the previous day but work continued without renewal or a fresh gas test.",
    "A worker entered a storage tank for cleaning without confirming the atmosphere had been tested for oxygen levels or toxic gas, and no attendant was stationed outside.",
    "A crane operator lifted a steel beam over an active walkway where two workers were present, without cordoning off the area below the suspended load.",
    "A driver was operating a company vehicle on-site while reading a text message and did not notice a pedestrian crossing near the loading dock.",
    "A technician bypassed an interlock switch on a conveyor belt to clear a jam while the machine was still running, instead of following lockout procedure.",
]


def seed_reports():
    print(f"Seeding {len(DEMO_REPORTS)} demo reports via real /reports/analyze endpoint...")
    print("This will take several minutes since each call runs Llama analysis.\n")

    created_ids = []

    for i, report_text in enumerate(DEMO_REPORTS, start=1):
        print(f"[{i}/{len(DEMO_REPORTS)}] Analyzing: {report_text[:60]}...")
        start = time.time()

        try:
            response = requests.post(
                f"{BASE_URL}/reports/analyze",
                json={"report_text": report_text},
                timeout=180,
            )
            response.raise_for_status()
            data = response.json()
            elapsed = time.time() - start

            print(f"    -> id={data.get('id')}, lifesaving_rule={data.get('lifesaving_rule')}, "
                  f"sif_potential={data.get('sif_potential')} ({elapsed:.1f}s)")
            created_ids.append(data.get("id"))

        except requests.exceptions.RequestException as e:
            print(f"    -> FAILED: {e}")

    print(f"\nSeeded {len(created_ids)} reports: {created_ids}")

    print("\nRunning precursor discovery...")
    try:
        response = requests.post(f"{BASE_URL}/precursors/discover", timeout=60)
        response.raise_for_status()
        result = response.json()
        print(f"Patterns found/updated: {result.get('patterns_found_or_updated')}")
        for p in result.get("patterns", []):
            print(f"  - {p['name']}: {p['occurrence_count']} occurrences, "
                  f"{p['sif_related_count']} high-SIF")
    except requests.exceptions.RequestException as e:
        print(f"Discovery failed: {e}")


if __name__ == "__main__":
    seed_reports()