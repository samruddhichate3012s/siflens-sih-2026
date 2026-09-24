import os
import re
import pandas as pd
import numpy as np
import faiss

from .embeddings import embed_texts

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(_THIS_DIR, "..", "..", "data", "processed", "faiss_index.bin")
METADATA_FILE = os.path.join(_THIS_DIR, "..", "..", "data", "processed", "faiss_metadata.csv")

_index = None
_metadata = None

STOPWORDS = {
    "the", "and", "was", "were", "with", "from", "that", "this", "into",
    "onto", "unknown", "employee", "employees", "worker", "while",
    "during", "when", "after", "before", "their", "they", "have", "been",
}


def _load():
    global _index, _metadata
    if _index is None:
        _index = faiss.read_index(INDEX_FILE)
    if _metadata is None:
        _metadata = pd.read_csv(METADATA_FILE)


def _extract_keywords(text):
    if not text:
        return set()
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return {w for w in words if len(w) >= 4 and w not in STOPWORDS}


def _build_candidate(idx, rank, distances, keywords):
    row = _metadata.iloc[idx]
    candidate_text = " ".join(
        str(row.get(field, "")) for field in ["event_type", "nature"]
    ).lower()
    keyword_match = any(kw in candidate_text for kw in keywords) if keywords else False

    return {
        "distance": float(distances[rank]),
        "keyword_match": keyword_match,
        "fallback": False,
        "report_id": str(row.get("report_id", "")),
        "narrative": row.get("narrative", ""),
        "employer": row.get("employer", ""),
        "event_type": row.get("event_type", ""),
        "nature": row.get("nature", ""),
        "data_source": row.get("data_source", ""),
    }


def find_similar(query_text, keyword_source_text="", top_k=5):
    _load()

    candidate_pool_size = max(top_k * 6, 30)

    query_vector = embed_texts([query_text])
    query_vector = np.array(query_vector).astype("float32")

    distances, indices = _index.search(query_vector, candidate_pool_size)

    keywords = _extract_keywords(keyword_source_text)

    all_candidates = []
    for rank, idx in enumerate(indices[0]):
        if idx == -1:
            continue
        all_candidates.append(_build_candidate(idx, rank, distances[0], keywords))

    filtered = [c for c in all_candidates if c["keyword_match"]]
    filtered.sort(key=lambda c: c["distance"])

    results = filtered[:top_k]

    if len(results) < top_k and keywords:
        already_used = {r["report_id"] for r in results}
        remaining_pool = [
            c for c in all_candidates
            if c["report_id"] not in already_used
        ]
        remaining_pool.sort(key=lambda c: c["distance"])

        needed = top_k - len(results)
        for c in remaining_pool[:needed]:
            c["fallback"] = True
            results.append(c)

    if not keywords:
        all_candidates.sort(key=lambda c: c["distance"])
        results = all_candidates[:top_k]

    for rank, r in enumerate(results):
        r["rank"] = rank + 1

    return results