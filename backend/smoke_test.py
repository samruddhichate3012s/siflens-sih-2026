import requests

BASE_URL = "http://127.0.0.1:8000"

results = []


def check(name, method, path, json_body=None, expect_status=200):
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=30)
        else:
            response = requests.post(url, json=json_body, timeout=30)

        passed = response.status_code == expect_status
        results.append((name, passed, response.status_code))
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {name} -> {response.status_code}")
        return response.json() if passed else None

    except requests.exceptions.RequestException as e:
        results.append((name, False, "ERROR"))
        print(f"[FAIL] {name} -> {e}")
        return None


def main():
    print("Running SIFLens backend smoke test...\n")

    check("Root endpoint", "GET", "/")
    check("Health check", "GET", "/health")
    check("Database check", "GET", "/db-check")

    reports = check("List reports", "GET", "/reports")

    if reports and len(reports) > 0:
        first_id = reports[0]["id"]
        check("Get single report", "GET", f"/reports/{first_id}")
        check("Get similar reports", "GET", f"/reports/{first_id}/similar")
    else:
        print("[SKIP] No existing reports to test detail/similar endpoints")

    check(
        "Analyze new report",
        "POST",
        "/reports/analyze",
        json_body={"report_text": "A worker slipped on a wet floor near the loading dock and sprained an ankle."},
    )

    check("Run precursor discovery", "POST", "/precursors/discover")
    precursors = check("List precursors", "GET", "/precursors")

    if precursors and len(precursors) > 0:
        first_precursor_id = precursors[0]["id"]
        check("Get precursor detail", "GET", f"/precursors/{first_precursor_id}")
        check(
            "Validate precursor",
            "POST",
            f"/precursors/{first_precursor_id}/validate",
            json_body={"status": "confirmed", "comment": "Smoke test validation", "validator": "Smoke Test"},
        )
        check("Get validation history", "GET", f"/precursors/{first_precursor_id}/validations")
    else:
        print("[SKIP] No precursors to test detail/validation endpoints")

    check(
        "Reject invalid validation status",
        "POST",
        f"/precursors/{precursors[0]['id'] if precursors else 1}/validate",
        json_body={"status": "not_a_real_status", "comment": "", "validator": "Smoke Test"},
    )

    print("\n" + "=" * 50)
    passed_count = sum(1 for _, p, _ in results if p)
    total_count = len(results)
    print(f"RESULT: {passed_count}/{total_count} checks passed")

    if passed_count < total_count:
        print("\nFailed checks:")
        for name, passed, status in results:
            if not passed:
                print(f"  - {name} (status: {status})")


if __name__ == "__main__":
    main()