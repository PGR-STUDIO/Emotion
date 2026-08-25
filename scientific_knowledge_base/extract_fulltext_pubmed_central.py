#!/usr/bin/env python3
"""Extrait les sections disponibles dans PubMed Central via NCBI E-utilities.

Le script ne contourne aucun abonnement : il utilise uniquement les articles
XML rendus librement accessibles par PubMed Central. Les études sans article
PMC sont marquées comme nécessitant un accès au texte intégral, au lieu d'être
présentées comme extraites.
"""
from __future__ import annotations

import argparse
import json
import ssl
import time
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

USER_AGENT = "MonRepereScientificSearch/0.4 (PubMed Central extraction)"


class MetadataOnlyError(ValueError):
    """Le dépôt PMC fournit la notice, mais pas le corps intégral XML."""


def fetch_xml(url: str) -> ET.Element:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60, context=SSL_CONTEXT) as response:
        return ET.fromstring(response.read())


def pubmed_pmc_ids(pmids: list[str]) -> dict[str, str]:
    params = urllib.parse.urlencode({"db": "pubmed", "id": ",".join(pmids), "retmode": "xml", "tool": "MonRepereScientificSearch"})
    root = fetch_xml(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?{params}")
    output: dict[str, str] = {}
    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID", default="")
        for article_id in article.findall(".//ArticleId"):
            if article_id.attrib.get("IdType") == "pmc" and article_id.text:
                value = article_id.text.strip()
                output[pmid] = value if value.upper().startswith("PMC") else f"PMC{value}"
                break
    return output


def compact_text(nodes) -> str:
    return " ".join(" ".join(" ".join(node.itertext()).split()) for node in nodes).strip()


def extract_pmc(pmc_id: str) -> dict:
    params = urllib.parse.urlencode({"db": "pmc", "id": pmc_id, "retmode": "xml", "tool": "MonRepereScientificSearch"})
    root = fetch_xml(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?{params}")
    article = root.find(".//article")
    if article is None:
        raise ValueError("Le XML PMC ne contient pas d'article")
    title = compact_text(article.findall(".//front//article-title")[:1])
    body = article.find(".//body")
    if body is None:
        raise MetadataOnlyError("Le XML PMC ne contient pas de corps d'article")
    sections = []
    for section in body.findall("./sec"):
        heading = compact_text(section.findall("./title")[:1]) or "Section sans titre"
        paragraphs = compact_text(section.findall(".//p"))
        if paragraphs:
            sections.append({"heading": heading, "text": paragraphs})
    references = []
    for reference in article.findall(".//back//ref"):
        text = compact_text([reference])
        if text:
            references.append(text)
    character_count = sum(len(section["text"]) for section in sections)
    if character_count < 500:
        raise MetadataOnlyError("Le corps XML disponible est trop court pour une extraction intégrale")
    return {
        "pmc_id": pmc_id,
        "pmc_url": f"https://pmc.ncbi.nlm.nih.gov/articles/{pmc_id}/",
        "source": "PubMed Central XML via NCBI E-utilities",
        "retrieved_on": date.today().isoformat(),
        "title_from_full_text": title,
        "sections": sections,
        "reference_count": len(references),
        "references": references,
        "character_count": character_count,
        "extraction_status": "pmc_full_text_xml_verified",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Ajoute les extractions vérifiées à studies.json")
    args = parser.parse_args()
    source = ROOT / "data" / "studies.json"
    studies = json.loads(source.read_text(encoding="utf-8"))
    pmids = [item["pmid"] for item in studies if item.get("pmid")]
    pmc_ids = pubmed_pmc_ids(pmids)
    extracted = 0
    not_available = 0
    errors = []
    metadata_only = []
    for item in studies:
        pmid = item.get("pmid")
        pmc_id = pmc_ids.get(pmid or "")
        if not pmc_id:
            item["full_text_access"] = "not_available_from_pubmed_central"
            item["full_text_extraction_status"] = "entitlement_or_publisher_access_required"
            not_available += 1
            continue
        try:
            item["pmc_id"] = pmc_id
            item["full_text_extraction"] = extract_pmc(pmc_id)
            item["full_text_access"] = "pubmed_central_open_xml"
            item["full_text_extraction_status"] = "pmc_full_text_xml_verified"
            item["extraction_status"] = f"{str(item.get('extraction_status', 'pubmed_abstract_verified')).split(';')[0]}; pmc_full_text_xml_verified"
            extracted += 1
        except MetadataOnlyError as error:
            item["pmc_id"] = pmc_id
            item["full_text_access"] = "pmc_record_metadata_only"
            item["full_text_extraction_status"] = "entitlement_or_publisher_access_required"
            metadata_only.append({"id": item["id"], "pmc_id": pmc_id, "reason": str(error)})
        except Exception as error:
            item["pmc_id"] = pmc_id
            item["full_text_access"] = "pmc_record_found_but_xml_not_extractable"
            item["full_text_extraction_status"] = "manual_review_required"
            errors.append({"id": item["id"], "pmc_id": pmc_id, "error": str(error)})
        time.sleep(0.15)
    output = ROOT / "data" / f"studies_pubmed_central_extracted_{date.today().isoformat()}.json"
    output.write_text(json.dumps(studies, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.apply:
        previous = ROOT / "data" / f"studies_pre_pmc_extraction_{date.today().isoformat()}.json"
        if not previous.exists():
            previous.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
        source.write_text(json.dumps(studies, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        summary_path = ROOT / "audits" / "completion_summary.json"
        if summary_path.exists():
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            summary.update({
                "pmc_identifiers_found": len(pmc_ids),
                "full_text_extractions_verified": extracted,
                "full_text_extractions_pending": len(studies) - extracted,
                "full_text_entitlement_required": sum(item.get("full_text_extraction_status") == "entitlement_or_publisher_access_required" for item in studies),
                "extracted_full_text_references": sum(item.get("full_text_extraction", {}).get("reference_count", 0) for item in studies),
            })
            summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pmc_ids": len(pmc_ids), "extracted": extracted, "not_available": not_available, "metadata_only": metadata_only, "errors": errors, "output": str(output)}, ensure_ascii=False, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    raise SystemExit(main())
