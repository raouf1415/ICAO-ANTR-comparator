import io
import re
from typing import List, Dict, Any

import streamlit as st
import pandas as pd
import numpy as np

# Optional readers
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

# --------- Utilities ---------
CLAUSE_SPLIT_PATTERN = re.compile(
    r"(?:^\s*(?:Annex|Appendix|Chapter|Section|Subpart|Part)\s+\d+[A-Za-z]*\.?|\n\s*\d+(?:\.\d+){0,4}\s+)",
    re.IGNORECASE | re.MULTILINE
)

def read_any(uploaded) -> str:
    # Security: Validate file size (limit to 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    if uploaded.size > MAX_FILE_SIZE:
        raise ValueError(f"File too large. Maximum size allowed is {MAX_FILE_SIZE // (1024*1024)}MB")
    
    name = uploaded.name.lower()
    raw = uploaded.read()
    uploaded.seek(0)
    
    # Security: Validate file extension more strictly
    if not name.endswith((".txt", ".pdf", ".docx")):
        raise ValueError(f"Unsupported file type: {uploaded.name}. Only .txt, .pdf, and .docx files are allowed.")
    
    if name.endswith(".txt"):
        return raw.decode("utf-8", errors="ignore")
    if name.endswith(".pdf"):
        if pdfplumber is None:
            raise RuntimeError("PDF support missing. Please ensure pdfplumber is installed.")
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            texts = [(p.extract_text() or "") for p in pdf.pages]
        return "\n".join(texts)
    if name.endswith(".docx"):
        if docx is None:
            raise RuntimeError("DOCX support missing. Please ensure python-docx is installed.")
        d = docx.Document(io.BytesIO(raw))
        return "\n".join(p.text for p in d.paragraphs)
    # Fallback
    return raw.decode("utf-8", errors="ignore")

def normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()

def split_clauses(text: str) -> List[Dict[str, Any]]:
    text = normalize_ws(text)
    if not text:
        return []
    positions = [m.start() for m in CLAUSE_SPLIT_PATTERN.finditer("\n" + text)]
    positions = sorted(set([0] + positions + [len(text)]))
    chunks = []
    for i in range(len(positions) - 1):
        chunk = text[positions[i]:positions[i+1]].strip()
        if not chunk:
            continue
        m = re.match(r"^(Annex|Appendix|Chapter|Section|Subpart|Part)\s+([0-9A-Za-z\.]+)", chunk, re.I)
        n = re.match(r"^(\d+(?:\.\d+){0,4})", chunk)
        if m:
            cid = f"{m.group(1).title()} {m.group(2)}"
        elif n:
            cid = n.group(1)
        else:
            cid = " ".join(chunk.split()[:6]) + ("..." if len(chunk.split())>6 else "")
        chunks.append({"id": cid, "text": chunk})
    counts = {}
    for c in chunks:
        b = c["id"]
        counts[b] = counts.get(b, 0) + 1
        if counts[b] > 1:
            c["id"] = f"{b} ({counts[b]})"
    return chunks

def align(src, tgt, min_sim=0.35, top_k=1) -> pd.DataFrame:
    A_texts = [c["text"] for c in src]
    B_texts = [c["text"] for c in tgt]
    if not A_texts or not B_texts:
        return pd.DataFrame(columns=["Source_ID","Source_Text","Matched_Target_ID","Matched_Target_Text","Similarity","Gap?"])
    
    # More efficient: fit on combined vocabulary, then transform separately
    vec = TfidfVectorizer(ngram_range=(1,2))
    vec.fit(A_texts + B_texts)  # Learn vocabulary from both documents
    A = vec.transform(A_texts)  # Transform source document
    B = vec.transform(B_texts)  # Transform target document
    sims = cosine_similarity(A, B)
    rows = []
    for i, sc in enumerate(src):
        idxs = np.argsort(-sims[i])[:max(1, top_k)]
        added = False
        for j in idxs:
            sim = float(sims[i, j])
            if sim >= min_sim:
                rows.append({
                    "Source_ID": sc["id"],
                    "Source_Text": sc["text"],
                    "Matched_Target_ID": tgt[j]["id"],
                    "Matched_Target_Text": tgt[j]["text"],
                    "Similarity": round(sim, 4),
                    "Gap?": "Aligned"
                })
                added = True
        if not added:
            j = int(np.argmax(sims[i]))
            sim = float(sims[i, j])
            rows.append({
                "Source_ID": sc["id"],
                "Source_Text": sc["text"],
                "Matched_Target_ID": tgt[j]["id"],
                "Matched_Target_Text": tgt[j]["text"],
                "Similarity": round(sim, 4),
                "Gap?": "Potential Gap"
            })
    df = pd.DataFrame(rows).sort_values(["Source_ID","Similarity"], ascending=[True, False]).reset_index(drop=True)
    return df

def to_excel_bytes(df: pd.DataFrame) -> bytes:
    import io
    from openpyxl.utils import get_column_letter
    from openpyxl.styles import PatternFill
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Matrix")
        ws = w.sheets["Matrix"]
        for i, _ in enumerate(df.columns, start=1):
            ws.column_dimensions[get_column_letter(i)].width = 24
        gap_fill = PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid")
        for r in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            if r[df.columns.get_loc("Gap?")].value == "Potential Gap":
                for cell in r:
                    cell.fill = gap_fill
    return out.getvalue()

# --------- UI ---------
st.set_page_config(page_title="ICAO / ANTR Comparator", layout="wide")
st.title("📄 ICAO / ANTR Document Comparator")

st.sidebar.header("Settings")
min_sim = st.sidebar.slider("Minimum Similarity (Gap Threshold)", 0.0, 1.0, 0.35, 0.01)
top_k = st.sidebar.slider("Top matches per clause", 1, 3, 1)
split_hint = st.sidebar.text_input("Custom regex for clause split (optional)", "")

c1, c2 = st.columns(2)
with c1:
    src_file = st.file_uploader("Primary Document (e.g., ANTR)", type=["pdf","docx","txt"], key="src")
with c2:
    tgt_file = st.file_uploader("Reference Document (e.g., ICAO Annex)", type=["pdf","docx","txt"], key="tgt")

if src_file and tgt_file:
    with st.spinner("Reading & parsing documents…"):
        try:
            src_text = read_any(src_file)
            tgt_text = read_any(tgt_file)
        except ValueError as e:
            st.error(f"File validation error: {e}")
            st.stop()
        except Exception as e:
            st.error(f"File read error: {e}")
            st.stop()

        # Apply custom regex pattern if provided
        if split_hint.strip():
            try:
                global CLAUSE_SPLIT_PATTERN
                CLAUSE_SPLIT_PATTERN = re.compile(split_hint, re.IGNORECASE | re.MULTILINE)
            except re.error as ex:
                st.warning(f"Ignoring invalid regex: {ex}")

        src = split_clauses(src_text)
        tgt = split_clauses(tgt_text)

        st.success(f"Parsed {len(src)} clauses (Primary) and {len(tgt)} clauses (Reference).")

    with st.spinner("Computing alignments…"):
        df = align(src, tgt, min_sim=min_sim, top_k=top_k)

    st.subheader("Alignment / Gap Matrix")
    st.dataframe(df, use_container_width=True, height=520)

    st.download_button("⬇️ Download Excel", data=to_excel_bytes(df), file_name="gap_matrix.xlsx")
    st.download_button("⬇️ Download CSV", data=df.to_csv(index=False).encode("utf-8"), file_name="gap_matrix.csv")

else:
    st.info("Upload two documents (PDF, DOCX, or TXT) to begin.")