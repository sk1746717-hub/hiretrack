import unittest
from fastapi.testclient import TestClient
from app import app
from services.skill_gap_service import calculate_skill_gap

client = TestClient(app)

JOB_MERN = {
    "title": "MERN Stack Developer",
    "description": "Developer required with React, Node.js, MongoDB, AWS and Docker.",
    "requiredSkills": ["React", "Node.js", "MongoDB", "AWS", "Docker"]
}

CANDIDATE_PERFECT = {
    "resumeText": "Experienced Developer with React, Node.js, MongoDB, AWS, and Docker.",
    "skills": ["React", "Node.js", "MongoDB", "AWS", "Docker"]
}

CANDIDATE_PARTIAL = {
    "resumeText": "Developer with React, Node.js and MongoDB experience.",
    "skills": ["React", "Node.js", "MongoDB"]
}

CANDIDATE_NO_MATCH = {
    "resumeText": "Senior Accountant proficient in QuickBooks and Financial Auditing.",
    "skills": ["Accounting", "Finance"]
}

class TestSkillGapService(unittest.TestCase):

    def test_1_perfect_match(self):
        res = calculate_skill_gap(JOB_MERN, CANDIDATE_PERFECT)
        self.assertTrue(res["success"])
        self.assertEqual(res["skillMatchPercentage"], 100.0)
        self.assertEqual(res["skillGapPercentage"], 0.0)
        self.assertEqual(res["missingCount"], 0)
        print("[OK] Test 1 — Perfect match test passed (100% Match, 0% Gap)")

    def test_2_partial_match(self):
        res = calculate_skill_gap(JOB_MERN, CANDIDATE_PARTIAL)
        self.assertTrue(res["success"])
        self.assertEqual(res["skillMatchPercentage"], 60.0)
        self.assertEqual(res["skillGapPercentage"], 40.0)
        self.assertEqual(res["matchedCount"], 3)
        self.assertEqual(res["missingCount"], 2)
        print("[OK] Test 2 — Partial match test passed (60% Match, 40% Gap)")

    def test_3_no_match(self):
        res = calculate_skill_gap(JOB_MERN, CANDIDATE_NO_MATCH)
        self.assertTrue(res["success"])
        self.assertEqual(res["skillMatchPercentage"], 0.0)
        self.assertEqual(res["skillGapPercentage"], 100.0)
        self.assertEqual(res["matchedCount"], 0)
        print("[OK] Test 3 — No match test passed (0% Match, 100% Gap)")

    def test_4_exact_skill_matching(self):
        res = calculate_skill_gap(JOB_MERN, CANDIDATE_PARTIAL)
        self.assertIn("React", res["exactMatches"])
        self.assertIn("Node.js", res["exactMatches"])
        self.assertIn("MongoDB", res["exactMatches"])
        missing_names = [m["skill"] for m in res["missingSkills"]]
        self.assertIn("AWS", missing_names)
        self.assertIn("Docker", missing_names)
        print("[OK] Test 4 — Exact skill matching list verification passed")

    def test_5_duplicate_skill_handling(self):
        dup_candidate = {
            "resumeText": "React React React Node.js Node.js",
            "skills": ["React", "React", "Node.js", "Node.js"]
        }
        res = calculate_skill_gap(JOB_MERN, dup_candidate)
        self.assertEqual(len(res["exactMatches"]), len(set(res["exactMatches"])))
        print("[OK] Test 5 — Duplicate skill deduplication passed")

    def test_6_case_insensitivity(self):
        cand_lower = {"skills": ["react", "node.js", "mongodb"]}
        res = calculate_skill_gap(JOB_MERN, cand_lower)
        self.assertIn("React", res["exactMatches"])
        self.assertIn("Node.js", res["exactMatches"])
        print("[OK] Test 6 — Case insensitivity matching passed")

    def test_7_related_alias_skills(self):
        cand_alias = {"skills": ["React.js", "Node.js"]}
        res = calculate_skill_gap(JOB_MERN, cand_alias)
        self.assertIn("React", res["exactMatches"])
        print("[OK] Test 7 — Configured alias skill matching passed")

    def test_8_missing_skill_priority(self):
        res = calculate_skill_gap(JOB_MERN, CANDIDATE_PARTIAL)
        priorities = {m["skill"]: m["priority"] for m in res["missingSkills"]}
        self.assertIn("AWS", priorities)
        self.assertIn("Docker", priorities)
        self.assertIn(priorities["AWS"], ["High", "Medium", "Low"])
        print("[OK] Test 8 — Missing skill priority assignment passed")

    def test_9_resume_nlp_integration(self):
        cand_nlp = {"resumeText": "Developed scalable frontend apps in React and backend services in Node.js and MongoDB."}
        res = calculate_skill_gap(JOB_MERN, cand_nlp)
        self.assertIn("React", res["exactMatches"])
        self.assertIn("Node.js", res["exactMatches"])
        self.assertIn("MongoDB", res["exactMatches"])
        print("[OK] Test 9 — Phase 2 Resume NLP integration passed")

    def test_10_job_description_skill_extraction(self):
        job_no_req = {
            "title": "Full Stack Dev",
            "description": "Looking for React, Node.js, and PostgreSQL developer."
        }
        res = calculate_skill_gap(job_no_req, CANDIDATE_PARTIAL)
        self.assertGreater(res["totalRequiredSkills"], 0)
        self.assertIn("React", res["exactMatches"])
        print("[OK] Test 10 — Job description skill extraction passed")

    def test_11_empty_input_validation(self):
        response = client.post("/skill-gap", json={"job": {}, "candidate": {}})
        self.assertEqual(response.status_code, 400)
        print("[OK] Test 11 — Empty input validation (400) passed")

    def test_12_endpoint_integration(self):
        payload = {"job": JOB_MERN, "candidate": CANDIDATE_PARTIAL}
        response = client.post("/skill-gap", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["skillMatchPercentage"], 60.0)
        self.assertEqual(data["skillGapPercentage"], 40.0)
        print("[OK] Test 12 — FastAPI endpoint POST /skill-gap integration passed")

    def test_13_determinism_test(self):
        res1 = calculate_skill_gap(JOB_MERN, CANDIDATE_PARTIAL)
        res2 = calculate_skill_gap(JOB_MERN, CANDIDATE_PARTIAL)
        self.assertEqual(res1["skillMatchPercentage"], res2["skillMatchPercentage"])
        self.assertEqual(res1["skillGapPercentage"], res2["skillGapPercentage"])
        self.assertEqual(res1["exactMatches"], res2["exactMatches"])
        print("[OK] Test 13 — Skill gap determinism test passed")

if __name__ == "__main__":
    unittest.main()
