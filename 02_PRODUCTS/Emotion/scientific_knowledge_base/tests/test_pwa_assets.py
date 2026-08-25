import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class PwaAssetTests(unittest.TestCase):
    def test_manifest_and_service_worker_reference_existing_assets(self):
        manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["start_url"], "./")
        self.assertEqual(manifest["display"], "standalone")
        service_worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
        core = service_worker.split("const CORE = [", 1)[1].split("];", 1)[0]
        assets = re.findall(r"'([^']+)'", core)
        self.assertIn("./manifest.json", assets)
        self.assertIn("./scientific_knowledge_base/source_config.json", assets)
        missing = [asset for asset in assets if not (ROOT / asset.removeprefix("./")).exists()]
        self.assertEqual(missing, [])

    def test_application_registers_service_worker_over_http(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("navigator.serviceWorker.register('service-worker.js')", app)
        self.assertIn("location.protocol !== 'file:'", app)

    def test_application_exposes_breathing_safety_and_accessibility_contract(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")
        self.assertIn("exerciseBreathWarning", app)
        self.assertIn("Arrête immédiatement en cas de vertige", app)
        self.assertIn("emotionSentenceForm", app)
        self.assertIn('aria-live="polite"', app)
        self.assertIn("prefers-reduced-motion", css)
        self.assertIn("prefers-contrast", css)

    def test_browser_matrix_harness_covers_41_emotions_and_three_intensities(self):
        harness = (ROOT / "tests" / "browser-emotion-matrix.html").read_text(encoding="utf-8")
        self.assertIn("browser-test=1", harness)
        self.assertIn("const expectedCases = 41 * intensities.length", harness)
        self.assertIn("const intensities = [3, 5, 8]", harness)
        self.assertIn("emotions.length !== 41", harness)
        self.assertIn("cases !== expectedCases", harness)
        self.assertIn("#emotionInsight h3", harness)
        self.assertIn("#exerciseName", harness)

    def test_browser_privacy_harness_covers_reload_wrong_phrase_and_lock(self):
        harness = (ROOT / "tests" / "browser-privacy-encryption.html").read_text(encoding="utf-8")
        self.assertIn("privacy-test=1", harness)
        self.assertIn("phrase-perdue-inconnue", harness)
        self.assertIn("lockedAfterReload", harness)
        self.assertIn("wrongPhraseRejected", harness)
        self.assertIn("correctPhraseRestoredObservation", harness)

    def test_browser_screen_smoke_harness_covers_pages_and_mobile_contract(self):
        harness = (ROOT / "tests" / "browser-screen-smoke.html").read_text(encoding="utf-8")
        self.assertIn("#definitionPanel.open", harness)
        self.assertIn("professionalWarnings !== 1", harness)
        self.assertIn("libraryCards !== 15", harness)
        self.assertIn("noHorizontalOverflow", harness)
        self.assertIn("privacy", harness)


if __name__ == "__main__":
    unittest.main()
