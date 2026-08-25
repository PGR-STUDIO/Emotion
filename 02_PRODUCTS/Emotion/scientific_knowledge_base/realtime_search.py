#!/usr/bin/env python3
"""Recherche documentaire temps réel, sans dépendance externe.

PubMed est interrogé via les E-utilities officielles de NCBI.
Les autres fournisseurs sont déclarés dans source_config.json et nécessitent
leurs accès/API officiels ; aucune clé n'est stockée dans le dépôt.
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / "source_config.json"

try:
    import certifi
    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()


def request_json(url: str, params: dict[str, str]) -> dict:
    query = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "MonRepereScientificSearch/0.4"})
    with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as response:
        return json.loads(response.read().decode("utf-8"))


def request_xml(url: str, params: dict[str, str]) -> ET.Element:
    query = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "MonRepereScientificSearch/0.4"})
    with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as response:
        return ET.fromstring(response.read())


def pubmed_search(term: str, limit: int) -> dict:
    email = os.getenv("NCBI_EMAIL", "")
    tool = os.getenv("NCBI_TOOL", "MonRepereScientificSearch")
    common = {"db": "pubmed", "term": term, "retmode": "json", "tool": tool}
    if email:
        common["email"] = email
    if os.getenv("NCBI_API_KEY"):
        common["api_key"] = os.environ["NCBI_API_KEY"]
    search = request_json("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", {**common, "retmax": str(limit), "sort": "date"})
    ids = search.get("esearchresult", {}).get("idlist", [])
    if not ids:
        return {"source": "PubMed", "query": term, "retrieved_at": now(), "results": []}
    root = request_xml("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi", {"db": "pubmed", "id": ",".join(ids), "retmode": "xml", "tool": tool, "email": email})
    results = []
    for article in root.findall(".//PubmedArticle"):
        medline = article.find("MedlineCitation")
        pmid = medline.findtext("PMID", default="") if medline is not None else ""
        art = medline.find("Article") if medline is not None else None
        if art is None:
            continue
        title = "".join(art.find("ArticleTitle").itertext()) if art.find("ArticleTitle") is not None else ""
        abstract = " ".join("".join(x.itertext()) for x in art.findall("Abstract/AbstractText"))
        doi = next((x.text for x in article.findall(".//ArticleId") if x.attrib.get("IdType") == "doi"), "")
        results.append({"id": f"PUBMED-{pmid}", "pmid": pmid, "title": title, "abstract": abstract, "doi": doi, "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/", "source": "PubMed"})
    return {"source": "PubMed", "query": term, "retrieved_at": now(), "results": results}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    parser = argparse.ArgumentParser(description="Recherche scientifique temps réel pour Mon repère")
    parser.add_argument("term", help="Requête PubMed, par exemple emotion regulation mindfulness")
    parser.add_argument("--limit", type=int, default=10, help="Nombre maximal de résultats")
    parser.add_argument("--output", type=Path, help="Fichier JSON de sortie")
    args = parser.parse_args()
    try:
        payload = pubmed_search(args.term, max(1, min(args.limit, 100)))
    except Exception as exc:
        print(f"Erreur de recherche PubMed: {exc}", file=sys.stderr)
        return 1
    output = args.output or (ROOT / "data" / f"pubmed_live_{datetime.now().date()}.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(payload['results'])} résultat(s) PubMed enregistrés dans {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
