#!/usr/bin/env python3
"""Audit machine-readable de l'objectif v0.5.

Le mode normal décrit les éléments passés et partiels. ``--strict`` renvoie un
code non nul tant que les textes intégrals et les accès institutionnels ne sont
pas disponibles, ce qui empêche de déclarer prématurément l'objectif terminé.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from datetime import date
from pathlib import Path

KB = Path(__file__).resolve().parents[1]
APP = KB.parent
DATA = KB / "data"


def result(name: str, status: str, details: str) -> dict:
    return {"requirement": name, "status": status, "details": details}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    checks: list[dict] = []

    app_js = APP / "app.js"
    node = subprocess.run(["node", "--check", str(app_js)], capture_output=True, text=True)
    checks.append(result("JavaScript syntax", "passed" if node.returncode == 0 else "failed", node.stderr.strip() or "node --check OK"))

    json_files = list(DATA.glob("*.json")) + list((KB / "audits").glob("*.json")) + [KB / "manifest.json", KB / "source_config.json", KB / "schemas/study.schema.json"]
    invalid = []
    for path in json_files:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:
            invalid.append(f"{path.name}: {error}")
    checks.append(result("JSON integrity", "passed" if not invalid else "failed", "Tous les JSON sont valides." if not invalid else "; ".join(invalid)))

    tests = subprocess.run(["python3", "-m", "unittest", "discover", "-s", str(KB / "tests"), "-q"], capture_output=True, text=True)
    checks.append(result("Automated tests", "passed" if tests.returncode == 0 else "failed", (tests.stdout + tests.stderr).strip()))

    studies = json.loads((DATA / "studies.json").read_text(encoding="utf-8"))
    exercises = json.loads((DATA / "exercises.json").read_text(encoding="utf-8"))
    rules = json.loads((DATA / "recommendation_rules.json").read_text(encoding="utf-8"))
    study_ids = {item["id"] for item in studies}
    exercise_ids = {item["id"] for item in exercises}
    closed_refs = all(set(item.get("associated_studies", [])) <= study_ids for item in exercises) and all(set(item.get("recommend", [])) <= exercise_ids for item in rules.get("machine_rules", []))
    checks.append(result("Rules and scientific references", "passed" if closed_refs else "failed", f"{len(exercises)} exercices, {len(studies)} études, références fermées={closed_refs}"))

    full_text = [item for item in studies if item.get("full_text_extraction_status") == "pmc_full_text_xml_verified"]
    pending = len(studies) - len(full_text)
    checks.append(result("Full-text extraction", "passed" if pending == 0 else "partial", f"{len(full_text)}/{len(studies)} études ont une extraction PMC vérifiée ; {pending} restent à obtenir ou revoir."))

    connector_env = ["ELSEVIER_API_KEY", "APA_PSYNET_API_URL", "APA_PSYNET_API_KEY", "COCHRANE_API_URL", "COCHRANE_API_KEY"]
    configured = [name for name in connector_env if os.getenv(name)]
    checks.append(result("Official live connectors", "passed" if len(configured) == len(connector_env) else "partial", f"Variables configurées={configured}; aucune valeur n'est enregistrée par l'audit."))

    sw = (APP / "service-worker.js").read_text(encoding="utf-8")
    core = sw.split("const CORE = [", 1)[1].split("];", 1)[0]
    assets = re.findall(r"'([^']+)'", core)
    missing = [asset for asset in assets if not (APP / asset.removeprefix("./")).exists()]
    checks.append(result("PWA asset contract", "passed" if not missing else "failed", f"{len(assets)} ressources précachées, manquantes={missing}"))

    privacy_contract = all(token in app_js.read_text(encoding="utf-8") for token in ["crypto.subtle", "SECURE_KEY", "privacyDelete", "privacyExport"])
    checks.append(result("Local privacy and deletion", "passed" if privacy_contract else "failed", "Chiffrement, export et suppression présents." if privacy_contract else "Contrat de confidentialité incomplet."))

    overall = "passed" if all(item["status"] == "passed" for item in checks) else "partial" if all(item["status"] != "failed" for item in checks) else "failed"
    report = {"date": date.today().isoformat(), "version": "0.7.1", "overall": overall, "checks": checks}
    if args.write:
        output = KB / "audits" / f"completion_gate_{date.today().isoformat()}.json"
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        report["written_to"] = str(output)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 2 if args.strict and overall != "passed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
