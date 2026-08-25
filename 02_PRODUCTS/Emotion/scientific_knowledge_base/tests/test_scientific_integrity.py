import json
import os
import re
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
sys.path.insert(0, str(ROOT))


class ScientificIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.studies = json.loads((DATA / "studies.json").read_text(encoding="utf-8"))
        cls.exercises = json.loads((DATA / "exercises.json").read_text(encoding="utf-8"))
        cls.rules = json.loads((DATA / "recommendation_rules.json").read_text(encoding="utf-8"))
        cls.emotion_exercise_map = json.loads((DATA / "emotion_exercise_map.json").read_text(encoding="utf-8"))

    def test_full_text_status_accounts_for_every_study(self):
        statuses = [study.get("full_text_extraction_status") for study in self.studies]
        self.assertTrue(all(statuses), "Chaque étude doit expliciter son statut d'extraction intégrale")
        extracted = [study for study in self.studies if study["full_text_extraction_status"] == "pmc_full_text_xml_verified"]
        self.assertGreaterEqual(len(extracted), 10)
        for study in extracted:
            extraction = study.get("full_text_extraction", {})
            self.assertTrue(extraction.get("pmc_id"))
            self.assertTrue(extraction.get("sections"))
            self.assertGreater(extraction.get("character_count", 0), 500)
            self.assertTrue(extraction.get("pmc_url", "").startswith("https://pmc.ncbi.nlm.nih.gov/"))

    def test_exercise_and_rule_references_are_closed(self):
        study_ids = {study["id"] for study in self.studies}
        exercise_ids = {exercise["id"] for exercise in self.exercises}
        for exercise in self.exercises:
            self.assertTrue(set(exercise.get("associated_studies", [])) <= study_ids, exercise["id"])
        for rule in self.rules.get("machine_rules", []):
            self.assertTrue(set(rule.get("recommend", [])) <= exercise_ids, rule["id"])

    def test_each_mapped_emotion_has_an_exercise_by_intensity(self):
        exercise_ids = {exercise["id"] for exercise in self.exercises}
        by_id = {exercise["id"]: exercise for exercise in self.exercises}
        mappings = self.emotion_exercise_map["mappings"]
        self.assertEqual(len(mappings), 41)
        self.assertEqual(len({item["emotion"] for item in mappings}), 41)
        matrix_rows = 0
        for mapping in mappings:
            for intensity in (2, 5, 8):
                exercise_id = mapping.get("high_intensity_exercise_id", mapping["exercise_id"]) if intensity >= 8 else mapping["exercise_id"]
                self.assertIn(exercise_id, exercise_ids, mapping["emotion"])
                source = by_id[exercise_id]
                numbers = [int(item) for item in re.findall(r"\d+", source.get("duration", ""))]
                self.assertTrue(numbers, mapping["emotion"])
                minimum = numbers[0] * (60 if "minute" in source["duration"] else 1)
                maximum = (numbers[1] if len(numbers) > 1 else numbers[0]) * (60 if "minute" in source["duration"] else 1)
                duration = minimum if intensity <= 3 else round((minimum + maximum) / 2) if intensity <= 7 else min(maximum, max(minimum, 90))
                self.assertGreaterEqual(duration, 30, mapping["emotion"])
                matrix_rows += 1
        self.assertEqual(matrix_rows, 123)

    def test_emotion_guidance_is_complete(self):
        guidance = json.loads((DATA / "emotion_guidance.json").read_text(encoding="utf-8"))
        entries = guidance["emotions"]
        self.assertEqual(len(entries), 41)
        self.assertEqual(len({entry["name"] for entry in entries}), 41)
        for entry in entries:
            for field in ("triggers", "body", "impulse"):
                self.assertGreaterEqual(len(entry.get(field, [])), 2, entry["name"])
            for field in ("response", "exercise", "safety"):
                self.assertTrue(entry.get(field), entry["name"])

    def test_every_exercise_exposes_guidance_and_safety_fields(self):
        for exercise in self.exercises:
            self.assertTrue(exercise.get("objective"), exercise["id"])
            self.assertGreaterEqual(len(exercise.get("protocol_steps", [])), 3, exercise["id"])
            self.assertTrue(exercise.get("contraindications"), exercise["id"])
            self.assertTrue(exercise.get("associated_studies"), exercise["id"])
            self.assertIn(exercise.get("evidence_grade"), {"A", "B", "C", "D"}, exercise["id"])

    def test_unconfigured_official_connectors_are_explicit(self):
        import source_connectors
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(source_connectors, "search_pubmed", return_value={"source": "PubMed", "status": "ok", "results": []}):
                result = source_connectors.search_all("emotion regulation", limit=1)
        by_source = {item["source"]: item for item in result["sources"]}
        self.assertEqual(by_source["ScienceDirect"]["status"], "not_configured")
        self.assertEqual(by_source["APA PsycNet"]["status"], "not_configured")
        self.assertEqual(by_source["Cochrane Library"]["status"], "not_configured")
        self.assertTrue(all(not item.get("results") for item in by_source.values() if item["source"] != "PubMed"))

    def test_configured_institutional_adapter_requires_https(self):
        import source_connectors
        env = {"APA_PSYNET_API_URL": "http://institution.example/api", "APA_PSYNET_API_KEY": "test-only"}
        with patch.dict(os.environ, env, clear=True):
            result = source_connectors.search_apa_psycnet("emotion regulation", limit=1)
        self.assertEqual(result["status"], "invalid_configuration")
        self.assertEqual(result["results"], [])


if __name__ == "__main__":
    unittest.main()
