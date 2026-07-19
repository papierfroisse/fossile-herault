import os
import requests
from pypdf import PdfReader

URL = "https://sciencepress.mnhn.fr/sites/default/files/articles/pdf/comptes-rendus-palevol2013v12f2a02.pdf"
PDF_PATH = os.path.join(os.path.dirname(__file__), "article_mnhn_2013.pdf")
TXT_PATH = os.path.join(os.path.dirname(__file__), "article_mnhn_2013.txt")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print(f"Downloading {URL}...")
r = requests.get(URL, headers=headers, timeout=30)
r.raise_for_status()

with open(PDF_PATH, "wb") as f:
    f.write(r.content)

print(f"Downloaded {len(r.content)} bytes to {PDF_PATH}")

reader = PdfReader(PDF_PATH)
text_pages = []

for i, page in enumerate(reader.pages):
    t = page.extract_text()
    text_pages.append(f"--- PAGE {i+1} ---\n" + t)

full_text = "\n\n".join(text_pages)

with open(TXT_PATH, "w", encoding="utf-8") as f:
    f.write(full_text)

print(f"Extracted {len(reader.pages)} pages ({len(full_text)} chars) to {TXT_PATH}")
