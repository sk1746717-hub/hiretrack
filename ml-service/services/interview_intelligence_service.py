import re
from typing import Dict, List, Any
from services.resume_service import extract_skills, format_skill_name
from services.skill_gap_service import normalize_skill_name

def normalize_score(val: Any, default: float = 70.0) -> float:
    """Normalize score values to a 0.0-100.0 scale, handling 1-5 scale ratings if provided."""
    if val is None:
        return default
    try:
        score = float(val)
        if 1.0 <= score <= 5.0:
            return score * 20.0  # Scale 5-point rating to 100
        return min(max(score, 0.0), 100.0)
    except (ValueError, TypeError):
        return default

def analyze_interview(job: Dict[str, Any], candidate: Dict[str, Any], interview_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes structured interview information, scorecards, and notes using NLP skill extraction
    and multi-factor rubric evaluation.
    """
    if not job or not isinstance(job, dict):
        job = {}
    if not candidate or not isinstance(candidate, dict):
        candidate = {}
    if not interview_data or not isinstance(interview_data, dict):
        interview_data = {}

    job_title = job.get("title", "")
    job_desc = job.get("description", "")
    req_skills_raw = job.get("requiredSkills", []) or []

    cand_resume = candidate.get("resumeText", "")
    cand_skills_raw = candidate.get("skills", []) or []

    notes = interview_data.get("interviewNotes", "") or interview_data.get("feedback", "") or ""
    probes = interview_data.get("technicalProbesAnswered", []) or []

    # 1. Extract required skills
    required_skills_set = set()
    for s in req_skills_raw:
        if s and isinstance(s, str):
            norm = normalize_skill_name(s)
            if norm:
                required_skills_set.add(norm)

    if job_desc:
        desc_extracted = extract_skills(job_desc)
        for cat_skills in desc_extracted.values():
            for sk in cat_skills:
                required_skills_set.add(normalize_skill_name(sk))

    total_required_skills = sorted(list(required_skills_set))

    # 2. Extract candidate skills & interview text evidence
    interview_text_block = f"{notes} {' '.join([str(p) for p in probes])}"
    interview_extracted_skills = extract_skills(interview_text_block)

    cand_skill_set = set()
    for s in cand_skills_raw:
        if s and isinstance(s, str):
            cand_skill_set.add(normalize_skill_name(s))

    if cand_resume:
        resume_extracted = extract_skills(cand_resume)
        for cat_skills in resume_extracted.values():
            for sk in cat_skills:
                cand_skill_set.add(normalize_skill_name(sk))

    # Demonstrated skills during interview
    demonstrated_set = set()
    for cat_skills in interview_extracted_skills.values():
        for sk in cat_skills:
            demonstrated_set.add(normalize_skill_name(sk))

    # 3. Categorize Skill Coverage
    covered_skills = []
    partially_covered_skills = []
    not_demonstrated_skills = []

    for req_sk in total_required_skills:
        if req_sk in demonstrated_set or (req_sk in cand_skill_set and notes and len(notes) < 50):
            covered_skills.append(req_sk)
        elif req_sk in cand_skill_set:
            partially_covered_skills.append(req_sk)
        else:
            not_demonstrated_skills.append(req_sk)

    total_req_cnt = len(total_required_skills)
    if total_req_cnt > 0:
        skill_coverage_pct = round(((len(covered_skills) + 0.5 * len(partially_covered_skills)) / total_req_cnt) * 100.0, 1)
        skill_coverage_pct = min(max(skill_coverage_pct, 0.0), 100.0)
    else:
        skill_coverage_pct = 75.0

    # 4. Normalize Scores
    tech_score = normalize_score(interview_data.get("technicalScore"), default=75.0)
    comm_score = normalize_score(interview_data.get("communicationScore"), default=75.0)
    prob_score = normalize_score(interview_data.get("problemSolvingScore"), default=75.0)
    assess_score = normalize_score(interview_data.get("assessmentScore"), default=tech_score)

    # 5. Technical Competency Level
    combined_tech_prob = (0.6 * tech_score) + (0.4 * prob_score)
    if combined_tech_prob >= 85.0:
        competency_level = "Expert"
    elif combined_tech_prob >= 70.0:
        competency_level = "Proficient"
    elif combined_tech_prob >= 50.0:
        competency_level = "Developing"
    else:
        competency_level = "Basic"

    # 6. Extract Strengths & Weaknesses
    strengths = []
    weaknesses = []

    if covered_skills:
        strengths.append(f"Demonstrated solid technical understanding of core skills: {', '.join(covered_skills[:3])}.")
    if tech_score >= 80.0:
        strengths.append("High technical score demonstrated during evaluation probes.")
    if prob_score >= 80.0:
        strengths.append("Strong algorithmic and logical problem-solving ability.")
    if comm_score >= 80.0:
        strengths.append("Clear and effective technical communication style.")

    if not strengths:
        strengths.append("Candidate completed structured interview evaluation.")

    if not_demonstrated_skills:
        weaknesses.append(f"Unverified or unaddressed required skills during interview: {', '.join(not_demonstrated_skills[:3])}.")
    if tech_score < 60.0:
        weaknesses.append("Lower technical assessment score on core competency questions.")
    if prob_score < 60.0:
        weaknesses.append("Struggled with complex scenario problem-solving probes.")

    if not weaknesses:
        weaknesses.append("No major technical flaws identified during interview probes.")

    # 7. Identify Interview Skill Gaps
    interview_gaps = []
    for sk in not_demonstrated_skills:
        priority = "High" if sk in req_skills_raw else "Medium"
        interview_gaps.append({"skill": sk, "priority": priority})

    # 8. Overall Composite Score & Recommendation
    overall_score = round(
        (0.40 * tech_score) +
        (0.30 * skill_coverage_pct) +
        (0.15 * prob_score) +
        (0.15 * comm_score),
        1
    )

    if overall_score >= 85.0:
        recommendation = "Strongly Recommend Hire"
    elif overall_score >= 70.0:
        recommendation = "Recommend Hire"
    elif overall_score >= 50.0:
        recommendation = "Consider / Secondary Interview"
    else:
        recommendation = "Not Recommended"

    # Text summary assessment
    assessment_summary = (
        f"Candidate scored {tech_score:.0f}% in technical competency ({competency_level}) "
        f"and demonstrated {skill_coverage_pct:.0f}% coverage of required role skills. "
        f"Main covered competencies include {', '.join(covered_skills[:3]) if covered_skills else 'general technical skills'}."
    )

    return {
        "success": True,
        "overallInterviewScore": overall_score,
        "technicalCompetencyLevel": competency_level,
        "technicalCompetencyScore": tech_score,
        "communicationScore": comm_score,
        "problemSolvingScore": prob_score,
        "assessmentScore": assess_score,
        "skillCoveragePercentage": skill_coverage_pct,
        "skillCoverage": {
            "coveredSkills": covered_skills,
            "partiallyCoveredSkills": partially_covered_skills,
            "notDemonstratedSkills": not_demonstrated_skills
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "interviewSkillGaps": interview_gaps,
        "overallAssessment": assessment_summary,
        "recommendation": recommendation,
        "method": "NLP Keyword Extraction & Multi-Factor Rubric Analysis"
    }
