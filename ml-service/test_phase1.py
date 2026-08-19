import sys
import unittest
from fastapi.testclient import TestClient

try:
    from app import app
except ImportError as e:
    print("Import Error:", e)
    sys.exit(1)

client = TestClient(app)

class TestPhase1Foundation(unittest.TestCase):
    def test_root_endpoint(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["service"], "HireTrack Python AIML Engine")
        print("[OK] Root endpoint test passed:", data["service"])

    def test_health_endpoint(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("uptime_seconds", data)
        self.assertIn("modules", data)
        print("[OK] Health check endpoint test passed:", data["status"])


if __name__ == "__main__":
    unittest.main()
