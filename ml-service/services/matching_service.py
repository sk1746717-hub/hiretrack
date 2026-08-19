import re
import numpy as np
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from services.resume_service import extract_skills, format_skill_name

def preprocess_text(text: str) -> str:
    """Normalize text while preserving technical tokens like C++, C#, .NET, Node.js, React.js."""
    if not text or not isinstance(text, str):
        return ""
    
    # Preserve key technical tokens before standard punctuation cleaning
    text_clean = text.strip()
    
    # Replace newlines and excessive whitespace with a single space
    text_clean = re.sub(r"\s+", " ", text_clean)
    
    return text_clean

def normalize_skill(skill_name: str) -> str:
    """Canonicalize skill names for robust set operations."""
    if not skill_name or not isinstance(skill_name, str):
        return ""
    return format_skill_name(skill_name.strip())

def compute_semantic_similarity(job_text: str, candidate_text: str) -> float:
    """Compute TF-IDF vectorization and Cosine Similarity between Job and Candidate text."""
    clean_job = preprocess_text(job_text)
    clean_cand = preprocess_text(candidate_text)

    if not clean_job or not clean_cand:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([clean_job, clean_cand])
        
        sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        raw_sim = float(sim_matrix[0][0])
        
        # Scale 0.0-1.0 to 0.0-100.0
        return round(min(max(raw_sim * 100.0, 0.0), 100.0), 2)
    except Exception as e:
        print(f"[Warning] TF-IDF computation warning: {e}")
        return 0.0

def compute_candidate_job_match(job: Dict[str, Any], candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes transparent, deterministic match analysis using TF-IDF + Cosine Similarity and Skill Set Overlap.
    """
    if not job or not isinstance(job, dict):
        raise ValueError("job must be a valid dictionary.")
    if not candidate or not isinstance(candidate, dict):
        raise ValueError("candidate must be a valid dictionary.")

    job_title = job.get("title", "")
    job_desc = job.get("description", "")
    req_skills_raw = job.get("requiredSkills", []) or []

    cand_resume = candidate.get("resumeText", "")
    cand_skills_raw = candidate.get("skills", []) or []

    if not job_title and not job_desc and not req_skills_raw:
        raise ValueError("Job object must contain at least title, description, or requiredSkills.")
    if not cand_resume and not cand_skills_raw:
        raise ValueError("Candidate object must contain resumeText or skills.")

    # 1. Compile required skills for job
    required_skills_set = set()
    for s in req_skills_raw:
        if s and isinstance(s, str):
            required_skills_set.add(normalize_skill(s))

    # Also extract skills from job description if list is small or empty
    if job_desc:
        extracted_job_skills = extract_skills(job_desc)
        for cat_skills in extracted_job_skills.values():
            for sk in cat_skills:
                required_skills_set.add(normalize_skill(sk))

    required_skills_list = sorted(list(required_skills_set))

    # 2. Compile candidate skills
    candidate_skills_set = set()
    for s in cand_skills_raw:
        if s and isinstance(s, str):
            candidate_skills_set.add(normalize_skill(s))

    if cand_resume:
        extracted_cand_skills = extract_skills(cand_resume)
        for cat_skills in extracted_cand_skills.values():
            for sk in cat_skills:
                candidate_skills_set.add(normalize_skill(sk))

    candidate_skills_list = sorted(list(candidate_skills_set))

    # 3. Calculate Matched and Missing Skills
    matched_skills = [sk for sk in required_skills_list if sk in candidate_skills_set]
    missing_skills = [sk for sk in required_skills_list if sk not in candidate_skills_set]

    # 4. Calculate Skill Match Percentage
    if len(required_skills_list) > 0:
        skill_match_pct = (len(matched_skills) / len(required_skills_list)) * 100.0
    else:
        skill_match_pct = 100.0 if len(candidate_skills_list) > 0 else 50.0

    skill_match_pct = round(min(max(skill_match_pct, 0.0), 100.0), 2)

    # 5. Calculate TF-IDF Cosine Similarity
    job_full_text = f"{job_title} {job_desc} {' '.join(required_skills_list)}"
    cand_full_text = f"{cand_resume} {' '.join(candidate_skills_list)}"
    
    semantic_sim_pct = compute_semantic_similarity(job_full_text, cand_full_text)

    # 6. Calculate Final Match Score (60% Skill Match + 40% Semantic Similarity)
    final_match_score = round((0.60 * skill_match_pct) + (0.40 * semantic_sim_pct), 1)

    # 7. Recommendation Threshold Categorization
    if final_match_score >= 85.0:
        recommendation = "Strong Match"
    elif final_match_score >= 70.0:
        recommendation = "Good Match"
    elif final_match_score >= 50.0:
        recommendation = "Moderate Match"
    else:
        recommendation = "Low Match"

    return {
        "success": True,
        "matchScore": final_match_score,
        "skillMatchPercentage": skill_match_pct,
        "semanticSimilarityPercentage": semantic_sim_pct,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "recommendation": recommendation,
        "method": {
            "skillMatching": "Skill Taxonomy & Set Overlap",
            "semanticMatching": "TF-IDF + Cosine Similarity",
            "finalScoring": "60% Skill Match + 40% Semantic Similarity"
        }
    }
