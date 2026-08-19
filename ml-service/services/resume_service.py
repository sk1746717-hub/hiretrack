import os
import re
import json
from typing import Dict, List, Any

TAXONOMY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "skills.json")

def load_skill_taxonomy() -> Dict[str, List[str]]:
    try:
        if os.path.exists(TAXONOMY_PATH):
            with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[Warning] Failed to load skill taxonomy from {TAXONOMY_PATH}: {e}")
    
    # Embedded fallback taxonomy
    return {
        "programming_languages": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php", "sql", "html", "css"],
        "frameworks": ["react", "angular", "vue", "django", "flask", "fastapi", "spring", "spring boot", "express", "nestjs", "laravel", "flutter"],
        "libraries": ["redux", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "rxjs", "bootstrap", "tailwind"],
        "databases": ["mongodb", "postgresql", "mysql", "redis", "sqlite", "oracle", "elasticsearch", "dynamodb", "firebase"],
        "cloud": ["aws", "azure", "gcp", "google cloud", "heroku", "vercel", "digitalocean"],
        "devops": ["docker", "kubernetes", "jenkins", "git", "github actions", "gitlab", "terraform", "ansible", "nginx", "linux"],
        "tools": ["postman", "jira", "figma", "webpack", "vite", "vs code", "confluence", "swagger"],
        "ai_ml": ["scikit-learn", "tensorflow", "pytorch", "keras", "opencv", "nltk", "spacy", "huggingface", "llm", "rag", "langchain", "groq", "openai"]
    }

SKILL_TAXONOMY = load_skill_taxonomy()

SECTION_PATTERNS = {
    "summary": re.compile(r"\b(summary|objective|profile|about me|professional summary)\b", re.IGNORECASE),
    "skills": re.compile(r"\b(skills|technical skills|core competencies|technologies|expertise)\b", re.IGNORECASE),
    "experience": re.compile(r"\b(experience|work experience|employment history|work history|professional experience)\b", re.IGNORECASE),
    "education": re.compile(r"\b(education|academic background|qualifications|academic history)\b", re.IGNORECASE),
    "projects": re.compile(r"\b(projects|academic projects|key projects|personal projects)\b", re.IGNORECASE),
    "certifications": re.compile(r"\b(certifications|certificates|licenses|accreditations)\b", re.IGNORECASE)
}

DEGREE_PATTERNS = [
    r"\b(master\s+of\s+science|m\.s\.|ms|m\.tech|mtech|master's|master)\b",
    r"\b(bachelor\s+of\s+science|b\.s\.|bs|b\.tech|btech|bachelor's|bachelor|b\.a\.|ba)\b",
    r"\b(ph\.?d|doctorate|doctor\s+of\s+philosophy)\b",
    r"\b(associate\s+degree|diploma|high\s+school)\b"
]

JOB_TITLE_PATTERNS = [
    r"\b(senior\s+software\s+engineer|software\s+engineer|full\s+stack\s+developer|full\s+stack\s+engineer|backend\s+developer|frontend\s+developer|data\s+scientist|devops\s+engineer|systems\s+architect|tech\s+lead|product\s+manager|software\s+developer|developer|architect|engineer|analyst)\b"
]

def format_skill_name(raw_skill: str) -> str:
    """Format canonical skill names cleanly."""
    mapping = {
        "python": "Python", "java": "Java", "javascript": "JavaScript", "typescript": "TypeScript",
        "c++": "C++", "c#": "C#", "go": "Go", "golang": "Go", "rust": "Rust", "ruby": "Ruby",
        "php": "PHP", "sql": "SQL", "html": "HTML", "css": "CSS", "react": "React",
        "react.js": "React", "reactjs": "React", "angular": "Angular", "vue": "Vue.js",
        "vue.js": "Vue.js", "next.js": "Next.js", "django": "Django", "flask": "Flask",
        "fastapi": "FastAPI", "spring": "Spring", "spring boot": "Spring Boot",
        "express": "Express.js", "express.js": "Express.js", "nestjs": "NestJS",
        "node.js": "Node.js", "nodejs": "Node.js", "node": "Node.js",
        "mongodb": "MongoDB", "postgresql": "PostgreSQL", "postgres": "PostgreSQL",

        "mysql": "MySQL", "redis": "Redis", "sqlite": "SQLite", "aws": "AWS",
        "amazon web services": "AWS", "azure": "Azure", "gcp": "Google Cloud (GCP)",
        "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
        "jenkins": "Jenkins", "git": "Git", "github": "GitHub", "linux": "Linux",
        "scikit-learn": "Scikit-Learn", "sklearn": "Scikit-Learn", "pandas": "Pandas",
        "numpy": "NumPy", "tensorflow": "TensorFlow", "pytorch": "PyTorch",
        "redux": "Redux", "postman": "Postman", "jira": "Jira", "figma": "Figma"
    }
    return mapping.get(raw_skill.lower(), raw_skill.title())

def detect_sections(text: str) -> Dict[str, str]:
    lines = text.split("\n")
    sections = {}
    current_section = "general"
    sections[current_section] = []

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        
        # Check if line matches a section header
        matched_sec = None
        for sec_name, pattern in SECTION_PATTERNS.items():
            if pattern.search(line_clean) and len(line_clean) < 40:
                matched_sec = sec_name
                break
        
        if matched_sec:
            current_section = matched_sec
            if current_section not in sections:
                sections[current_section] = []
        else:
            sections[current_section].append(line_clean)
    
    return {sec: "\n".join(lines_list) for sec, lines_list in sections.items()}

