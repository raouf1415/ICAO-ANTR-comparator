import io
import re
import base64
from typing import List, Tuple, Dict, Any

import streamlit as st
import pandas as pd
import numpy as np

# Light-weight text extraction
try:
    import pdfplumber
except Exception:
    pdfplumber = None
try:
    import docx
except Exception:
    docx = None

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# -------------------------
# Utilities
# -------------------------
CLAUSE_SPLIT_PATTERN = re.compile(
    r"(?:^\s*(?:Annex|Appendix|Chapter|Section|Subpart|Part)\s+\d+[A-Za-z]*\.?|\n\s*\d+(?:\.\d+){0,4}\s+)",
    re.IGNORECASE | re.MULTILINE
)

def read_any(file) -> str:
    name = file.name.lower()
    data = file.read()
    # Reset for later reuse
    file.seek(0)
    if name.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")
    if name.endswith(".pdf"):
        if pdfplumber is None:
            raise RuntimeError("pdfplumber not available. Add pdfplumber to requirements.txt.")
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = []
            for page in pdf.pages:
                text.append(page.extract_text() or "")
        return "\n".join(text)
    if name.endswith(".docx"):
        if docx is None:
            raise RuntimeError("python-docx not available. Add python-docx to requirements.txt.")
        d = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in d.paragraphs)
    # Fallback: try utf-8
    return data.decode("utf-8", errors="ignore")


def normalize_whitespace(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def split_clauses(text: str) -> List[Dict[str, Any]]:
    """
    Splits a regulation text into clauses based on numbering patterns and common headings.
    Returns a list of dicts with id and text.
    """
    text = normalize_whitespace(text)
    if not text:
        return []

    # Find all potential boundaries
    positions = [m.start() for m in CLAUSE_SPLIT_PATTERN.finditer("\n" + text)]
    positions = sorted(set([0] + positions + [len(text)]))
    chunks = []
    for i in range(len(positions) - 1):
        chunk = text[positions[i]:positions[i+1]].strip()
        if not chunk:
            continue
        # Derive a simple id (first numbers/heading or first words)
        m = re.match(r"^(Annex|Appendix|Chapter|Section|Subpart|Part)\s+([0-9A-Za-z\.]+)", chunk, re.I)
        n = re.match(r"^(\d+(?:\.\d+){0,4})", chunk)
        if m:
            cid = f"{m.group(1).title()} {m.group(2)}"
        elif n:
            cid = n.group(1)
        else:
            # fallback: first 6 words
            cid = " ".join(chunk.split()[:6]) + ("..." if len(chunk.split())>6 else "")
        chunks.append({"id": cid, "text": chunk})
    # Deduplicate IDs if repeated
    seen = {}
    for c in chunks:
        base_id = c["id"]
        if base_id not in seen:
            seen[base_id] = 1
            continue
        seen[base_id] += 1
        c["id"] = f"{base_id} ({seen[base_id]})"
    return chunks


def compute_alignment(src_clauses: List[Dict[str, Any]], tgt_clauses: List[Dict[str, Any]],
                      min_sim: float = 0.25, top_k: int = 1) -> pd.DataFrame:
    src_texts = [c["text"] for c in src_clauses]
    tgt_texts = [c["text"] for c in tgt_clauses]
    if not src_texts or not tgt_texts:
        return pd.DataFrame(columns=[
            "Source_ID", "Source_Text", "Matched_Target_ID", "Matched_Target_Text", "Similarity"
        ])
    # TF-IDF (character n-grams help on legal text)
    vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1,2),
        min_df=1,
        stop_words=None
    )
    tfidf = vectorizer.fit_transform(src_texts + tgt_texts)
    A = tfidf[:len(src_texts)]
    B = tfidf[len(src_texts):]
    sims = cosine_similarity(A, B)

    rows = []
    for i, s in enumerate(src_clauses):
        # Get top-k matches
        idxs = np.argsort(-sims[i])[:max(top_k, 1)]
        for j in idxs:
            sim = float(sims[i, j])
            if sim >= min_sim:
                rows.append({
                    "Source_ID": s["id"],
                    "Source_Text": s["text"],
                    "Matched_Target_ID": tgt_clauses[j]["id"],
                    "Matched_Target_Text": tgt_clauses[j]["text"],
                    "Similarity": round(sim, 4)
                })
        # If nothing above threshold, still record best
        if not any(r["Source_ID"] == s["id"] for r in rows):
            j = int(np.argmax(sims[i]))
            sim = float(sims[i, j])
            rows.append({
                "Source_ID": s["id"],
                "Source_Text": s["text"],
                "Matched_Target_ID": tgt_clauses[j]["id"],
                "Matched_Target_Text": tgt_clauses[j]["text"],
                "Similarity": round(sim, 4)
            })

    df = pd.DataFrame(rows).sort_values(["Source_ID", "Similarity"], ascending=[True, False])
    # Add gap label (tunable)
    df["Gap?"] = np.where(df["Similarity"] < min_sim, "Potential Gap", "Aligned")
    return df


