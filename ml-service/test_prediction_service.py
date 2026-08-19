import os
import unittest
from fastapi.testclient import TestClient
from app import app
from services.prediction_service import predict_candidate_success

client = TestClient(app)

HIGH_CANDIDATE_FEATURES = {
    "skillMatchPercentage": 90.0,
    "semanticSimilarityPercentage": 85.0,
    "relevantExperienceYears": 5.0,
    "interviewScore": 88.0,
    "assessmentScore": 92.0,
    "requiredSkillsMatched": 5,
    "totalRequiredSkills": 5,
    "skillGapPercentage": 10.0
}

LOW_CANDIDATE_FEATURES = {
    "skillMatchPercentage": 15.0,
    "semanticSimilarityPercentage": 10.0,
    "relevantExperienceYears": 0.5,
    "interviewScore": 30.0,
    "assessmentScore": 25.0,
    "requiredSkillsMatched": 1,
    "totalRequiredSkills": 5,
    "skillGapPercentage": 85.0
}

class TestCandidateSuccessPredictionService(unittest.TestCase):

    def test_1_prediction_structure(self):
        res = predict_candidate_success(HIGH_CANDIDATE_FEATURES)
        self.assertTrue(res["success"])
        self.assertIn("prediction", res)
        self.assertIn("successProbabilityPercentage", res)
        self.assertIn("suitabilityLevel", res)
        self.assertIn("featureImportances", res)
        self.assertEqual(res["modelType"], "RandomForestClassifier")
        print("[OK] Test 1 — Prediction structure test passed")

    def test_2_high_suitability_prediction(self):
        res = predict_candidate_success(HIGH_CANDIDATE_FEATURES)
        self.assertEqual(res["prediction"], 1)
        self.assertGreaterEqual(res["successProbabilityPercentage"], 60.0)
        self.assertIn(res["suitabilityLevel"], ["High Suitability", "Moderate Suitability"])
        print("[OK] Test 2 — High suitability prediction test passed (Prob:", res["successProbabilityPercentage"], "%)")

    def test_3_low_suitability_prediction(self):
        res = predict_candidate_success(LOW_CANDIDATE_FEATURES)
        self.assertEqual(res["prediction"], 0)
        self.assertLess(res["successProbabilityPercentage"], 50.0)
        self.assertEqual(res["suitabilityLevel"], "Low Suitability")
        print("[OK] Test 3 — Low suitability prediction test passed (Prob:", res["successProbabilityPercentage"], "%)")

    def test_4_feature_importance_sorting(self):
        res = predict_candidate_success(HIGH_CANDIDATE_FEATURES)
        importances = res["featureImportances"]
        self.assertTrue(len(importances) > 0)
        # Check sorted descending
        imp_values = [item["importance"] for item in importances]
        self.assertEqual(imp_values, sorted(imp_values, reverse=True))
        print("[OK] Test 4 — Feature importance sorting test passed (Top feature:", importances[0]["feature"], ")")

    def test_5_disclaimer_presence(self):
        res = predict_candidate_success(HIGH_CANDIDATE_FEATURES)
        self.assertIn("disclaimer", res)
        self.assertIn("synthetic", res["disclaimer"].lower())
        self.assertEqual(res["datasetType"], "Synthetic development/demo dataset")
        print("[OK] Test 5 — Synthetic dataset disclaimer test passed")

    def test_6_invalid_out_of_bounds_validation(self):
        invalid_payload = dict(HIGH_CANDIDATE_FEATURES)
        invalid_payload["skillMatchPercentage"] = 150.0  # > 100
        response = client.post("/predict-success", json=invalid_payload)
        self.assertEqual(response.status_code, 400)
        print("[OK] Test 6 — Out of bounds feature validation (400) test passed")

    def test_7_endpoint_integration(self):
        response = client.post("/predict-success", json=HIGH_CANDIDATE_FEATURES)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("successProbabilityPercentage", data)
        print("[OK] Test 7 — FastAPI endpoint POST /predict-success integration passed")

    def test_8_prediction_determinism(self):
        res1 = predict_candidate_success(HIGH_CANDIDATE_FEATURES)
        res2 = predict_candidate_success(HIGH_CANDIDATE_FEATURES)
        self.assertEqual(res1["prediction"], res2["prediction"])
        self.assertEqual(res1["successProbabilityPercentage"], res2["successProbabilityPercentage"])
        print("[OK] Test 8 — Prediction determinism test passed")

if __name__ == "__main__":
    unittest.main()
