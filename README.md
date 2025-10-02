---
title: Document ICAO Comparator
emoji: 📄
colorFrom: blue
colorTo: gray
sdk: streamlit
app_file: app.py
pinned: false
---

# ICAO / ANTR Document Comparator (Streamlit)

Upload two documents (PDF/DOCX/TXT), split into clauses, align via TF‑IDF cosine similarity, and download a gap matrix.

## Deploy on Streamlit Cloud
- Main file: `app.py`
- Python: `runtime.txt` with `3.11`

## Local run
```
pip install -r requirements.txt
streamlit run app.py
```