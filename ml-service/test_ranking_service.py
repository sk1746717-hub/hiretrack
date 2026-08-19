import unittest
from fastapi.testclient import TestClient
from app import app
from services.ranking_service import rank_candidates

client = TestClient(app)

JOB = {
    "title": "MERN Stack Developer",
    "description": "Looking for a developer experienced in React, Node.js, MongoDB and AWS.",
    "requiredSkills": ["React", "Node.js", "MongoDB", "AWS"]
}

CANDIDATES = [
    {
        "id": "cand-1",
        "name": "Candidate A (Strong)",
        "resumeText": "Senior Full Stack Engineer proficient in React, Node.js, MongoDB, and AWS cloud architecture.",
        "skills": ["React", "Node.js", "MongoDB", "AWS"]
    },
    {
        "id": "cand-2",
        "name": "Candidate B (Partial)",
        "resumeText": "Frontend Developer skilled in React, Redux, HTML, and CSS.",
        "skills": ["React", "HTML", "CSS"]
    },
    {
        "id": "cand-3",
        "name": "Candidate C (Low)",
        "resumeText": "Financial Analyst experienced in Accounting, Excel, and Auditing.",
        "skills": ["Accounting", "Excel", "Finance"]
    }
]

class TestRankingService(unittest.TestCase):

    def test_1_ranking_order(self):
        res = rank_candidates(JOB, CANDIDATES)
        self.assertTrue(res["success"])
        ranked = res["rankedCandidates"]
        self.assertEqual(len(ranked), 3)

        self.assertEqual(ranked[0]["rank"], 1)
        self.assertEqual(ranked[0]["candidateId"], "cand-1")

        self.assertEqual(ranked[1]["rank"], 2)
        self.assertEqual(ranked[1]["candidateId"], "cand-2")

        self.assertEqual(ranked[2]["rank"], 3)
        self.assertEqual(ranked[2]["candidateId"], "cand-3")
        print("[OK] Test 1 — Ranking order test passed (Rank 1:", ranked[0]["candidateName"], ")")

    def test_2_phase3_matching_integration(self):
        res = rank_candidates(JOB, CANDIDATES)
        cand1 = res["rankedCandidates"][0]
        self.assertIn("matchedSkills", cand1)
        self.assertIn("missingSkills", cand1)
        self.assertIn("recommendation", cand1)
        self.assertIn("featureContribution", cand1)
        print("[OK] Test 2 — Phase 3 matching engine integration test passed")

    def test_3_ranking_score_breakdown(self):
        res = rank_candidates(JOB, CANDIDATES)
        for item in res["rankedCandidates"]:
            self.assertIn("matchScore", item)
            self.assertIn("skillMatchPercentage", item)
            self.assertIn("semanticSimilarityPercentage", item)
            self.assertIn("rankingBasis", item["featureContribution"])
        print("[OK] Test 3 — Ranking score component breakdown test passed")

    def test_4_tie_handling(self):
        tie_candidates = [
            {
                "id": "c1",
                "name": "Identical Cand 1",
                "resumeText": "React Node.js MongoDB AWS developer",
                "skills": ["React", "Node.js", "MongoDB", "AWS"]
            },
            {
                "id": "c2",
                "name": "Identical Cand 2",
                "resumeText": "React Node.js MongoDB AWS developer",
                "skills": ["React", "Node.js", "MongoDB", "AWS"]
            }
        ]
        res = rank_candidates(JOB, tie_candidates)
        ranked = res["rankedCandidates"]
        self.assertEqual(ranked[0]["rank"], 1)
        self.assertEqual(ranked[1]["rank"], 2)
        self.assertEqual(ranked[0]["candidateId"], "c1") # Input order preserved
        print("[OK] Test 4 — Deterministic tie-breaking test passed")

    def test_5_statistics_calculation(self):
        res = rank_candidates(JOB, CANDIDATES)
        stats = res["statistics"]
        self.assertEqual(stats["totalCandidates"], 3)
        self.assertGreater(stats["highestMatchScore"], stats["lowestMatchScore"])
        self.assertEqual(
            stats["totalCandidates"],
            stats["strongMatches"] + stats["goodMatches"] + stats["moderateMatches"] + stats["lowMatches"]
        )
        print("[OK] Test 5 — Aggregate statistics calculation test passed (Avg:", stats["averageMatchScore"], ")")

    def test_6_single_candidate(self):
        res = rank_candidates(JOB, [CANDIDATES[0]])
        self.assertEqual(res["totalCandidates"], 1)
        self.assertEqual(res["rankedCandidates"][0]["rank"], 1)
        print("[OK] Test 6 — Single candidate ranking test passed")

    def test_7_empty_candidate_list_validation(self):
        response = client.post("/rank-candidates", json={"job": JOB, "candidates": []})
        self.assertEqual(response.status_code, 400)
        print("[OK] Test 7 — Empty candidates validation (400) test passed")

    def test_8_duplicate_ids_validation(self):
        dup_candidates = [
            {"id": "cand-dup", "resumeText": "React developer", "skills": ["React"]},
            {"id": "cand-dup", "resumeText": "Node developer", "skills": ["Node.js"]}
        ]
        response = client.post("/rank-candidates", json={"job": JOB, "candidates": dup_candidates})
        self.assertEqual(response.status_code, 400)
        print("[OK] Test 8 — Duplicate IDs validation (400) test passed")

    def test_9_ranking_determinism(self):
        res1 = rank_candidates(JOB, CANDIDATES)
        res2 = rank_candidates(JOB, CANDIDATES)
        self.assertEqual(
            [c["candidateId"] for c in res1["rankedCandidates"]],
            [c["candidateId"] for c in res2["rankedCandidates"]]
        )
        self.assertEqual(
            [c["matchScore"] for c in res1["rankedCandidates"]],
            [c["matchScore"] for c in res2["rankedCandidates"]]
        )
        print("[OK] Test 9 — Ranking determinism test passed")

    def test_10_endpoint_integration(self):
        payload = {"job": JOB, "candidates": CANDIDATES}
        response = client.post("/rank-candidates", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["totalCandidates"], 3)
        self.assertIn("statistics", data)
        print("[OK] Test 10 — FastAPI endpoint POST /rank-candidates integration passed")

if __name__ == "__main__":
    unittest.main()
