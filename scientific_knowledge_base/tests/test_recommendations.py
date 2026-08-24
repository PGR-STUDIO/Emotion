#!/usr/bin/env python3
"""Tests data-driven des cinq cas de recommandation scientifique."""
import json
import re
import unicodedata
import unittest
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data"


def norm(value):
    value = unicodedata.normalize("NFD", str(value).lower())
    return "".join(char for char in value if unicodedata.category(char) != "Mn")


RULES = json.loads((DATA / "recommendation_rules.json").read_text(encoding="utf-8"))
SAFETY = json.loads((DATA / "safety_protocol.json").read_text(encoding="utf-8"))
EXERCISES = {item["id"] for item in json.loads((DATA / "exercises.json").read_text(encoding="utf-8"))}


def triage(text):
    value = norm(text)
    return [flag for flag in SAFETY["red_flags"] if any(norm(pattern) in value for pattern in flag["patterns"])]


def recommend(emotion, intensity, situation):
    risk = triage(situation)
    if risk:
        return {"rule": "SAFETY-FIRST", "risk": risk, "recommend": []}
    for rule in sorted(RULES["machine_rules"], key=lambda item: item.get("priority", 0), reverse=True):
        condition = rule.get("when", {})
        if condition.get("requires_safe"):
            continue
        if "min_intensity" in condition and intensity < condition["min_intensity"]:
            continue
        if "max_intensity" in condition and intensity > condition["max_intensity"]:
            continue
        if condition.get("emotions") and emotion not in condition["emotions"]:
            continue
        return {"rule": rule["id"], "risk": [], "recommend": rule.get("recommend", []), "professional_option": rule.get("professional_option")}
    return {"rule": "FALLBACK-JOURNAL", "risk": [], "recommend": ["EX-EMOTION-JOURNAL"]}


class RecommendationTests(unittest.TestCase):
    def test_all_rule_exercise_ids_exist(self):
        references = []
        for rule in RULES["machine_rules"]:
            references.extend(rule.get("recommend", []))
            references.extend(rule.get("avoid", []))
            if rule.get("professional_option"):
                references.append(rule["professional_option"])
        self.assertFalse(set(references) - EXERCISES, set(references) - EXERCISES)

    def test_tc01_anger_high(self):
        result = recommend("Colère", 9, "Je veux répondre immédiatement après une injustice.")
        self.assertEqual(result["rule"], "MR-HIGH-INTENSITY")
        self.assertEqual(result["recommend"][:2], ["EX-GROUNDING-321", "EX-DELAY-URGE"])

    def test_tc02_fear_medium(self):
        result = recommend("Peur", 6, "Je dois parler demain, je vais échouer.")
        self.assertEqual(result["rule"], "MR-FEAR-ANXIETY")
        self.assertEqual(result["recommend"][:2], ["EX-GROUNDING-321", "EX-COGNITIVE-RESTRUCTURING"])

    def test_tc03_sadness(self):
        result = recommend("Tristesse", 7, "Je suis isolé après une rupture.")
        self.assertEqual(result["rule"], "MR-SADNESS")
        self.assertIn("EX-NEEDS-IDENTIFICATION", result["recommend"])

    def test_tc04_immediate_danger_is_safety_first(self):
        result = recommend("Peur", 9, "Je suis en danger immédiat.")
        self.assertEqual(result["rule"], "SAFETY-FIRST")
        self.assertTrue(result["risk"])
        self.assertEqual(result["recommend"], [])

    def test_tc05_anxiety_recommends_professional_option(self):
        result = recommend("Anxiété", 7, "Je vérifie sans cesse une porte.")
        self.assertEqual(result["rule"], "MR-FEAR-ANXIETY")
        self.assertEqual(result["professional_option"], "EX-GRADED-EXPOSURE")
        self.assertNotIn("EX-GRADED-EXPOSURE", result["recommend"])

    def test_low_stress_prefers_short_breathing(self):
        result = recommend("Stress", 3, "Je sens une tension légère.")
        self.assertEqual(result["rule"], "MR-LOW-ANXIETY")
        self.assertEqual(result["recommend"][0], "EX-MINDFUL-BREATHING")


if __name__ == "__main__":
    unittest.main()
