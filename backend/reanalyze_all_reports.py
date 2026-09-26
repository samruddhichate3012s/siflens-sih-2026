import time
import requests

BASE_URL = "http://127.0.0.1:8000"

# Re-rates every existing report with the current extractor prompt
# (High / Medium / Low SIF definitions). Rejected reports are skipped.


def main():
    reports = requests.get(f"{BASE_URL}/reports", timeout=30).json()
    todo = [r for r in reports if r.get("validation_status") != "rejected"]
    todo.sort(key=lambda r: r["id"])
    print(f"Re-analysing {len(todo)} reports (skipping {len(reports) - len(todo)} rejected).")
    print("Each Llama call takes about 30-90s.\n")

    summary = {}
    failed = []
    for i, r in enumerate(todo, start=1):
        start = time.time()
        try:
            resp = requests.post(f"{BASE_URL}/reports/{r['id']}/reanalyze", timeout=600)
            data = resp.json()
            if not resp.ok:
                raise RuntimeError(data.get("detail", resp.status_code))
        except Exception as e:
            print(f"[{i}/{len(todo)}] #{r['id']}: FAILED ({e}), old result kept")
            failed.append(r["id"])
            continue
        old, new = data.get("previous_sif_potential"), data.get("sif_potential")
        mark = "" if old == new else "  <-- changed"
        print(f"[{i}/{len(todo)}] #{r['id']}: {old} -> {new} | {data.get('lifesaving_rule')} "
              f"({time.time() - start:.0f}s){mark}")
        summary[new] = summary.get(new, 0) + 1

    print("\nNew SIF distribution:", summary)
    if failed:
        print("Failed (unchanged):", failed)

    print("\nRefreshing recurring precursors...")
    result = requests.post(f"{BASE_URL}/precursors/discover", timeout=60).json()
    for p in result.get("patterns", []):
        print(f"  - {p['name']}: {p['occurrence_count']} reports, {p['sif_related_count']} High SIF")


if __name__ == "__main__":
    main()
