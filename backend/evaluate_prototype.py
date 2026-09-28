"""
Measure how well the SIFLens prototype does on a labelled test set.

Runs the same steps as POST /reports/analyze (language detection, translation,
Llama extraction) plus the similar-incident search, directly on the AI modules.
Nothing is written to siflens.db, so the uvicorn server does not need to run.
Ollama must be running.

    cd backend
    python evaluate_prototype.py              # all reports in eval/test_set.csv
    python evaluate_prototype.py --limit 5    # quick trial on the first 5

Results:
    eval/eval_results.csv   one row per report (what the AI said vs the label)
    eval/eval_summary.txt   the numbers for the PPT

The run resumes: reports already in eval_results.csv are skipped, so it is safe
to stop and start again. Delete eval_results.csv to start from scratch.
"""
import argparse
import csv
import os
import time

from ai.translate import detect_and_translate
from ai.extractor import extract_safety_fields
from ai.retrieval import find_similar

HERE = os.path.dirname(os.path.abspath(__file__))
TEST_SET = os.path.join(HERE, "eval", "test_set.csv")
RESULTS = os.path.join(HERE, "eval", "eval_results.csv")
SUMMARY = os.path.join(HERE, "eval", "eval_summary.txt")

FIELDS = [
    "id", "expected_language", "detected_language", "detection_method",
    "expected_sif", "ai_sif", "expected_rule", "ai_rule",
    "language_ok", "sif_ok", "rule_ok", "json_ok",
    "analysis_seconds", "search_seconds",
    "english_text", "activity", "hazard", "energy", "exposure",
    "critical_control", "barrier_failure", "potential_consequence", "evidence",
    "top5_matches",
]


def load_done():
    if not os.path.exists(RESULTS):
        return {}
    with open(RESULTS, encoding="utf-8", newline="") as f:
        return {row["id"]: row for row in csv.DictReader(f)}


def evaluate_one(case):
    start = time.perf_counter()
    translation = detect_and_translate(case["report_text"])
    english_text = translation.get("english_translation") or case["report_text"]
    result = extract_safety_fields(english_text)
    analysis_seconds = time.perf_counter() - start

    keyword_source_text = " ".join(
        str(result.get(k)) for k in ["hazard", "energy", "critical_control", "barrier_failure"]
        if result.get(k) and result.get(k) != "Unknown"
    )
    start = time.perf_counter()
    matches = find_similar(english_text, keyword_source_text=keyword_source_text, top_k=5)
    search_seconds = time.perf_counter() - start

    detected = translation.get("detected_language") or "Unknown"
    return {
        "id": case["id"],
        "expected_language": case["expected_language"],
        "detected_language": detected,
        "detection_method": translation.get("detection_method", ""),
        "expected_sif": case["expected_sif"],
        "ai_sif": result.get("sif_potential", "Unknown"),
        "expected_rule": case["expected_rule"],
        "ai_rule": result.get("lifesaving_rule", "Unknown"),
        "language_ok": int(detected.strip().lower() == case["expected_language"].strip().lower()),
        "sif_ok": int(result.get("sif_potential") == case["expected_sif"]),
        "rule_ok": int(result.get("lifesaving_rule") == case["expected_rule"]),
        "json_ok": int("error" not in result),
        "analysis_seconds": f"{analysis_seconds:.1f}",
        "search_seconds": f"{search_seconds:.2f}",
        "english_text": english_text,
        **{k: result.get(k, "") for k in [
            "activity", "hazard", "energy", "exposure", "critical_control",
            "barrier_failure", "potential_consequence", "evidence"]},
        "top5_matches": " || ".join(
            f"{m.get('event_type', '')}: {str(m.get('narrative', ''))[:120]}" for m in matches
        ),
    }


def pct(num, den):
    return f"{100 * num / den:.0f}% ({num}/{den})" if den else "n/a"


