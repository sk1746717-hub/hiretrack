import unittest
from fastapi.testclient import TestClient
from app import app
from services.matching_service import compute_candidate_job_match, compute_semantic_similarity

client = TestClient(app)

JOB_MERN = {
    "title": "MERN Stack Developer",
    "description": "Looking for a developer experienced in React, Node.js, MongoDB and AWS.",
    "requiredSkills": ["React", "Node.js", "MongoDB", "AWS"]
}

CANDIDATE_STRONG = {
    "resumeText": "Experienced Senior Developer with expertise in React, Node.js, MongoDB, and AWS cloud deployment.",
    "skills": ["React", "Node.js", "MongoDB", "AWS"]
}

CANDIDATE_PARTIAL = {
    "resumeText": "Frontend Specialist skilled in React, Redux, HTML, and CSS.",
    "skills": ["React", "HTML", "CSS"]
}

CANDIDATE_LOW = {
    "resumeText": "Senior Financial Accountant with experience in Quickbooks, Excel, and Auditing.",
    "skills": ["Accounting", "Excel", "Finance"]
}

class TestMatchingService(unittest.TestCase):

    def test_1_strong_match(self):
        res = compute_candidate_job_match(JOB_MERN, CANDIDATE_STRONG)
        self.assertTrue(res["success"])
        self.assertGreaterEqual(res["matchScore"], 80.0)
        self.assertIn(res["recommendation"], ["Strong Match", "Good Match"])
        print("[OK] Test 1 — Strong Match test passed (Score:", res["matchScore"], ")")

    def test_2_partial_match(self):
        res = compute_candidate_job_match(JOB_MERN, CANDIDATE_PARTIAL)
        self.assertTrue(res["success"])
        self.assertLess(res["matchScore"], 80.0)
        self.assertGreater(res["matchScore"], 10.0)
        print("[OK] Test 2 — Partial Match test passed (Score:", res["matchScore"], ")")

    def test_3_low_match(self):
        res = compute_candidate_job_match(JOB_MERN, CANDIDATE_LOW)
        self.assertTrue(res["success"])
        self.assertLess(res["matchScore"], 40.0)
        self.assertEqual(res["recommendation"], "Low Match")
        print("[OK] Test 3 — Low Match test passed (Score:", res["matchScore"], ")")

    def test_4_skill_extraction_accuracy(self):
        res = compute_candidate_job_match(JOB_MERN, CANDIDATE_PARTIAL)
        self.assertIn("React", res["matchedSkills"])
        self.assertIn("MongoDB", res["missingSkills"])
        self.assertIn("AWS", res["missingSkills"])
        print("[OK] Test 4 — Skill extraction matched/missing skills accuracy passed")

    def test_5_semantic_similarity(self):
        sim = compute_semantic_similarity("Python React developer", "Python React web software engineer")
        self.assertGreaterEqual(sim, 0.0)
        self.assertLessEqual(sim, 100.0)
        self.assertGreater(sim, 20.0)
        print("[OK] Test 5 — TF-IDF Cosine Similarity test passed (Sim:", sim, "%)")


    def test_6_weighted_score_formula(self):
        res = compute_candidate_job_match(JOB_MERN, CANDIDATE_STRONG)
        expected = round((0.60 * res["skillMatchPercentage"]) + (0.40 * res["semanticSimilarityPercentage"]), 1)
        self.assertEqual(res["matchScore"], expected)
        print("[OK] Test 6 — 60/40 Weighted scoring formula test passed")

    def test_7_duplicate_skills_deduplication(self):
        dup_candidate = {
            "resumeText": "React React React Node.js Node.js",
            "skills": ["React", "React", "Node.js", "Node.js"]
        }
        res = compute_candidate_job_match(JOB_MERN, dup_candidate)
        # Check matchedSkills list does not contain duplicate entries
        self.assertEqual(len(res["matchedSkills"]), len(set(res["matchedSkills"])))
        print("[OK] Test 7 — Skill deduplication test passed")

    def test_8_case_insensitivity(self):
        cand1 = {"skills": ["React", "Node.js"]}
        cand2 = {"skills": ["react", "node.js"]}
        res1 = compute_candidate_job_match(JOB_MERN, cand1)
        res2 = compute_candidate_job_match(JOB_MERN, cand2)
        self.assertEqual(res1["matchedSkills"], res2["matchedSkills"])
        print("[OK] Test 8 — Case insensitivity test passed")

    def test_9_empty_input_validation(self):
        response = client.post("/match-candidate", json={"job": {}, "candidate": {}})
        self.assertEqual(response.status_code, 400)
        print("[OK] Test 9 — Empty input validation (400) test passed")

    def test_10_endpoint_integration(self):
        payload = {"job": JOB_MERN, "candidate": CANDIDATE_STRONG}
        response = client.post("/match-candidate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("matchScore", data)
        self.assertIn("method", data)
        print("[OK] Test 10 — FastAPI endpoint POST /match-candidate integration passed")

    def test_11_determinism_test(self):
        res1 = compute_candidate_job_match(JOB_MERN, CANDIDATE_STRONG)
        res2 = compute_candidate_job_match(JOB_MERN, CANDIDATE_STRONG)
        self.assertEqual(res1["matchScore"], res2["matchScore"])
        self.assertEqual(res1["skillMatchPercentage"], res2["skillMatchPercentage"])
        self.assertEqual(res1["semanticSimilarityPercentage"], res2["semanticSimilarityPercentage"])
        print("[OK] Test 11 — Score determinism test passed")

if __name__ == "__main__":
    unittest.main()
