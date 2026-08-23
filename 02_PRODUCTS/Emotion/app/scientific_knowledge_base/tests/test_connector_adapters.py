import os
import unittest
from unittest.mock import patch
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import source_connectors


class ConnectorAdapterTests(unittest.TestCase):
    def test_sciencedirect_normalizes_official_payload(self):
        payload = {"search-results": {"entry": [{"dc:title": "Example", "prism:doi": "10.1234/example", "link": [{"@href": "https://www.sciencedirect.com/science/article/pii/example"}]}]}}
        with patch.dict(os.environ, {"ELSEVIER_API_KEY": "test-only"}, clear=True), patch.object(source_connectors, "http_json", return_value=payload):
            result = source_connectors.search_sciencedirect("emotion", limit=1)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["results"][0]["doi"], "10.1234/example")

    def test_institutional_json_adapter_normalizes_payload_without_exposing_key(self):
        payload = {"items": [{"title": "Example APA record", "doi": "10.1234/apa", "url": "https://institution.example/record/1"}]}
        env = {"APA_PSYNET_API_URL": "https://institution.example/api", "APA_PSYNET_API_KEY": "secret-test-only"}
        with patch.dict(os.environ, env, clear=True), patch.object(source_connectors, "http_json", return_value=payload) as mocked:
            result = source_connectors.search_apa_psycnet("emotion", limit=1)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["results"][0]["title"], "Example APA record")
        self.assertNotIn("secret-test-only", str(result))
        self.assertTrue(mocked.call_args.kwargs["headers"]["Authorization"].startswith("Bearer "))


if __name__ == "__main__":
    unittest.main()
