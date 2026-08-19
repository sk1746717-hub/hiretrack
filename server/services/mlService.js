const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

const postJSON = async (endpoint, data) => {
  const url = `${ML_SERVICE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const getJSON = async (endpoint) => {
  const url = `${ML_SERVICE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/**
 * Health check status of Python AIML service
 */
export const getHealth = async () => {
  try {
    return await getJSON("/health");
  } catch (error) {
    console.warn("[ML Service Warning] Python AIML service offline/unreachable:", error.message);
    return {
      status: "offline",
      service: "HireTrack Python AIML Engine",
      error: "Python AIML service temporarily unavailable",
    };
  }
};

/**
 * Phase 2 — Resume Intelligence (NLP skill extraction, education, experience, projects)
 */
export const analyzeResume = async (resumeText) => {
  try {
    return await postJSON("/analyze-resume", { resumeText });
  } catch (error) {
    console.warn("ML analyzeResume error:", error.message);
    return {
      success: false,
      service: "aiml",
      error: "AIML Resume Intelligence service temporarily unavailable",
    };
  }
};

/**
 * Phase 3 — Job-Candidate Semantic Matching (TF-IDF + Cosine Similarity + Skill Match)
 */
export const matchCandidate = async (job, candidate) => {
  try {
    return await postJSON("/match-candidate", { job, candidate });
  } catch (error) {
    console.warn("ML matchCandidate error:", error.message);
    return {
      success: false,
      service: "aiml",
      error: "AIML Candidate Matching service temporarily unavailable",
    };
  }
};

/**
 * Phase 4 — Candidate Ranking
 */
export const rankCandidates = async (job, candidates) => {
  try {
    return await postJSON("/rank-candidates", { job, candidates });
  } catch (error) {
    console.warn("ML rankCandidates error:", error.message);
    return {
      success: false,
      service: "aiml",
      error: "AIML Candidate Ranking service temporarily unavailable",
    };
  }
};

/**
 * Phase 5 — Skill Gap Analysis
 */
export const analyzeSkillGap = async (job, candidate) => {
  try {
    return await postJSON("/skill-gap", { job, candidate });
  } catch (error) {
    console.warn("ML analyzeSkillGap error:", error.message);
    return {
      success: false,
      service: "aiml",
      error: "AIML Skill Gap service temporarily unavailable",
    };
  }
};

/**
 * Phase 6 — ML Candidate Success Prediction (RandomForest model)
 */
export const predictSuccess = async (features) => {
  try {
    return await postJSON("/predict-success", features);
  } catch (error) {
    console.warn("ML predictSuccess error:", error.message);
    return {
      success: false,
      service: "aiml",
      error: "AIML Candidate Success Prediction service temporarily unavailable",
    };
  }
};

/**
 * Phase 7 — AI Interview Intelligence
 */
export const analyzeInterview = async (job, candidate, interviewData) => {
  try {
    return await postJSON("/interview-analysis", { job, candidate, interviewData });
  } catch (error) {
    console.warn("ML analyzeInterview error:", error.message);
    return {
      success: false,
      service: "aiml",
      error: "AIML Interview Intelligence service temporarily unavailable",
    };
  }
};

export default {
  getHealth,
  analyzeResume,
  matchCandidate,
  rankCandidates,
  analyzeSkillGap,
  predictSuccess,
  analyzeInterview,
};
