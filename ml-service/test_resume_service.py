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
Programming Languages: Java, Python, JavaScript, TypeScript, HTML5, CSS3
Frameworks & Cloud: React, Node.js, Express, MongoDB, AWS, Docker, Chart.js, Tailwind CSS

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

REAL_RESUME_FORMAT_TEXT = """
SAM K.
Email: sam@example.com | Phone: 9876543210
Location: Bengaluru, India

PROFESSIONAL SUMMARY
Final-year B.Tech CSE student at CMR University (CGPA 8.5/10) with hands-on experience in full stack web development using Java Spring Boot, React, and Python.

TECHNICAL SKILLS
- Languages: JavaScript, Python, Java, HTML5, CSS3, SQL
- Frameworks / Tools: React, Spring Boot, FastAPI, Tailwind CSS, Chart.js, Postman, Git, GitHub
- AI / APIs: Anthropic Claude API, Groq API, Gemini API, REST API Design, LLM Integration
- Databases: MySQL, MongoDB Atlas

WORK EXPERIENCE
YBI Foundation — Virtual Intern — AI & ML Track 06/2024 – 08/2024
- Completed structured training in Python programming and AI/ML fundamentals over 2 months.
- Built House Price Prediction System as the capstone — an end-to-end ML pipeline evaluated using RMSE.

PROJECTS
InterviewIQ — AI-Powered Interview Preparation Platform
Tech Stack: Java Spring Boot, React, MySQL, JWT Authentication

EDUCATION
CMR University, Bengaluru 2023 – 2027
B.Tech — Computer Science & Engineering | CGPA: 8.5 / 10
Gangothri PU College, Kolar Mar 2022
Class XII — PCMB | Score: 89%

CERTIFICATIONS / ACHIEVEMENTS
- Google Cloud Computing Foundations — Google Cloud / NPTEL
- Infosys Springboard 6.0 Internship — AI & Python Track
- Web Development Bootcamp — Udemy
"""

class TestResumeIntelligenceService(unittest.TestCase):

    def test_1_technical_resume_skills(self):
        result = analyze_resume(SAMPLE_RESUME_TEXT)
        skills = result["skills"]
        
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

    def test_9_btech_education_extraction(self):
        result = analyze_resume(REAL_RESUME_FORMAT_TEXT)
        education = result["education"]
        self.assertTrue(len(education) >= 2)
        btech = next((ed for ed in education if "B.Tech" in ed["degree"] or "Bachelor of Technology" in ed["degree"]), None)
        self.assertIsNotNone(btech, "B.Tech degree was not recognized!")
        self.assertEqual(btech["institution"], "CMR University")
        print("[OK] Test 9 — B.Tech & CMR University clean education extraction passed")

    def test_10_class_xii_education_extraction(self):
        result = analyze_resume(REAL_RESUME_FORMAT_TEXT)
        education = result["education"]
        class_12 = next((ed for ed in education if "Class XII" in ed["degree"] or "Higher Secondary" in ed["degree"]), None)
        self.assertIsNotNone(class_12, "Class XII education entry was not recognized!")
        self.assertEqual(class_12["graduationYear"], "2022")
        print("[OK] Test 10 — Class XII / 12th education extraction passed")

    def test_11_certifications_achievements_extraction(self):
        result = analyze_resume(REAL_RESUME_FORMAT_TEXT)
        certs = result["certifications"]
        self.assertTrue(len(certs) >= 2, f"Certifications extracted: {certs}")
        self.assertTrue(any("Google Cloud" in c or "Infosys" in c or "Udemy" in c for c in certs))
        print("[OK] Test 11 — Certifications and achievements clean extraction passed")

    def test_12_html5_css3_chartjs_detection(self):
        result = analyze_resume(REAL_RESUME_FORMAT_TEXT)
        skills = result["skills"]
        all_skills = []
        for cat in skills.values():
            all_skills.extend(cat)

        self.assertIn("HTML5", all_skills)
        self.assertIn("CSS3", all_skills)
        self.assertIn("Chart.js", all_skills)
        self.assertIn("Tailwind CSS", all_skills)
        print("[OK] Test 12 — HTML5, CSS3, Chart.js, Tailwind CSS skill extraction passed")

    def test_13_no_professional_summary_in_education(self):
        result = analyze_resume(REAL_RESUME_FORMAT_TEXT)
        education = result["education"]
        for ed in education:
            self.assertNotIn("PROFESSIONAL SUMMARY", ed["institution"])
            self.assertNotIn("Bengaluru, India", ed["institution"])
            self.assertNotIn("Final-year B.Tech", ed["institution"])
        print("[OK] Test 13 — No PROFESSIONAL SUMMARY pollution in education passed")

    def test_14_no_project_descriptions_in_certifications(self):
        result = analyze_resume(REAL_RESUME_FORMAT_TEXT)
        certs = result["certifications"]
        for cert in certs:
            self.assertNotIn("Completed structured training", cert)
            self.assertNotIn("House Price Prediction System", cert)
            self.assertNotIn("capstone", cert.lower())
        print("[OK] Test 14 — No project descriptions in certifications passed")

if __name__ == "__main__":
    unittest.main()
