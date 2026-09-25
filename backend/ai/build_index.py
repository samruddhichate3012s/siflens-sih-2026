import os
import pandas as pd
import numpy as np
import faiss

from embeddings import embed_texts

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_FILE = os.path.join(_THIS_DIR, "..", "..", "data", "processed", "osha_reports_clean.csv")
INDEX_OUTPUT_FILE = os.path.join(_THIS_DIR, "..", "..", "data", "processed", "faiss_index.bin")
METADATA_OUTPUT_FILE = os.path.join(_THIS_DIR, "..", "..", "data", "processed", "faiss_metadata.csv")

MAX_ROWS = 3000  # prototype-scale sample; increase later if time allows


def main():
    print("Loading processed OSHA data...")
    df = pd.read_csv(PROCESSED_FILE)

    df = df[df["narrative"].notna()]
    df = df[df["narrative"].str.strip() != ""]

    if len(df) > MAX_ROWS:
        df = df.sample(n=MAX_ROWS, random_state=42).reset_index(drop=True)
    else:
        df = df.reset_index(drop=True)

    print(f"Embedding {len(df)} narratives (this may take a few minutes)...")
    narratives = df["narrative"].tolist()
    vectors = embed_texts(narratives)
    vectors = np.array(vectors).astype("float32")

    dimension = vectors.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(vectors)

    print(f"Saving FAISS index ({index.ntotal} vectors, dimension {dimension})...")
    faiss.write_index(index, INDEX_OUTPUT_FILE)

    df.to_csv(METADATA_OUTPUT_FILE, index=False)

    print("Done.")
    print("Index saved to:", INDEX_OUTPUT_FILE)
    print("Metadata saved to:", METADATA_OUTPUT_FILE)


if __name__ == "__main__":
    main()