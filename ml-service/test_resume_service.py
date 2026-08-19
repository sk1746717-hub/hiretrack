import os
import unittest
from fastapi.testclient import TestClient
from app import app
from services.resume_service import analyze_resume

client = TestClient(app)

SAMPLE_RESUME_TEXT = """
JANE DOE
jane.doe@example.com | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Full Stack Engineer with 5+ years experience in Python, Java, React, Node.js, MongoDB, and AWS.

SKILLS
Programming Languages: Java, Python, JavaScript, TypeScript
Frameworks & Cloud: React, Node.js, Express, MongoDB, AWS, Docker

EXPERIENCE
Senior Software Engineer | Acme Corporation | 2021 – Present
- Developed scalable microservices using Python, React, Node.js, and MongoDB on AWS.

EDUCATION
Master of Science in Computer Science | Stanford University | 2019

PROJECTS
Smart ATS Engine | Python, React, Scikit-Learn
- Built candidate match scoring pipeline.

CERTIFICATIONS
- AWS Certified Solutions Architect – Associate
- Certified ScrumMaster (CSM)
"""

class TestResumeIntelligenceService(unittest.TestCase):

    def test_1_technical_resume_skills(self):
        result = analyze_resume(SAMPLE_RESUME_TEXT)
        skills = result["skills"]
        
        # Check programming languages & frameworks
        all_found = []
        for cat in skills.values():
            all_found.extend(cat)

        self.assertIn("Python", all_found)
        self.assertIn("Java", all_found)
        self.assertIn("React", all_found)
        self.assertIn("Node.js", all_found)
        self.assertIn("MongoDB", all_found)
        self.assertIn("AWS", all_found)
        print("[OK] Test 1 — Technical resume skill detection passed")

    def test_2_education_extraction(self):
        result = analyze_resume(SAMPLE_RESUME_TEXT)
        education = result["education"]
        self.assertTrue(len(education) > 0)
        self.assertTrue(any("Master" in ed["degree"] for ed in education))
        print("[OK] Test 2 — Education degree & institution detection passed")

    def test_3_experience_extraction(self):
        result = analyze_resume(SAMPLE_RESUME_TEXT)
        experience = result["experience"]
        self.assertTrue(len(experience) > 0)
        self.assertTrue(any("Senior Software Engineer" in exp["title"] for exp in experience))
        print("[OK] Test 3 — Experience job title detection passed")

    def test_4_projects_extraction(self):
        result = analyze_resume(SAMPLE_RESUME_TEXT)
        projects = result["projects"]
        self.assertTrue(len(projects) > 0)
        print("[OK] Test 4 — Projects extraction passed")

    def test_5_certifications_extraction(self):
        result = analyze_resume(SAMPLE_RESUME_TEXT)
        certs = result["certifications"]
        self.assertTrue(len(certs) > 0)
        self.assertTrue(any("AWS Certified" in c for c in certs))
        print("[OK] Test 5 — Certifications extraction passed")

    def test_6_empty_input_validation(self):
        response = client.post("/analyze-resume", json={"resumeText": "   "})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)
        print("[OK] Test 6 — Empty input validation (400 error) passed")

    def test_7_missing_sections(self):
        partial_resume = """
        SKILLS: Python, React, SQL
        EDUCATION: Bachelor of Science in Computer Science, UC Berkeley 2020
        """
        result = analyze_resume(partial_resume)
        self.assertIn("skills", result)
        self.assertIn("education", result)
        self.assertEqual(result["processingMethod"], "NLP")
        print("[OK] Test 7 — Partial resume missing sections handling passed")

    def test_8_endpoint_integration(self):
        response = client.post("/analyze-resume", json={"resumeText": SAMPLE_RESUME_TEXT})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("analysis", data)
        print("[OK] Test 8 — FastAPI endpoint POST /analyze-resume integration passed")

if __name__ == "__main__":
    unittest.main()
