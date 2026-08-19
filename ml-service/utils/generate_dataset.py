import os
import numpy as np
import pandas as pd

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_recruitment_data.csv")

def generate_synthetic_dataset(num_samples: int = 800, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    # 1. Feature Generation with realistic distributions
    skill_match = np.random.uniform(10.0, 100.0, num_samples)
    semantic_sim = np.clip(skill_match + np.random.normal(0, 15, num_samples), 0.0, 100.0)
    
    experience_years = np.clip(np.random.gamma(2.0, 2.0, num_samples), 0.0, 15.0)
    interview_score = np.clip(np.random.normal(65.0, 18.0, num_samples), 0.0, 100.0)
    assessment_score = np.clip(0.6 * skill_match + np.random.normal(15, 10, num_samples), 0.0, 100.0)
    
    total_req_skills = np.random.randint(3, 10, num_samples)
    req_matched = np.round((skill_match / 100.0) * total_req_skills).astype(int)
    skill_gap = np.clip(100.0 - skill_match, 0.0, 100.0)

    # 2. Target Generation (Multi-factor composite score with controlled noise)
    # Composite score prevents target leakage while maintaining realistic recruitment relationships
    composite = (
        0.25 * skill_match +
        0.20 * semantic_sim +
        0.20 * interview_score +
        0.15 * assessment_score +
        0.10 * np.minimum(experience_years * 10, 100.0) -
        0.10 * skill_gap +
        np.random.normal(0, 6.0, num_samples)  # Gaussian noise
    )

    success = (composite >= 62.0).astype(int)

    df = pd.DataFrame({
        "skill_match_percentage": np.round(skill_match, 1),
        "semantic_similarity_percentage": np.round(semantic_sim, 1),
        "relevant_experience_years": np.round(experience_years, 1),
        "interview_score": np.round(interview_score, 1),
        "assessment_score": np.round(assessment_score, 1),
        "required_skills_matched": req_matched,
        "total_required_skills": total_req_skills,
        "skill_gap_percentage": np.round(skill_gap, 1),
        "success": success
    })

    df.to_csv(DATA_PATH, index=False)
    print(f"Synthetic dataset created successfully at {DATA_PATH} with {len(df)} rows.")
    return df

if __name__ == "__main__":
    generate_synthetic_dataset()
