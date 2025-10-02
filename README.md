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

A lightweight, deploy‑ready Streamlit app for clause‑by‑clause comparison between two documents (e.g., Bahrain ANTR vs ICAO Annex). It splits each document into clauses and aligns them using TF‑IDF cosine similarity, producing a gap matrix you can download as Excel/CSV.

## Features
- Upload **PDF/DOCX/TXT**
- Automatic clause splitting based on headings/numbering (e.g., `1.2.3`, `Chapter 1`, `Subpart A`)
- TF‑IDF alignment with adjustable similarity threshold
- Downloadable **Excel** gap matrix (highlighting potential gaps) and **CSV**

## One‑Click Deploy (Streamlit Community Cloud)
1. Fork this repo to your GitHub account
2. Go to **https://streamlit.io/cloud** → **New app**
3. Select your repo/branch → `app.py`
4. Click **Deploy**

No secrets or external models required.

## Run Locally
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt
streamlit run app.py
```

## Notes
- This app avoids heavy model downloads (Sentence Transformers, etc.) and runs entirely with classic TF‑IDF.
- If your documents have unusual numbering, provide a custom regex in the sidebar to improve clause detection.

## License
MIT