def extract_skills(text: str) -> Dict[str, List[str]]:
    text_lower = text.lower()
    extracted = {
        "programmingLanguages": [],
        "frameworks": [],
        "libraries": [],
        "databases": [],
        "cloud": [],
        "devops": [],
        "tools": [],
        "aiMl": []
    }

    category_key_map = {
        "programming_languages": "programmingLanguages",
        "frameworks": "frameworks",
        "libraries": "libraries",
        "databases": "databases",
        "cloud": "cloud",
        "devops": "devops",
        "tools": "tools",
        "ai_ml": "aiMl"
    }

    for cat, skill_list in SKILL_TAXONOMY.items():
        out_key = category_key_map.get(cat, "tools")
        found_set = set()
        
        for skill in skill_list:
            # Word boundary regex search to prevent partial string matches
            escaped_skill = re.escape(skill)
            pattern = rf"\b{escaped_skill}\b"
            if re.search(pattern, text_lower):
                formatted = format_skill_name(skill)
                found_set.add(formatted)
        
        extracted[out_key] = sorted(list(found_set))

    return extracted

def extract_education(text: str, education_section: str = "") -> List[Dict[str, Any]]:
    target_text = education_section if education_section else text
    education_entries = []

    lines = target_text.split("\n")
    for line in lines:
        line_str = line.strip()
        degree_found = None
        for deg_pat in DEGREE_PATTERNS:
            match = re.search(deg_pat, line_str, re.IGNORECASE)
            if match:
                degree_found = match.group(0)
                break
        
        if degree_found or ("university" in line_str.lower() or "college" in line_str.lower() or "institute" in line_str.lower()):
            year_match = re.search(r"\b(19|20)\d{2}\b", line_str)
            year = year_match.group(0) if year_match else ""
            
            # Simple heuristic for institution name
            inst_match = re.search(r"([A-Z][A-Za-z\s]+(?:University|College|Institute|School|Academy))", line_str)
            institution = inst_match.group(0) if inst_match else ""

            education_entries.append({
                "degree": degree_found.title() if degree_found else "Degree",
                "institution": institution or "University/College",
                "fieldOfStudy": "Computer Science & Engineering" if "computer" in line_str.lower() or "engineering" in line_str.lower() else "",
                "graduationYear": year,
                "rawText": line_str
            })

    return education_entries

def extract_experience(text: str, experience_section: str = "") -> List[Dict[str, Any]]:
    target_text = experience_section if experience_section else text
    experience_entries = []

    lines = target_text.split("\n")
    for line in lines:
        line_str = line.strip()
        title_found = None
        for tit_pat in JOB_TITLE_PATTERNS:
            match = re.search(tit_pat, line_str, re.IGNORECASE)
            if match:
                title_found = match.group(0)
                break
        
        if title_found:
            # Look for company indicators or dates
            date_match = re.search(r"\b((?:19|20)\d{2})\b(?:\s*[-–\to]+\s*|\s+)(\b(?:19|20)\d{2}\b|Present|Current)", line_str, re.IGNORECASE)
            duration = date_match.group(0) if date_match else ""
            
            experience_entries.append({
                "title": title_found.title(),
                "company": "Company/Organization",
                "duration": duration,
                "rawText": line_str
            })

    return experience_entries

def extract_projects(text: str, projects_section: str = "") -> List[Dict[str, Any]]:
    target_text = projects_section if projects_section else text
    project_entries = []

    lines = target_text.split("\n")
    for line in lines:
        line_str = line.strip()
        if "|" in line_str or "-" in line_str:
            parts = [p.strip() for p in re.split(r"[|\-]", line_str)]
            if len(parts) >= 2 and len(parts[0]) < 50:
                project_entries.append({
                    "name": parts[0],
                    "technologies": [t.strip() for t in parts[1].split(",") if t.strip()],
                    "description": line_str
                })

    return project_entries

def extract_certifications(text: str, cert_section: str = "") -> List[str]:
    target_text = cert_section if cert_section else text
    certs = []
    
    cert_keywords = [
        r"\b(AWS\s+Certified[^\n]*)\b",
        r"\b(Certified\s+ScrumMaster[^\n]*)\b",
        r"\b(Google\s+Cloud\s+Certified[^\n]*)\b",
        r"\b(Azure\s+Administrator[^\n]*)\b",
        r"\b(PMP|Project\s+Management\s+Professional)\b",
        r"\b(CKA|Certified\s+Kubernetes\s+Administrator)\b",
        r"\b(Cisco\s+CCNA[^\n]*)\b"
    ]

    for line in target_text.split("\n"):
        line_str = line.strip()
        for kw in cert_keywords:
            match = re.search(kw, line_str, re.IGNORECASE)
            if match:
                certs.append(match.group(0).strip())

    return list(set(certs))

def analyze_resume(resume_text: str) -> Dict[str, Any]:
    if not resume_text or not isinstance(resume_text, str) or not resume_text.strip():
        raise ValueError("resumeText must be a non-empty string.")

    sections = detect_sections(resume_text)
    detected_section_names = [s for s in sections.keys() if s != "general" and sections[s].strip()]

    skills = extract_skills(resume_text)
    education = extract_education(resume_text, sections.get("education", ""))
    experience = extract_experience(resume_text, sections.get("experience", ""))
    projects = extract_projects(resume_text, sections.get("projects", ""))
    certifications = extract_certifications(resume_text, sections.get("certifications", ""))

    return {
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "sectionsDetected": detected_section_names,
        "processingMethod": "NLP"
    }
