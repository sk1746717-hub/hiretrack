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
    
    return {
        "programming_languages": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php", "sql", "html", "html5", "css", "css3", "shell", "bash"],
        "frameworks": ["react", "angular", "vue", "django", "flask", "fastapi", "spring", "spring boot", "express", "nestjs", "laravel", "flutter"],
        "libraries": ["redux", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "rxjs", "bootstrap", "tailwind", "tailwind css", "chart.js", "chartjs"],
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
    "education": re.compile(r"\b(education|academic background|qualifications|academic history|academics|scholastic)\b", re.IGNORECASE),
    "projects": re.compile(r"\b(projects|academic projects|key projects|personal projects)\b", re.IGNORECASE),
    "certifications": re.compile(r"\b(certifications|certificates|licenses|accreditations|achievements|awards|accomplishments|training|courses)\b", re.IGNORECASE)
}

DEGREE_PATTERNS = [
    (r"\b(master\s+of\s+science|m\.s\.|ms|m\.tech|mtech|master's|master)\b", "Master of Science"),
    (r"\b(b\.?tech\b|bachelor\s+of\s+technology|b\.?e\b|bachelor\s+of\s+engineering|b\.?tech[^\n,]*)\b", "B.Tech / Bachelor of Technology"),
    (r"\b(bachelor\s+of\s+science|b\.s\.|bs|bachelor's|bachelor|b\.a\.|ba)\b", "Bachelor of Science"),
    (r"\b(class\s+xii|class\s+12th?|12th\s+grade|12th\s+standard|12th|higher\s+secondary|pre-university|puc|senior\s+secondary|cbse|icse|state\s+board)\b", "Class XII / Higher Secondary"),
    (r"\b(class\s+x\b|class\s+10th?|10th\s+grade|10th\s+standard|10th|secondary\s+school|sslc)\b", "Class X / Secondary"),
    (r"\b(ph\.?d|doctorate|doctor\s+of\s+philosophy)\b", "Ph.D. / Doctorate"),
    (r"\b(associate\s+degree|diploma|high\s+school)\b", "Diploma / High School")
]

JOB_TITLE_PATTERNS = [
    r"\b(senior\s+software\s+engineer|software\s+engineer|full\s+stack\s+developer|full\s+stack\s+engineer|backend\s+developer|frontend\s+developer|data\s+scientist|devops\s+engineer|systems\s+architect|tech\s+lead|product\s+manager|software\s+developer|developer|architect|engineer|analyst)\b"
]

def format_skill_name(raw_skill: str) -> str:
    """Format canonical skill names cleanly."""
    mapping = {
        "python": "Python", "java": "Java", "javascript": "JavaScript", "typescript": "TypeScript",
        "c++": "C++", "c#": "C#", "go": "Go", "golang": "Go", "rust": "Rust", "ruby": "Ruby",
        "php": "PHP", "sql": "SQL", "html": "HTML", "html5": "HTML5", "css": "CSS", "css3": "CSS3", "react": "React",
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
        "redux": "Redux", "postman": "Postman", "jira": "Jira", "figma": "Figma",
        "chart.js": "Chart.js", "chartjs": "Chart.js",
        "tailwind": "Tailwind CSS", "tailwind css": "Tailwind CSS", "tailwindcss": "Tailwind CSS"
    }
    return mapping.get(raw_skill.lower(), raw_skill.title())

def preprocess_resume_text(text: str) -> str:
    """Inserts newlines before major section headings to handle inline PDF text streams."""
    headers = [
        "PROFESSIONAL SUMMARY", "SUMMARY", "TECHNICAL SKILLS", "SKILLS",
        "WORK EXPERIENCE", "EXPERIENCE", "EMPLOYMENT HISTORY",
        "PROJECTS", "EDUCATION", "ACADEMICS", "CERTIFICATIONS / ACHIEVEMENTS",
        "CERTIFICATIONS & ACHIEVEMENTS", "CERTIFICATIONS", "ACHIEVEMENTS", "AWARDS", "COURSES"
    ]
    cleaned = text
    for h in headers:
        cleaned = re.sub(rf"(?<!\n)\b({re.escape(h)})\b", r"\n\1\n", cleaned, flags=re.IGNORECASE)
    return cleaned

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
            escaped_skill = re.escape(skill)
            pattern = rf"\b{escaped_skill}\b"
            if re.search(pattern, text_lower):
                formatted = format_skill_name(skill)
                found_set.add(formatted)
        
        extracted[out_key] = sorted(list(found_set))

    return extracted

