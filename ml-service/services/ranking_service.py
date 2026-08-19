from typing import Dict, List, Any
from services.matching_service import compute_candidate_job_match

def rank_candidates(job: Dict[str, Any], candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Ranks multiple candidates for a single job description using the Phase 3 NLP Matching Engine.
    Uses deterministic tie-breaking logic and calculates explainable ranking statistics.
    """
    if not job or not isinstance(job, dict):
        raise ValueError("job must be a valid dictionary.")
    if not candidates or not isinstance(candidates, list) or len(candidates) == 0:
        raise ValueError("candidates parameter must be a non-empty list of candidate objects.")

    # Validate duplicate candidate IDs
    seen_ids = set()
    evaluated_candidates = []

    for idx, cand in enumerate(candidates):
        if not cand or not isinstance(cand, dict):
            raise ValueError(f"Candidate at index {idx} must be a valid dictionary.")

        cand_id = cand.get("id") or cand.get("candidateId") or f"cand-{idx+1}"
        cand_name = cand.get("name") or cand.get("candidateName") or cand.get("fullName") or f"Candidate {idx+1}"

        if cand_id in seen_ids:
            raise ValueError(f"Duplicate candidate ID '{cand_id}' detected. Candidate IDs must be unique.")
        seen_ids.add(cand_id)

        # 1. Reuse Phase 3 Matching Engine
        match_result = compute_candidate_job_match(job, cand)

        skill_pct = match_result["skillMatchPercentage"]
        sem_sim_pct = match_result["semanticSimilarityPercentage"]
        match_score = match_result["matchScore"]

        # Component feature breakdown
        skill_component = round(0.60 * skill_pct, 1)
        sem_component = round(0.40 * sem_sim_pct, 1)

        evaluated_candidates.append({
            "candidateId": str(cand_id),
            "candidateName": str(cand_name),
            "matchScore": match_score,
            "skillMatchPercentage": skill_pct,
            "semanticSimilarityPercentage": sem_sim_pct,
            "matchedSkills": match_result["matchedSkills"],
            "missingSkills": match_result["missingSkills"],
            "recommendation": match_result["recommendation"],
            "featureContribution": {
                "skillMatchScore": skill_component,
                "semanticSimilarityScore": sem_component,
                "finalMatchScore": match_score,
                "rankingBasis": "60% Skill Match + 40% Semantic Similarity"
            },
            "originalIndex": idx
        })

    # 2. Deterministic Sorting & Tie-Breaking
    # Primary: matchScore (descending)
    # Secondary: skillMatchPercentage (descending)
    # Tertiary: semanticSimilarityPercentage (descending)
    # Quaternary: originalIndex (ascending)
    sorted_candidates = sorted(
        evaluated_candidates,
        key=lambda c: (
            -c["matchScore"],
            -c["skillMatchPercentage"],
            -c["semanticSimilarityPercentage"],
            c["originalIndex"]
        )
    )

    # 3. Format Ranked Output
    ranked_list = []
    scores = []
    strong_cnt = 0
    good_cnt = 0
    mod_cnt = 0
    low_cnt = 0

    for rank_num, item in enumerate(sorted_candidates, start=1):
        scores.append(item["matchScore"])

        rec = item["recommendation"]
        if rec == "Strong Match":
            strong_cnt += 1
        elif rec == "Good Match":
            good_cnt += 1
        elif rec == "Moderate Match":
            mod_cnt += 1
        else:
            low_cnt += 1

        ranked_list.append({
            "rank": rank_num,
            "candidateId": item["candidateId"],
            "candidateName": item["candidateName"],
            "matchScore": item["matchScore"],
            "skillMatchPercentage": item["skillMatchPercentage"],
            "semanticSimilarityPercentage": item["semanticSimilarityPercentage"],
            "matchedSkills": item["matchedSkills"],
            "missingSkills": item["missingSkills"],
            "recommendation": item["recommendation"],
            "featureContribution": item["featureContribution"]
        })

    # 4. Calculate Aggregate Ranking Statistics
    total_cnt = len(ranked_list)
    avg_score = round(sum(scores) / total_cnt, 1) if total_cnt > 0 else 0.0
    highest_score = max(scores) if total_cnt > 0 else 0.0
    lowest_score = min(scores) if total_cnt > 0 else 0.0

    return {
        "success": True,
        "totalCandidates": total_cnt,
        "rankedCandidates": ranked_list,
        "statistics": {
            "totalCandidates": total_cnt,
            "averageMatchScore": avg_score,
            "highestMatchScore": highest_score,
            "lowestMatchScore": lowest_score,
            "strongMatches": strong_cnt,
            "goodMatches": good_cnt,
            "moderateMatches": mod_cnt,
            "lowMatches": low_cnt
        }
    }
