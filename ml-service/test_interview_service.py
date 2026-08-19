import unittest
from fastapi.testclient import TestClient
from app import app
from services.interview_intelligence_service import analyze_interview

client = TestClient(app)

JOB_MERN = {
    "title": "MERN Stack Developer",
    "description": "Developer required with React, Node.js, MongoDB, AWS and Docker.",
    "requiredSkills": ["React", "Node.js", "MongoDB", "AWS", "Docker"]
}

CANDIDATE = {
    "resumeText": "Developer with React, Node.js and MongoDB experience.",
    "skills": ["React", "Node.js", "MongoDB"]
}

STRONG_INTERVIEW_DATA = {
    "technicalScore": 90.0,
    "communicationScore": 85.0,
    "problemSolvingScore": 90.0,
    "assessmentScore": 92.0,
    "interviewNotes": "Candidate demonstrated strong mastery in core React component architecture and Node.js microservices. Solved the system design probe efficiently.",
    "technicalProbesAnswered": ["React state management", "Node.js event loop", "MongoDB indexing"]
}

LOW_INTERVIEW_DATA = {
    "technicalScore": 40.0,
    "communicationScore": 50.0,
    "problemSolvingScore": 35.0,
    "assessmentScore": 45.0,
    "interviewNotes": "Candidate struggled with basic Node.js event loop concepts and could not answer React state lifecycle questions.",
    "technicalProbesAnswered": []
}

class TestInterviewIntelligenceService(unittest.TestCase):

    def test_1_strong_candidate_interview(self):
        res = analyze_interview(JOB_MERN, CANDIDATE, STRONG_INTERVIEW_DATA)
        self.assertTrue(res["success"])
        self.assertGreaterEqual(res["overallInterviewScore"], 75.0)
        self.assertIn(res["recommendation"], ["Strongly Recommend Hire", "Recommend Hire"])
        print("[OK] Test 1 — Strong candidate interview evaluation passed (Score:", res["overallInterviewScore"], ")")

    def test_2_low_candidate_interview(self):
        res = analyze_interview(JOB_MERN, CANDIDATE, LOW_INTERVIEW_DATA)
        self.assertTrue(res["success"])
        self.assertLess(res["overallInterviewScore"], 60.0)
        self.assertEqual(res["recommendation"], "Not Recommended")
        print("[OK] Test 2 — Low candidate interview evaluation passed (Score:", res["overallInterviewScore"], ")")

    def test_3_skill_coverage_analysis(self):
        res = analyze_interview(JOB_MERN, CANDIDATE, STRONG_INTERVIEW_DATA)
        cov = res["skillCoverage"]
        self.assertIn("React", cov["coveredSkills"])
        self.assertIn("Node.js", cov["coveredSkills"])
        self.assertIn("MongoDB", cov["coveredSkills"])
        self.assertIn("AWS", cov["notDemonstratedSkills"])
        print("[OK] Test 3 — Skill coverage analysis passed")

    def test_4_strengths_weaknesses_extraction(self):
        res = analyze_interview(JOB_MERN, CANDIDATE, STRONG_INTERVIEW_DATA)
        self.assertTrue(len(res["strengths"]) > 0)
        self.assertTrue(len(res["weaknesses"]) > 0)
        print("[OK] Test 4 — Strengths and weaknesses extraction passed")

    def test_5_competency_level(self):
        res_strong = analyze_interview(JOB_MERN, CANDIDATE, STRONG_INTERVIEW_DATA)
        self.assertEqual(res_strong["technicalCompetencyLevel"], "Expert")

        res_low = analyze_interview(JOB_MERN, CANDIDATE, LOW_INTERVIEW_DATA)
        self.assertEqual(res_low["technicalCompetencyLevel"], "Basic")
        print("[OK] Test 5 — Technical competency level assignment passed")

    def test_6_partial_interview_data(self):
        partial_data = {"interviewNotes": "React and Node.js skills confirmed."}
        res = analyze_interview(JOB_MERN, CANDIDATE, partial_data)
        self.assertTrue(res["success"])
        self.assertIn("overallInterviewScore", res)
        print("[OK] Test 6 — Partial interview data handling passed")

    def test_7_empty_input_validation(self):
        res = analyze_interview({}, {}, {})
        self.assertTrue(res["success"])
        self.assertIn("overallInterviewScore", res)
        print("[OK] Test 7 — Default empty dictionary handling passed")

    def test_8_endpoint_integration(self):
        payload = {
            "job": JOB_MERN,
            "candidate": CANDIDATE,
            "interviewData": STRONG_INTERVIEW_DATA
        }
        response = client.post("/interview-analysis", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("overallInterviewScore", data)
        self.assertIn("skillCoverage", data)
        print("[OK] Test 8 — FastAPI endpoint POST /interview-analysis integration passed")

    def test_9_interview_determinism(self):
        res1 = analyze_interview(JOB_MERN, CANDIDATE, STRONG_INTERVIEW_DATA)
        res2 = analyze_interview(JOB_MERN, CANDIDATE, STRONG_INTERVIEW_DATA)
        self.assertEqual(res1["overallInterviewScore"], res2["overallInterviewScore"])
        self.assertEqual(res1["technicalCompetencyLevel"], res2["technicalCompetencyLevel"])
        print("[OK] Test 9 — Interview analysis determinism test passed")

if __name__ == "__main__":
    unittest.main()