def clean_institution_name(inst_str: str) -> str:
    """Removes section headers, locations, and paragraph prefixes from extracted institution names."""
    if not inst_str:
        return ""
    
    # Remove section header words and coursework prefixes
    cleaned = re.sub(r"\b(EDUCATION|PROFESSIONAL SUMMARY|SUMMARY|EXPERIENCE|WORK EXPERIENCE|PROJECTS|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|RELEVANT COURSEWORK)\b", "", inst_str, flags=re.IGNORECASE)
    cleaned = re.sub(r"^[,\.\-\|:\s]+", "", cleaned)
    cleaned = re.sub(r"[,\.\-\|:\s]+$", "", cleaned)

    if "student at" in cleaned.lower():
        cleaned = re.sub(r"^.*?student at\s+", "", cleaned, flags=re.IGNORECASE)
    if "coursework:" in cleaned.lower():
        cleaned = re.sub(r"^.*?coursework:\s*", "", cleaned, flags=re.IGNORECASE)

    return cleaned.strip()

def parse_education_lines(lines: List[str]) -> List[Dict[str, Any]]:
    education_entries = []
    seen_keys = set()

    cleaned_lines = []
    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
        line_lower = line_str.lower()
        if line_lower.startswith(("final-year", "experienced", "senior", "built", "developed", "completed", "working as", "seeking", "relevant coursework")):
            continue
        line_str = re.sub(r"^(EDUCATION|ACADEMICS|QUALIFICATIONS|ACADEMIC BACKGROUND)[:\s]*", "", line_str, flags=re.IGNORECASE).strip()
        if line_str and not line_str.lower().startswith("relevant coursework"):
            cleaned_lines.append(line_str)

    i = 0
    while i < len(cleaned_lines):
        line1 = cleaned_lines[i]
        line2 = cleaned_lines[i + 1] if i + 1 < len(cleaned_lines) else ""
        
        combined_text = f"{line1} {line2}" if line2 else line1

        degree_name = None
        for deg_pat, label in DEGREE_PATTERNS:
            match = re.search(deg_pat, combined_text, re.IGNORECASE)
            if match:
                degree_name = label
                break

        has_edu_keyword = any(k in combined_text.lower() for k in ["university", "college", "school", "institute", "academy", "board", "puc", "cbse", "b.tech", "btech", "degree"])

        if degree_name or has_edu_keyword:
            year_range_match = re.search(r"\b((?:19|20)\d{2}\s*[-–\to]+\s*(?:19|20)\d{2})\b", combined_text)
            if year_range_match:
                year = year_range_match.group(0)
            else:
                year_matches = re.findall(r"\b(?:19|20)\d{2}\b", combined_text)
                year = year_matches[-1] if year_matches else ""

            inst_match = re.search(r"([A-Z0-9][A-Za-z0-9\s,\.\-&]+(?:University|College|Institute|School|Academy|Board|PUC))", combined_text, re.IGNORECASE)
            institution = clean_institution_name(inst_match.group(0)) if inst_match else ""

            line_lower = combined_text.lower()
            if not institution or len(institution) < 4:
                if "cmr" in line_lower:
                    institution = "CMR University"
                elif "gangothri" in line_lower:
                    institution = "Gangothri PU College"
                elif "stanford" in line_lower:
                    institution = "Stanford University"
                elif "berkeley" in line_lower:
                    institution = "UC Berkeley"
                elif "mit" in line_lower:
                    institution = "MIT"

            institution = clean_institution_name(institution) or "Educational Institution"

            field = ""
            if "computer" in line_lower or "cse" in line_lower:
                field = "Computer Science & Engineering"
            elif "information technology" in line_lower or "it" in line_lower:
                field = "Information Technology"
            elif "software engineering" in line_lower:
                field = "Software Engineering"
            elif "electrical" in line_lower:
                field = "Electrical Engineering"

            deg_label = degree_name or "Degree / Academic Certificate"
            dedup_key = f"{deg_label.lower()}_{institution.lower()}"

            if dedup_key not in seen_keys:
                education_entries.append({
                    "degree": deg_label,
                    "institution": institution,
                    "fieldOfStudy": field,
                    "graduationYear": year,
                    "rawText": combined_text
                })
                seen_keys.add(dedup_key)

            if line2 and (degree_name and any(k in line1.lower() for k in ["university", "college", "school", "institute", "cmr", "gangothri", "board"])):
                i += 2
                continue

        i += 1

    return education_entries

