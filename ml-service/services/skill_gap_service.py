import os
import re
import json
from typing import Dict, List, Any
from services.resume_service import extract_skills, format_skill_name

RELATIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "skill_relations.json")

def load_skill_relations() -> Dict[str, Any]:
    try:
        if os.path.exists(RELATIONS_PATH):
            with open(RELATIONS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[Warning] Failed to load skill_relations.json from {RELATIONS_PATH}: {e}")
    
    return {
        "aliases": {
            "react.js": "React", "reactjs": "React", "node.js": "Node.js", "nodejs": "Node.js",
            "node": "Node.js", "express.js": "Express.js", "postgres": "PostgreSQL", "aws": "AWS"
        },
        "related": {
            "React": ["Redux", "Next.js", "TypeScript"],
            "Node.js": ["Express.js", "JavaScript"],
            "Python": ["Django", "Flask", "FastAPI"]
        }
    }

SKILL_RELATIONS = load_skill_relations()

def normalize_skill_name(skill: str) -> str:
    if not skill or not isinstance(skill, str):
        return ""
    cleaned = skill.strip().lower()
    aliases = SKILL_RELATIONS.get("aliases", {})
    if cleaned in aliases:
        return aliases[cleaned]
    return format_skill_name(skill.strip())

def calculate_skill_gap(job: Dict[str, Any], candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes exact skill gap analysis, related/alias skill matches, priority levels, and coverage metrics.
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
        raise ValueError("Job object must contain title, description, or requiredSkills.")
    if not cand_resume and not cand_skills_raw:
        raise ValueError("Candidate object must contain resumeText or skills.")

    # 1. Compile required job skills
    explicit_req_set = set()
    for s in req_skills_raw:
        if s and isinstance(s, str):
            norm = normalize_skill_name(s)
            if norm:
                explicit_req_set.add(norm)

    all_req_set = set(explicit_req_set)
    if job_desc:
        desc_extracted = extract_skills(job_desc)
        for cat_skills in desc_extracted.values():
            for sk in cat_skills:
                all_req_set.add(normalize_skill_name(sk))

    if len(all_req_set) == 0:
        raise ValueError("Unable to identify required skills from job parameters.")

    total_required_skills = sorted(list(all_req_set))

    # 2. Compile candidate skills
    cand_skill_set = set()
    for s in cand_skills_raw:
        if s and isinstance(s, str):
            norm = normalize_skill_name(s)
            if norm:
                cand_skill_set.add(norm)

    if cand_resume:
        resume_extracted = extract_skills(cand_resume)
        for cat_skills in resume_extracted.values():
            for sk in cat_skills:
                cand_skill_set.add(normalize_skill_name(sk))

    candidate_skills_list = sorted(list(cand_skill_set))

    # 3. Exact Matching & Missing Skills
    exact_matches = [sk for sk in total_required_skills if sk in cand_skill_set]
    missing_skills_raw = [sk for sk in total_required_skills if sk not in cand_skill_set]

    # 4. Related / Alias Skills Detection
    related_matches = []
    related_dict = SKILL_RELATIONS.get("related", {})
    aliases_dict = SKILL_RELATIONS.get("aliases", {})

    for missing_sk in missing_skills_raw:
        # Check alias
        found_rel = None
        for cand_sk in candidate_skills_list:
            # Check if cand_sk is configured alias or related to missing_sk
            missing_rel_list = related_dict.get(missing_sk, [])
            if cand_sk in missing_rel_list:
                found_rel = {
                    "required": missing_sk,
                    "candidate": cand_sk,
                    "relationship": "Related Technology"
                }
                break

        if found_rel:
            related_matches.append(found_rel)

    # 5. Calculate Skill Match & Skill Gap Percentages
    total_req_count = len(total_required_skills)
    matched_count = len(exact_matches)
    missing_count = len(missing_skills_raw)
    related_count = len(related_matches)

    skill_match_pct = round((matched_count / total_req_count) * 100.0, 1)
    skill_gap_pct = round(100.0 - skill_match_pct, 1)

    # 6. Determine Deterministic Priority for Missing Skills
    missing_skills_prioritized = []
    job_desc_lower = job_desc.lower()
    job_title_lower = job_title.lower()

    for sk in missing_skills_raw:
        sk_lower = sk.lower()
        is_explicit = sk in explicit_req_set
        in_title = sk_lower in job_title_lower
        
        # Count occurrences in description
        occurrences = len(re.findall(rf"\b{re.escape(sk_lower)}\b", job_desc_lower)) if job_desc_lower else 0

        if is_explicit and (in_title or occurrences >= 2):
            priority = "High"
        elif is_explicit:
            priority = "Medium"
        else:
            priority = "Low"

        missing_skills_prioritized.append({
            "skill": sk,
            "priority": priority
        })

    return {
        "success": True,
        "skillMatchPercentage": skill_match_pct,
        "skillGapPercentage": skill_gap_pct,
        "totalRequiredSkills": total_req_count,
        "matchedCount": matched_count,
        "missingCount": missing_count,
        "relatedCount": related_count,
        "exactMatches": sorted(exact_matches),
        "relatedMatches": related_matches,
        "missingSkills": missing_skills_prioritized,
        "candidateSkillCount": len(candidate_skills_list),
        "method": {
            "skillExtraction": "Phase 2 NLP Resume Intelligence",
            "skillMatching": "Skill Taxonomy Set Comparison",
            "relatedSkillDetection": "Configured Skill Relationships"
        }
    }