def make_downloadable(df: pd.DataFrame, filename: str = "gap_matrix.xlsx") -> bytes:
    """Return Excel file bytes for download."""
    import io
    import pandas as pd
    from openpyxl.utils import get_column_letter
    from openpyxl.styles import PatternFill

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Matrix")
        ws = writer.sheets["Matrix"]
        # basic formatting
        for i, col in enumerate(df.columns, start=1):
            ws.column_dimensions[get_column_letter(i)].width = 24
        # highlight gaps
        gap_fill = PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid")
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            if row[df.columns.get_loc("Gap?")].value == "Potential Gap":
                for cell in row:
                    cell.fill = gap_fill
    return output.getvalue()


# -------------------------
# UI
# -------------------------
st.set_page_config(page_title="ICAO Comparator (Streamlit)", layout="wide")

st.sidebar.title("Settings")
min_sim = st.sidebar.slider("Minimum Similarity (Gap Threshold)", 0.0, 1.0, 0.35, 0.01)
top_k = st.sidebar.slider("Top matches per clause", 1, 3, 1, 1)
split_hint = st.sidebar.text_input("Custom regex for clause split (optional)", "")

st.title("📄 ICAO / ANTR Document Comparator")
st.write("Upload two documents (PDF/DOCX/TXT). The app splits them into clauses and aligns semantically similar clauses using TF‑IDF cosine similarity.")

col1, col2 = st.columns(2)
with col1:
    src_file = st.file_uploader("Primary Document (e.g., ANTR)", type=["pdf", "docx", "txt"], key="src")
with col2:
    tgt_file = st.file_uploader("Reference Document (e.g., ICAO Annex)", type=["pdf", "docx", "txt"], key="tgt")

if src_file and tgt_file:
    with st.spinner("Reading & parsing documents..."):
        try:
            src_text = read_any(src_file)
            tgt_text = read_any(tgt_file)
        except Exception as e:
            st.error(f"Failed to read files: {e}")
            st.stop()

        # Optional custom split pattern
        global CLAUSE_SPLIT_PATTERN
        if split_hint.strip():
            try:
                CLAUSE_SPLIT_PATTERN = re.compile(split_hint, re.IGNORECASE | re.MULTILINE)
            except re.error as ex:
                st.warning(f"Ignoring invalid regex: {ex}")

        src_clauses = split_clauses(src_text)
        tgt_clauses = split_clauses(tgt_text)

        st.success(f"Parsed {len(src_clauses)} clauses from primary doc; {len(tgt_clauses)} from reference doc.")

    with st.spinner("Computing alignments..."):
        df = compute_alignment(src_clauses, tgt_clauses, min_sim=min_sim, top_k=top_k)

    st.subheader("Alignment / Gap Matrix")
    st.dataframe(df, use_container_width=True, height=480)

    # Download buttons
    excel_bytes = make_downloadable(df, "gap_matrix.xlsx")
    st.download_button("⬇️ Download Excel (gap_matrix.xlsx)", data=excel_bytes, file_name="gap_matrix.xlsx")

    csv_bytes = df.to_csv(index=False).encode("utf-8")
    st.download_button("⬇️ Download CSV (gap_matrix.csv)", data=csv_bytes, file_name="gap_matrix.csv")

    st.caption("Tip: Lower the threshold to be more lenient, raise it to flag more 'Potential Gap' items.")
else:
    st.info("Upload two documents to begin. Supported: PDF, DOCX, TXT.")