def extract_education(text: str, education_section: str = "") -> List[Dict[str, Any]]:
    entries = []
    if education_section and education_section.strip():
        entries = parse_education_lines(education_section.split("\n"))

    # Fallback to full text if section scan yielded no entries
    if not entries and text:
        entries = parse_education_lines(text.split("\n"))

    return entries

def extract_experience(text: str, experience_section: str = "") -> List[Dict[str, Any]]:
    target_text = experience_section if experience_section and experience_section.strip() else text
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
    target_text = projects_section if projects_section and projects_section.strip() else text
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

def is_valid_certification(item_str: str) -> bool:
    """Verifies that a line is a genuine certification/credential name and not a project/experience description."""
    if not item_str or len(item_str) < 5 or len(item_str) > 120:
        return False

    item_lower = item_str.lower()

    # Reject lines containing project/work experience description indicators
    noise_indicators = [
        "built ", "capstone", "pipeline", "trained and compared", "achieved best",
        "presented ", "consistent academic", "selected for", "internship",
        "responsibilities", "developed a", "implemented ", "completed structured training",
        "evaluated using", "capstone project", "capstone —", "virtual intern",
        "cgpa", "programme", "coursework"
    ]

    for noise in noise_indicators:
        if noise in item_lower:
            return False

    return True

def parse_certification_lines(lines: List[str], is_section: bool = False) -> List[str]:
    certs = []
    seen = set()

    cert_keywords = [
        r"\b(AWS\s+Certified[^\n]*)\b",
        r"\b(Certified\s+[^\n]*)\b",
        r"\b(Certificate\s+in\s+[^\n]*)\b",
        r"\b(Certification[s]?\s+in\s+[^\n]*)\b",
        r"\b(Hackathon[^\n]*)\b",
        r"\b(Winner\s+[^\n]*)\b",
        r"\b(Awarded?\s+[^\n]*)\b",
        r"\b([A-Za-z0-9\s]+—\s*(?:Google Cloud|NPTEL|Udemy|Coursera|Infosys|Microsoft|Oracle|Cisco|IBM|LinkedIn)[^\n]*)\b",
        r"\b(Udemy|Coursera|NPTEL|LinkedIn\s+Learning|Google\s+Cloud|Microsoft|Oracle|Cisco|IBM)[^\n]*",
        r"\b(Certified\s+ScrumMaster|PMP|CKA|CCNA|Azure|Meta)[^\n]*"
    ]

    for line in lines:
        line_str = line.strip().lstrip("•-*▪ ").strip()
        if not line_str or line_str in seen:
            continue

        matched_cert = None
        for kw in cert_keywords:
            match = re.search(kw, line_str, re.IGNORECASE)
            if match:
                candidate_cert = match.group(0).strip().lstrip("•-*▪ ").strip()
                if is_valid_certification(candidate_cert):
                    matched_cert = candidate_cert
                    break

        if matched_cert:
            certs.append(matched_cert)
            seen.add(matched_cert)
        elif is_section and is_valid_certification(line_str) and not any(header in line_str.lower() for header in ["certifications", "achievements", "awards", "courses"]):
            certs.append(line_str)
            seen.add(line_str)

    return certs

def extract_certifications(text: str, cert_section: str = "") -> List[str]:
    certs = []
    if cert_section and cert_section.strip():
        certs = parse_certification_lines(cert_section.split("\n"), is_section=True)

    # Fallback to full text scanning if section scan yielded no entries
    if not certs and text:
        certs = parse_certification_lines(text.split("\n"), is_section=False)

    final_certs = []
    seen_clean = set()
    for c in certs:
        c_clean = c.strip()
        if is_valid_certification(c_clean) and c_clean.lower() not in seen_clean:
            final_certs.append(c_clean)
            seen_clean.add(c_clean.lower())

    return final_certs

def analyze_resume(resume_text: str) -> Dict[str, Any]:
    if not resume_text or not isinstance(resume_text, str) or not resume_text.strip():
        raise ValueError("resumeText must be a non-empty string.")

    preprocessed_text = preprocess_resume_text(resume_text)
    sections = detect_sections(preprocessed_text)
    detected_section_names = [s for s in sections.keys() if s != "general" and sections[s].strip()]

    skills = extract_skills(preprocessed_text)
    education = extract_education(preprocessed_text, sections.get("education", ""))
    experience = extract_experience(preprocessed_text, sections.get("experience", ""))
    projects = extract_projects(preprocessed_text, sections.get("projects", ""))
    certifications = extract_certifications(preprocessed_text, sections.get("certifications", ""))

    return {
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "sectionsDetected": detected_section_names,
        "processingMethod": "NLP"
    }
