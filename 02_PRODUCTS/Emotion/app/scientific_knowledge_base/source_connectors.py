#!/usr/bin/env python3
"""Connecteurs documentaires officiels et configurables.

PubMed est utilisable sans abonnement via NCBI E-utilities.
ScienceDirect utilise l'API Elsevier si ELSEVIER_API_KEY est fournie.
APA PsycNet et Cochrane restent des adaptateurs explicites : leurs accès
doivent être fournis par l'organisation selon les droits et l'API disponibles.
Ce module ne scrape jamais une interface protégée.
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class ConnectorNotConfigured(RuntimeError):
    pass


def http_json(url: str, *, headers: dict[str, str] | None = None, method: str = "GET", body: bytes | None = None) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": "MonRepereScientificSearch/0.4", **(headers or {})}, method=method, data=body)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def search_pubmed(query: str, limit: int = 10) -> dict:
    from realtime_search import pubmed_search
    return pubmed_search(query, limit)


def search_sciencedirect(query: str, limit: int = 10) -> dict:
    api_key = os.getenv("ELSEVIER_API_KEY")
    if not api_key:
        raise ConnectorNotConfigured("ELSEVIER_API_KEY n’est pas configurée")
    params = urllib.parse.urlencode({"query": query, "count": str(max(1, min(limit, 200)))})
    payload = http_json(f"https://api.elsevier.com/content/search/sciencedirect?{params}", headers={"X-ELS-APIKey": api_key, "Accept": "application/json"})
    search_results = payload.get("search-results") or {}
    entries = search_results.get("entry", []) if isinstance(search_results, dict) else []
    return {"source": "ScienceDirect", "status": "ok", "query": query, "results": [{"title": entry.get("dc:title", ""), "doi": entry.get("prism:doi", ""), "url": entry.get("link", [{}])[0].get("@href", "") if entry.get("link") else "", "source": "ScienceDirect"} for entry in entries]}


def search_configured_official_json(source: str, query: str, limit: int, *, url_env: str, key_env: str, official_url: str) -> dict:
    """Appelle un endpoint JSON officiel fourni par l'institution.

    Les deux bases ne publient pas ici un endpoint public universel. Le projet
    accepte donc l'URL d'API attribuée par l'organisation, exige HTTPS et ne
    conserve jamais la clé. La normalisation reste volontairement minimale :
    l'adaptateur renvoie les métadonnées courantes sans copier de texte intégral.
    """
    endpoint = os.getenv(url_env)
    api_key = os.getenv(key_env)
    if not endpoint or not api_key:
        return unavailable_source(source, official_url, detail=f"Configurer {url_env} et {key_env} selon l'accès officiel de l'organisation.")
    parsed = urllib.parse.urlparse(endpoint)
    if parsed.scheme != "https":
        return {"source": source, "status": "invalid_configuration", "message": "L'endpoint institutionnel doit utiliser HTTPS.", "official_access": official_url, "results": []}
    params = urllib.parse.urlencode({"q": query, "limit": str(max(1, min(limit, 200)))})
    separator = "&" if parsed.query else "?"
    payload = http_json(f"{endpoint}{separator}{params}", headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
    search_results = payload.get("search-results") or {}
    entries = payload.get("results") or payload.get("items") or payload.get("records") or (search_results.get("entry", []) if isinstance(search_results, dict) else [])
    if isinstance(entries, dict):
        entries = [entries]
    results = []
    for entry in entries[:limit]:
        if not isinstance(entry, dict):
            continue
        links = entry.get("links") or entry.get("link") or []
        if isinstance(links, dict):
            links = [links]
        url = entry.get("url") or entry.get("doi_url") or (links[0].get("href") if links and isinstance(links[0], dict) else "")
        results.append({"title": entry.get("title") or entry.get("name") or entry.get("dc:title") or "", "doi": entry.get("doi") or entry.get("prism:doi") or "", "url": url, "source": source})
    return {"source": source, "status": "ok", "query": query, "results": results, "official_access": official_url}


def search_apa_psycnet(query: str, limit: int = 10) -> dict:
    return search_configured_official_json("APA PsycNet", query, limit, url_env="APA_PSYNET_API_URL", key_env="APA_PSYNET_API_KEY", official_url="https://www.apa.org/pubs/psycinfoservices")


def search_cochrane(query: str, limit: int = 10) -> dict:
    return search_configured_official_json("Cochrane Library", query, limit, url_env="COCHRANE_API_URL", key_env="COCHRANE_API_KEY", official_url="https://www.cochranelibrary.com/")


def unavailable_source(name: str, url: str, *, detail: str | None = None) -> dict:
    return {"source": name, "status": "not_configured", "message": detail or "Accès officiel/API institutionnelle à configurer; aucun contournement ni scraping.", "official_access": url, "results": []}


def search_all(query: str, limit: int = 10) -> dict:
    results = []
    try:
        results.append(search_pubmed(query, limit))
    except Exception as error:
        results.append({"source": "PubMed", "status": "error", "message": str(error), "results": []})
    if os.getenv("ELSEVIER_API_KEY"):
        try:
            results.append(search_sciencedirect(query, limit))
        except Exception as error:
            results.append({"source": "ScienceDirect", "status": "error", "message": str(error), "results": []})
    else:
        results.append(unavailable_source("ScienceDirect", "https://dev.elsevier.com/sd_apis.html"))
    try:
        results.append(search_apa_psycnet(query, limit))
    except Exception as error:
        results.append({"source": "APA PsycNet", "status": "error", "message": str(error), "results": []})
    try:
        results.append(search_cochrane(query, limit))
    except Exception as error:
        results.append({"source": "Cochrane Library", "status": "error", "message": str(error), "results": []})
    return {"query": query, "sources": results}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Recherche multi-sources sans scraping")
    parser.add_argument("query")
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()
    print(json.dumps(search_all(args.query, args.limit), ensure_ascii=False, indent=2))
