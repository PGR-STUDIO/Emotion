#!/usr/bin/env python3
"""Complète les études avec les résumés PubMed disponibles.

La sortie distingue les métadonnées/résumés vérifiés de l'extraction du texte
intégral, qui reste explicitement en attente quand elle n'est pas disponible.
"""
from __future__ import annotations

import argparse
import json
import ssl
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
try:
    import certifi
    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()


def fetch(ids: list[str]) -> dict[str, dict]:
    params = urllib.parse.urlencode({"db": "pubmed", "id": ",".join(ids), "retmode": "xml", "tool": "MonRepereScientificSearch"})
    request = urllib.request.Request(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?{params}", headers={"User-Agent": "MonRepereScientificSearch/0.4"})
    with urllib.request.urlopen(request, timeout=60, context=SSL_CONTEXT) as response:
        root = ET.fromstring(response.read())
    output = {}
    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID", default="")
        abstract = " ".join("".join(node.itertext()).strip() for node in article.findall(".//AbstractText"))
        output[pmid] = {"abstract": abstract}
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Remplace studies.json après création de la sortie enrichie")
    args = parser.parse_args()
    source = ROOT / "data" / "studies.json"
    studies = json.loads(source.read_text(encoding="utf-8"))
    pmids = [item["pmid"] for item in studies if item.get("pmid")]
    records = fetch(pmids)
    enriched = 0
    for item in studies:
        record = records.get(item.get("pmid", ""), {})
        if record.get("abstract"):
            item.setdefault("abstract", record["abstract"])
            if item.get("abstract") == record["abstract"] or item.get("extraction_status", "").startswith("bibliographic_metadata_verified"):
                item["extraction_status"] = "pubmed_abstract_verified; full_text_extraction_pending"
            enriched += 1
    output = ROOT / "data" / f"studies_pubmed_enriched_{date.today().isoformat()}.json"
    output.write_text(json.dumps(studies, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.apply:
        source.write_text(json.dumps(studies, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{enriched} résumé(s) PubMed disponibles; sortie: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