def write_summary(rows):
    n = len(rows)
    ints = lambda k, rs: sum(int(r[k]) for r in rs)
    english = [r for r in rows if r["expected_language"] == "English"]
    other = [r for r in rows if r["expected_language"] != "English"]
    true_high = [r for r in rows if r["expected_sif"] == "High"]
    ai_high = [r for r in rows if r["ai_sif"] == "High"]
    avg = lambda rs, k: sum(float(r[k]) for r in rs) / len(rs) if rs else 0.0

    lines = [
        f"SIFLens prototype evaluation on {n} labelled reports "
        f"({len(english)} English, {len(other)} Hindi/Marathi)",
        "",
        f"Language detection accuracy : {pct(ints('language_ok', rows), n)}",
        f"SIF level accuracy (H/M/L)  : {pct(ints('sif_ok', rows), n)}",
        f"High-SIF recall             : {pct(sum(r['ai_sif'] == 'High' for r in true_high), len(true_high))}"
        "   (true High reports the AI also rated High)",
        f"High-SIF precision          : {pct(sum(r['expected_sif'] == 'High' for r in ai_high), len(ai_high))}"
        "   (AI High ratings that were truly High)",
        f"Life-Saving Rule accuracy   : {pct(ints('rule_ok', rows), n)}",
        f"SIF + rule both correct     : {pct(sum(int(r['sif_ok']) and int(r['rule_ok']) for r in rows), n)}",
        f"Valid structured output     : {pct(ints('json_ok', rows), n)}",
        "",
        f"Avg analysis time, English  : {avg(english, 'analysis_seconds'):.0f} s per report",
        f"Avg analysis time, HI/MR    : {avg(other, 'analysis_seconds'):.0f} s per report (translation + extraction)",
        f"Avg similar-case search     : {avg(rows, 'search_seconds'):.2f} s over 3,000 OSHA narratives",
        "",
        "Per language:",
    ]
    for lang in ["English", "Hindi", "Marathi"]:
        rs = [r for r in rows if r["expected_language"] == lang]
        if rs:
            lines.append(
                f"  {lang:8s} n={len(rs):2d}  language {pct(ints('language_ok', rs), len(rs))}"
                f"  SIF {pct(ints('sif_ok', rs), len(rs))}  rule {pct(ints('rule_ok', rs), len(rs))}"
            )
    wrong = [r for r in rows if not (int(r["sif_ok"]) and int(r["rule_ok"]))]
    if wrong:
        lines += ["", "Reports where the AI disagreed with the label:"]
        for r in wrong:
            lines.append(
                f"  {r['id']}: expected {r['expected_sif']} / {r['expected_rule']}"
                f"  ->  AI {r['ai_sif']} / {r['ai_rule']}"
            )
    text = "\n".join(lines) + "\n"
    with open(SUMMARY, "w", encoding="utf-8") as f:
        f.write(text)
    print("\n" + text)
    print(f"Saved {SUMMARY}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    with open(TEST_SET, encoding="utf-8", newline="") as f:
        cases = list(csv.DictReader(f))
    if args.limit:
        cases = cases[: args.limit]

    done = load_done()
    todo = [c for c in cases if c["id"] not in done]
    print(f"{len(cases)} test reports, {len(done)} already done, {len(todo)} to run.")
    print("Each report takes about 30-90 s on CPU (Hindi/Marathi need two Llama calls).\n")

    new_file = not os.path.exists(RESULTS)
    with open(RESULTS, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            writer.writeheader()
        for i, case in enumerate(todo, start=1):
            print(f"[{i}/{len(todo)}] {case['id']} ({case['expected_language']}) ...", flush=True)
            row = evaluate_one(case)
            writer.writerow(row)
            f.flush()
            done[row["id"]] = row
            print(f"    language {row['detected_language']}, SIF {row['ai_sif']} "
                  f"(label {row['expected_sif']}), rule {row['ai_rule']} "
                  f"(label {row['expected_rule']}), {row['analysis_seconds']} s")

    wanted = {c["id"] for c in cases}
    write_summary([r for k, r in done.items() if k in wanted])


if __name__ == "__main__":
    main()
